"""Make tier template backgrounds transparent and upscale them 2x.

Usage: py scripts/prepare_templates.py
Reads  "Badge Ranks/*.png"; writes public/templates/<same name>.png
"""
from collections import deque
from pathlib import Path
from PIL import Image

SRC = Path("Badge Ranks")
OUT = Path("public/templates")
NAMES = ["0.9"] + [str(i) for i in range(1, 11)]
THRESHOLD = 225  # luminance above this, connected to a corner, is "outside"


def outside_mask(img: Image.Image) -> Image.Image:
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    lum = lambda p: 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2]
    seen = [[False] * h for _ in range(w)]
    q = deque([(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)])
    mask = Image.new("L", (w, h), 255)
    m = mask.load()
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or seen[x][y]:
            continue
        seen[x][y] = True
        if lum(px[x, y]) < THRESHOLD:
            continue
        m[x, y] = 0
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return mask


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    mask = outside_mask(Image.open(SRC / "0.9.png"))
    for name in NAMES:
        img = Image.open(SRC / f"{name}.png").convert("RGBA")
        img.putalpha(mask)
        img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
        img.save(OUT / f"{name}.png")
        print("wrote", OUT / f"{name}.png", img.size)


if __name__ == "__main__":
    main()
