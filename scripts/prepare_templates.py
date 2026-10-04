"""Upscale the tier card templates 4x so cards look sharp, keeping their transparent backgrounds.

Usage: py scripts/prepare_templates.py <path-to-realesrgan-ncnn-vulkan.exe>

Reads "Badge Ranks/*.png" (182x257, transparent background) and writes public/templates/<same name>.webp (728x1028,
WebP keeps transparency at a fraction of the PNG size).
Uses Real-ESRGAN (free, runs locally on the GPU):
https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-windows.zip
The "anime" model keeps the flat card artwork and gold borders crisp. Without the tool, falls back to a plain
(blurry) Lanczos resize.
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

SRC = Path("Badge Ranks")
OUT = Path("public/templates")
NAMES = ["0.9"] + [str(i) for i in range(1, 11)]
SCALE = 4
# All designs share one card outline. The crystal card's cut-out keeps the crown notches cleanly (on the light
# gold/silver/bronze cards the notches blend into the old white background), so every card uses its outline.
SILHOUETTE = "0.9.png"


def crisp_alpha(original: Image.Image, size: tuple[int, int]) -> Image.Image:
    """The card outline from the clean original cut-out, enlarged smoothly and re-sharpened.

    The upscaler softens transparency into a faint halo around the card; rebuilding the alpha channel from the
    original keeps the silhouette crisp with a thin anti-aliased edge.
    """
    alpha = original.convert("RGBA").getchannel("A").resize(size, Image.LANCZOS)
    return alpha.point(lambda a: 0 if a < 64 else 255 if a > 192 else (a - 64) * 2)


def save(img: Image.Image, name: str) -> None:
    img.save(OUT / f"{name}.webp", "WEBP", quality=92, method=6)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    exe = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if exe and exe.exists():
        with tempfile.TemporaryDirectory() as tmp:
            src, dst = Path(tmp, "in"), Path(tmp, "out")
            src.mkdir()
            dst.mkdir()
            for name in NAMES:
                shutil.copy(SRC / f"{name}.png", src / f"{name}.png")
            subprocess.run(
                [str(exe), "-i", str(src), "-o", str(dst), "-n", "realesrgan-x4plus-anime", "-s", str(SCALE), "-f", "png"],
                check=True,
                cwd=exe.parent,  # the tool looks for its models/ folder next to itself
            )
            for name in NAMES:
                art = Image.open(dst / f"{name}.png").convert("RGBA")
                art.putalpha(crisp_alpha(Image.open(SRC / SILHOUETTE), art.size))
                save(art, name)
                print("upscaled", name)
    else:
        print("Real-ESRGAN not found; falling back to a plain resize (blurry).")
        for name in NAMES:
            img = Image.open(SRC / f"{name}.png").convert("RGBA")
            save(img.resize((img.width * SCALE, img.height * SCALE), Image.LANCZOS), name)
            print("resized", name)


if __name__ == "__main__":
    main()
