#!/usr/bin/env python3
"""Context extractor for minified single-line JS bundles.

Prints byte-offset-anchored context windows around regex matches, with
nearby-hit deduplication — the tool used to produce every snippet in
evidence/snippets/.

Usage:
    python3 grep_context.py <dir> <file,file,...> <regex> [<regex> ...]
"""
import os
import re
import sys

BEFORE, AFTER = 280, 480


def main() -> None:
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    root, files, patterns = sys.argv[1], sys.argv[2].split(","), sys.argv[3:]

    for fname in files:
        path = os.path.join(root, fname)
        if not os.path.exists(path):
            continue
        src = open(path, encoding="utf-8", errors="replace").read()
        for pat in patterns:
            seen = set()
            for m in re.finditer(pat, src):
                key = m.start() // 400  # dedupe hits inside one window
                if key in seen:
                    continue
                seen.add(key)
                s, e = max(0, m.start() - BEFORE), min(len(src), m.end() + AFTER)
                print(f"===== {fname} @{m.start()} [{m.group(0)[:60]}] =====")
                print(src[s:e].replace("\n", " "))
                print()


if __name__ == "__main__":
    main()
