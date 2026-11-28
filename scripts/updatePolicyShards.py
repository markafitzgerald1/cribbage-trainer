"""Verify and install the published pegging policy shard ZIP."""

import hashlib
from io import BytesIO
import json
from os.path import lexists
from pathlib import Path
import re
from shutil import rmtree
from tempfile import mkdtemp
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, build_opener
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


def require_https(url):
    if urlsplit(url).scheme != "https":
        raise ValueError("Policy downloads require HTTPS")


class HTTPSRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, new_url):
        require_https(new_url)
        return super().redirect_request(req, fp, code, msg, headers, new_url)


def download(url):
    require_https(url)
    with build_opener(HTTPSRedirectHandler()).open(url, timeout=60) as response:
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
    temporary = Path(mkdtemp(dir=output.parent, prefix=f".{output.name}-"))
    staging = temporary / "incoming"
    previous = temporary / "previous"
    installed = False
    try:
        for name, data in files.items():
            destination = staging / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)

        if lexists(output):
            output.rename(previous)
        staging.rename(output)
        installed = True
    except BaseException:
        if lexists(previous) and not lexists(output):
            previous.rename(output)
        raise
    finally:
        # Keep the backup available if the swap and its rollback both fail.
        if installed or not lexists(previous):
            rmtree(temporary)


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
