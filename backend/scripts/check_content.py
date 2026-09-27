"""Kiểm tra dữ liệu trước khi commit:  python -m scripts.check_content

Exit code 1 khi có lỗi, để dùng được trong CI.
"""

import sys
from collections import defaultdict

from app.content import store


def main() -> int:
    content, rep = store.load()
    print(f"Nguồn: {len(content.sources)} · Trang phục: {len(content.garments)} · Phụ kiện: {len(content.accessories)} "
          f"· Quiz: {len(content.quiz)} · Tiệm: {len(content.shops)} · Trang truyện: {len(content.comic)}\n")

    if rep.errors:
        print(f"❌ {len(rep.errors)} LỖI (server sẽ không chạy cho tới khi sửa):")
        for e in rep.errors:
            print("   -", e)
        print()

    groups: dict[str, list[str]] = defaultdict(list)
    for w in rep.warnings:
        if "not verified" in w:
            groups["Chưa kiểm chứng (đổi verified thành true sau khi đối chiếu research)"].append(w)
        elif "image" in w or "missing" in w:
            groups["Thiếu ảnh trong content/media"].append(w)
        elif "sources" in w:
            groups["Chưa có nguồn"].append(w)
        else:
            groups["Khác"].append(w)
    for title, items in groups.items():
        print(f"⚠️  {title} ({len(items)}):")
        for w in items:
            print("   -", w)
        print()

    if not rep.errors:
        print("✅ Không có lỗi. Dữ liệu dùng được.")
    return 1 if rep.errors else 0


if __name__ == "__main__":
    sys.exit(main())
