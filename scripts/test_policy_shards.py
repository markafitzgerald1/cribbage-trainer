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


def fixture(*, bad_shard=False, extra_member=False, shards=SHARDS, change_index=None):
    index_data = {
        "schema": "pegging-policy-shards.v1",
        "probability_denominator": 1000,
        "shards": [
            {"file": name, "bytes": len(data), "sha256": digest(data)}
            for name, data in shards.items()
        ],
    }
    if change_index is not None:
        change_index(index_data)
    index = json.dumps(index_data, indent=2).encode() + b"\n"
    files = {"shards.json": index, **shards}
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

    def test_rejects_invalid_release_metadata_before_downloading_zip(self):
        index, archive = fixture()
        valid = release(archive, index)
        asset = valid["assets"][0]
        cases = {
            "draft": ({"draft": True}, "published policy ZIP"),
            "prerelease": ({"prerelease": True}, "published policy ZIP"),
            "no assets": ({"assets": []}, "published policy ZIP"),
            "extra asset": ({"assets": [asset, asset]}, "published policy ZIP"),
            "wrong asset": (
                {"assets": [{**asset, "name": "other.zip"}]}, "published policy ZIP"
            ),
            "missing pin": ({"body": "Release notes"}, "one index checksum"),
            "duplicate pin": ({"body": valid["body"] * 2}, "one index checksum"),
            "malformed asset checksum": (
                {"assets": [{**asset, "digest": "sha256:123"}]}, "policy ZIP SHA-256"
            ),
        }
        for label, (changes, message) in cases.items():
            with self.subTest(label=label):
                info = {**valid, **changes}
                with patch(
                    "updatePolicyShards.download", return_value=json.dumps(info).encode()
                ) as fetch:
                    with self.assertRaisesRegex(ValueError, message):
                        update(self.output)
                    fetch.assert_called_once_with(RELEASE_URL)

    def test_rejects_invalid_index_metadata(self):
        for field, value in (
            ("schema", "other.v1"),
            ("probability_denominator", 1),
            ("shards", {"file": PONE}),
            ("shards", []),
        ):
            with self.subTest(field=field, value=value):
                index, archive = fixture(
                    change_index=lambda data: data.update({field: value})
                )
                with self.assertRaisesRegex(ValueError, "nonempty pegging-policy-shards"):
                    self.run_update(release(archive, index), archive)

    def test_rejects_traversal_in_a_listed_zip_member(self):
        index, archive = fixture(shards={"../outside.bin.gz": b"outside"})
        with self.assertRaisesRegex(ValueError, "Invalid or duplicate shard path"):
            self.run_update(release(archive, index), archive)

    def test_rejects_duplicate_index_entry(self):
        index, archive = fixture(
            change_index=lambda data: data["shards"].append(data["shards"][0])
        )
        with self.assertRaisesRegex(ValueError, "Invalid or duplicate shard path"):
            self.run_update(release(archive, index), archive)

    def test_rejects_wrong_shard_byte_count_with_matching_digest(self):
        index, archive = fixture(
            change_index=lambda data: data["shards"][1].update(bytes=0)
        )
        with self.assertRaisesRegex(ValueError, "byte count mismatch"):
            self.run_update(release(archive, index), archive)

    def test_restores_previous_set_when_install_raises_or_is_interrupted(self):
        index, archive = fixture()
        rename = Path.rename
        for failure in (OSError("install failed"), KeyboardInterrupt()):
            with self.subTest(failure=type(failure).__name__):
                def rename_with_failure(source, target):
                    if source.name == "incoming":
                        raise failure
                    return rename(source, target)

                with patch.object(Path, "rename", rename_with_failure):
                    with self.assertRaises(type(failure)):
                        self.run_update(release(archive, index), archive)
                self.assertEqual(self.previous.read_bytes(), b"previous set")
                self.assertEqual(list(self.output.parent.iterdir()), [self.output])

    def test_preserves_backup_beside_output_if_rollback_fails(self):
        index, archive = fixture()
        rename = Path.rename

        def rename_with_failure(source, target):
            if target == self.output:
                raise OSError(f"Cannot move {source.name}")
            return rename(source, target)

        with patch.object(Path, "rename", rename_with_failure):
            with self.assertRaisesRegex(OSError, "Cannot move previous"):
                self.run_update(release(archive, index), archive)
        self.assertFalse(self.output.exists())
        (backup,) = self.output.parent.glob("*/previous/previous.bin")
        self.assertEqual(backup.read_bytes(), b"previous set")

    def test_replaces_dangling_output_symlink(self):
        self.previous.unlink()
        self.output.rmdir()
        missing = self.output.with_name("missing")
        self.output.symlink_to(missing, target_is_directory=True)
        index, archive = fixture()

        self.assertEqual(self.run_update(release(archive, index), archive), 2)
        self.assertFalse(self.output.is_symlink())
        self.assertFalse(missing.exists())
        self.assertEqual((self.output / PONE).read_bytes(), SHARDS[PONE])


if __name__ == "__main__":
    unittest.main()
