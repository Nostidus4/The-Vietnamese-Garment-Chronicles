"""Tạo sẵn ảnh dự phòng cho demo:  python -m scripts.pregenerate_fallbacks [--variants 3]

Với mỗi trang phục: dựng look mặc định lên avatar mặc định bằng Nano Banana, lưu
content/media/fallback/<garment_id>.png (bản đầu tiên) và các bản thêm để team chọn lại.
Cần GEMINI_API_KEY và content/media/avatars/default.png.
"""

import argparse
import base64
import logging

from app.content import store
from app.models import Selection
from app.services import tryon


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    ap = argparse.ArgumentParser()
    ap.add_argument("--variants", type=int, default=3)
    args = ap.parse_args()

    store.reload()
    c = store.get()
    person = tryon.avatar("default")
    if person is None:
        raise SystemExit("Thiếu content/media/avatars/default.png")

    out_dir = c.root / "media" / "fallback"
    for g in c.garments.values():
        sel = Selection(garment_id=g.id, occasion_id=g.occasions[0], colors=g.default_colors[:2])
        for i in range(args.variants):
            res = tryon.run(sel, person, cache_key=None)
            if not res.image_base64:
                print(f"✗ {g.id} v{i + 1}: Gemini không trả ảnh")
                continue
            name = f"{g.id}.png" if i == 0 else f"{g.id}.v{i + 1}.png"
            (out_dir / name).write_bytes(base64.b64decode(res.image_base64))
            print(f"✓ {name}")
    print("Xong. Mở content/media/fallback, chọn bản đẹp nhất và đổi tên thành <garment_id>.png")


if __name__ == "__main__":
    main()
