"""Turn logo.jpg (white square background) into round, transparent-cornered images for the site.

Usage: py scripts/prepare_logo.py
Writes public/st-timothy-logo.png (512px, used on cards, crests and the header) and src/app/icon.png (browser tab).
"""
from PIL import Image, ImageDraw

SIZE = 512
INNER = 0.78  # shrink the artwork so the year (top left) and "Timotheos" (bottom) stay inside the circle
SUPERSAMPLE = 4


def medallion(src: Image.Image, size: int) -> Image.Image:
    big = size * SUPERSAMPLE
    canvas = Image.new("RGBA", (big, big), (255, 255, 255, 255))
    art = src.convert("RGBA").resize((int(big * INNER), int(big * INNER)), Image.LANCZOS)
    offset = (big - art.width) // 2
    canvas.paste(art, (offset, offset))
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, big - 1, big - 1), fill=255)
    canvas.putalpha(mask)
    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    src = Image.open("logo.jpg")
    medallion(src, SIZE).save("public/st-timothy-logo.png", optimize=True)
    medallion(src, 256).save("src/app/icon.png", optimize=True)
    print("wrote public/st-timothy-logo.png and src/app/icon.png")


if __name__ == "__main__":
    main()
