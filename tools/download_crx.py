#!/usr/bin/env python3
"""Download a Chrome extension CRX3 from the Web Store and strip its header.

Usage:
    python3 download_crx.py <extension-id> [out.crx]

Produces <out>.crx (raw) and prints the zip payload size. Extract with:
    python3 -c "import zipfile; zipfile.ZipFile('out.crx').extractall('ext')"
"""
import struct
import sys
import urllib.request

CRX_URL = ("https://clients2.google.com/service/update2/crx"
           "?response=redirect&prodversion=132.0&acceptformat=crx2,crx3"
           "&x=id%3D{ext_id}%26uc")


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    ext_id = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else f"{ext_id}.crx"

    req = urllib.request.Request(CRX_URL.format(ext_id=ext_id),
                                 headers={"User-Agent": "chrome/132.0"})
    data = urllib.request.urlopen(req, timeout=60).read()

    magic = data[:4]  # b"Cr24"
    if magic != b"Cr24":
        sys.exit(f"not a CRX file: {magic!r}")
    version, header_len = struct.unpack("<II", data[4:12])
    payload = data[12 + header_len:]

    with open(out, "wb") as fh:
        fh.write(payload)
    print(f"CRX version {version}, header {header_len} B, "
          f"zip payload {len(payload)} B -> {out}")


if __name__ == "__main__":
    main()
