"""Tạo avatar thử đồ bằng Nano Banana:  python -m scripts.generate_avatar [--variants 2]

Dùng prompt 8.1 trong frontend/docs/ART_PROMPTS.md. Bản đầu lưu thành
content/media/avatars/default.png (nếu chưa có), các bản sau là default.v2.png... để team chọn lại.
Cần GEMINI_API_KEY.
"""

import argparse
import logging

from app.content import store
from app.services.gemini_client import GeminiUnavailable, get_client

PROMPT = """Photorealistic full-body studio photo of a fictional young Vietnamese adult, about 20, standing straight facing the camera, relaxed arms slightly away from the body, neutral friendly expression.
Wearing a plain fitted white T-shirt and light grey straight trousers, barefoot or plain white sneakers, hair tied back so the neck and collar area are visible.
Plain light-grey seamless studio background, soft even lighting, no shadows on the wall, whole body in frame with margin above head and below feet. No accessories, no logos, no text."""


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    ap = argparse.ArgumentParser()
    ap.add_argument("--variants", type=int, default=2)
    args = ap.parse_args()

    store.reload()
    out_dir = store.get().root / "media" / "avatars"
    client = get_client()
    if not client.available:
        raise SystemExit("Thiếu GEMINI_API_KEY trong backend/.env")

    for i in range(args.variants):
        try:
            raw = client.generate_image(PROMPT, [], aspect_ratio="3:4")
        except GeminiUnavailable as e:
            print(f"✗ v{i + 1}: {e}")
            continue
        path = out_dir / "default.png"
        if path.exists():
            path = out_dir / f"default.v{i + 1}.png"
        path.write_bytes(raw)
        print(f"✓ {path.relative_to(out_dir.parent.parent)}")


if __name__ == "__main__":
    main()
