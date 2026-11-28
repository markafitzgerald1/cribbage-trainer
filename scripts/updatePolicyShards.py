"""Verify and install the published pegging policy shard ZIP."""

import hashlib
from io import BytesIO
import json
from pathlib import Path
import re
from tempfile import TemporaryDirectory
from urllib.request import urlopen
from zipfile import ZipFile

TAG = "pegging-policy-shards"
ASSET = f"{TAG}.zip"
RELEASE_URL = (
    "https://api.github.com/repos/markafitzgerald1/simulate-cribbage-games"
    f"/releases/tags/{TAG}"
)
OUTPUT = Path(__file__).resolve().parents[1] / "src" / "public" / TAG
DIGEST = r"[0-9a-f]{64}"
SHARD_PATH = r"(pone|dealer)/[A2-9TJQK](?:_[A2-9TJQK]){3}\.bin\.gz"
INDEX_NAME = "shards.json"


def download(url):
    with urlopen(url, timeout=60) as response:
        return response.read()


def check_digest(data, digest, name):
    if hashlib.sha256(data).hexdigest() != digest:
        raise ValueError(f"{name} SHA-256 mismatch")


def verified_files(zip_bytes, index_digest):
    with ZipFile(BytesIO(zip_bytes)) as archive:
        index_bytes = archive.read(INDEX_NAME)
        check_digest(index_bytes, index_digest, INDEX_NAME)
        index = json.loads(index_bytes)
        if (
            index["schema"] != "pegging-policy-shards.v1"
            or index["probability_denominator"] != 1000
            or not isinstance(index["shards"], list)
            or not index["shards"]
        ):
            raise ValueError("Expected a nonempty pegging-policy-shards.v1 index")

        files = {INDEX_NAME: index_bytes}
        for shard in index["shards"]:
            name = shard["file"]
            if not re.fullmatch(SHARD_PATH, name) or name in files:
                raise ValueError(f"Invalid or duplicate shard path: {name}")
            data = archive.read(name)
            check_digest(data, shard["sha256"], name)
            if len(data) != shard["bytes"]:
                raise ValueError(f"{name} byte count mismatch")
            files[name] = data

        if sorted(archive.namelist()) != sorted(files):
            raise ValueError("ZIP members do not match the shard index")
        return files


def install(files, output):
    output.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=output.parent.parent) as temporary:
        staging = Path(temporary) / "incoming"
        previous = Path(temporary) / "previous"
        for name, data in files.items():
            destination = staging / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)

        if output.exists():
            output.rename(previous)
        try:
            staging.rename(output)
        except OSError:
            if previous.exists() and not output.exists():
                previous.rename(output)
            raise


def update(output=OUTPUT):
    release = json.loads(download(RELEASE_URL))
    assets = release["assets"]
    index_pins = re.findall(
        rf"^- shards\.json SHA-256: `({DIGEST})`\r?$", release["body"], re.MULTILINE
    )
    if (
        release["draft"]
        or release["prerelease"]
        or len(assets) != 1
        or assets[0]["name"] != ASSET
        or len(index_pins) != 1
    ):
        raise ValueError("Expected the published policy ZIP and one index checksum")

    asset = assets[0]
    asset_digest = re.fullmatch(rf"sha256:({DIGEST})", asset["digest"])
    if asset_digest is None:
        raise ValueError("Expected GitHub's policy ZIP SHA-256")
    zip_bytes = download(asset["browser_download_url"])
    check_digest(zip_bytes, asset_digest[1], ASSET)
    files = verified_files(zip_bytes, index_pins[0])
    install(files, output)
    return len(files) - 1


if __name__ == "__main__":
    count = update()
    print(f"Installed {count} verified policy shards in {OUTPUT}")
