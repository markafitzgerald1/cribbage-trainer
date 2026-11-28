"""Exercise the rolling policy release updater with a synthetic ZIP."""

from gzip import compress
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch
from zipfile import ZipFile

from updatePolicyShards import ASSET, RELEASE_URL, update

PONE = "pone/A_2_3_4.bin.gz"
DEALER = "dealer/5_6_7_8.bin.gz"
ZIP_URL = "https://example.com/policy.zip"
SHARDS = {PONE: compress(b"pone"), DEALER: compress(b"dealer")}


def digest(data):
    return sha256(data).hexdigest()


def fixture(*, bad_shard=False, extra_member=False):
    index = json.dumps(
        {
            "schema": "pegging-policy-shards.v1",
            "probability_denominator": 1000,
            "shards": [
                {"file": name, "bytes": len(data), "sha256": digest(data)}
                for name, data in SHARDS.items()
            ],
        },
        indent=2,
    ).encode() + b"\n"
    files = {"shards.json": index, **SHARDS}
    if bad_shard:
        files[DEALER] = bytes(len(SHARDS[DEALER]))
    if extra_member:
        files["unexpected.bin"] = b"extra"
    buffer = BytesIO()
    with ZipFile(buffer, "w") as archive:
        for name, data in files.items():
            archive.writestr(name, data)
    return index, buffer.getvalue()


def release(zip_bytes, index):
    return {
        "draft": False,
        "prerelease": False,
        "body": f"Release notes\n- shards.json SHA-256: `{digest(index)}`\n",
        "assets": [
            {
                "name": ASSET,
                "browser_download_url": ZIP_URL,
                "digest": f"sha256:{digest(zip_bytes)}",
            }
        ],
    }


class PolicyUpdaterTest(unittest.TestCase):
    def setUp(self):
        temporary = TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.output = Path(temporary.name) / "public" / "policy"
        self.output.mkdir(parents=True)
        self.previous = self.output / "previous.bin"
        self.previous.write_bytes(b"previous set")

    def run_update(self, info, archive):
        responses = {RELEASE_URL: json.dumps(info).encode(), ZIP_URL: archive}
        with patch("updatePolicyShards.download", side_effect=responses.__getitem__):
            return update(self.output)

    def test_installs_exact_published_bytes_and_replaces_previous_set(self):
        index, archive = fixture()
        self.assertEqual(self.run_update(release(archive, index), archive), 2)
        self.assertFalse(self.previous.exists())
        for name, data in {"shards.json": index, **SHARDS}.items():
            self.assertEqual((self.output / name).read_bytes(), data)

    def test_rejects_wrong_zip_digest(self):
        index, archive = fixture()
        with self.assertRaisesRegex(ValueError, "ZIP|zip"):
            self.run_update(release(b"other ZIP", index), archive)

    def test_rejects_wrong_index_digest(self):
        index, archive = fixture()
        with self.assertRaisesRegex(ValueError, "shards.json SHA-256 mismatch"):
            self.run_update(release(archive, index + b" "), archive)

    def test_rejects_wrong_second_shard_digest_before_any_install(self):
        index, archive = fixture(bad_shard=True)
        with self.assertRaisesRegex(ValueError, "dealer/5_6_7_8"):
            self.run_update(release(archive, index), archive)
        self.assertEqual(list(self.output.iterdir()), [self.previous])
        self.assertEqual(self.previous.read_bytes(), b"previous set")

    def test_rejects_unlisted_zip_member(self):
        index, archive = fixture(extra_member=True)
        with self.assertRaisesRegex(ValueError, "ZIP members"):
            self.run_update(release(archive, index), archive)
