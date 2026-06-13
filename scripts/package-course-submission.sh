#!/usr/bin/env bash
# Assemble the same static site as .github/workflows/github-pages.yml into a folder
# you can copy into your course fork: 2026-AI-Assignments/submissions/<學號-姓名>/
#
# Usage:
#   ./scripts/package-course-submission.sh                    # writes ./deploy/
#   ./scripts/package-course-submission.sh /path/to/out/dir # custom destination
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-"$ROOT/deploy"}"

mkdir -p "$DEST"
cp "$ROOT/index.html" "$ROOT/budget.html" "$ROOT/legislators.html" "$ROOT/other.html" \
  "$ROOT/main_vs.js" "$ROOT/styles_vs.css" "$DEST/"
cp "$ROOT/data_page_a.json" "$ROOT/data_page_b.json" "$ROOT/data_page_c.json" "$ROOT/data_page_d.json" "$DEST/"
cp -r "$ROOT/vs-modules" "$ROOT/img" "$DEST/"
if [[ -d "$ROOT/photos" ]]; then
  cp -r "$ROOT/photos" "$DEST/"
fi
if [[ -f "$ROOT/color-preview.html" ]]; then
  cp "$ROOT/color-preview.html" "$DEST/"
fi

# Placeholder thumbnail (replace with a real ≤500KB screenshot for the course).
if [[ ! -f "$DEST/thumbnail.png" ]]; then
  python3 - <<'PY' "$DEST/thumbnail.png"
import sys, struct, zlib

def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

w, h = 800, 600
# RGB rows: flat blue #1e3a5f
r, g, b = 0x1E, 0x3A, 0x5F
raw = b"".join([b"\x00" + bytes([r, g, b]) * w for _ in range(h)])
compressed = zlib.compress(raw, 9)
path = sys.argv[1]
png = (
    b"\x89PNG\r\n\x1a\n"
    + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
    + chunk(b"IDAT", compressed)
    + chunk(b"IEND", b"")
)
open(path, "wb").write(png)
PY
fi

echo "Wrote static bundle to: $DEST"
echo "Next: copy this folder to your fork as submissions/<學號-姓名>/"
echo "Replace thumbnail.png with a real screenshot (≤500KB) before opening the PR."
