"""Đo độ trễ và quota của Nano Banana:  python -m scripts.bench_tryon [--runs 8] [--burst 4]

Gọi thẳng Gemini (bỏ qua cache) với avatar mặc định:
- runs: gọi lần lượt, đo độ trễ một người dùng thấy;
- burst: gọi cùng lúc, giống vài giám khảo bấm thử đồ một lượt, để xem có dính 429 không.
Ghi kết quả vào docs/NANO_BANANA_BENCH.md. Mỗi lần gọi tốn quota như một lần thử đồ thật.
"""

import argparse
import logging
import statistics
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

from app.config import settings
from app.content import store
from app.models import Selection
from app.services import tryon
from app.services.gemini_client import GeminiUnavailable, _error_code, get_client

OUT = Path(__file__).resolve().parent.parent / "docs" / "NANO_BANANA_BENCH.md"


def one_call(sel: Selection, person) -> tuple[float, str]:
    ref = tryon._reference(sel.garment_id)
    images = [person] + ([ref] if ref else [])
    prompt = tryon.build_prompt(sel, with_reference=ref is not None)
    start = time.perf_counter()
    try:
        get_client().generate_image(prompt, images)
        return time.perf_counter() - start, "ok"
    except GeminiUnavailable as e:
        return time.perf_counter() - start, _error_code(e.__cause__) if e.__cause__ else "no_image"


def summarize(rows: list[tuple[str, float, str]]) -> list[str]:
    ok = [t for _, t, s in rows if s == "ok"]
    lines = [f"- Thành công: {len(ok)}/{len(rows)}"]
    if ok:
        q = statistics.quantiles(ok, n=20) if len(ok) >= 2 else [ok[0]] * 19
        lines.append(
            f"- Độ trễ (chỉ lần thành công): min {min(ok):.1f}s · trung vị {statistics.median(ok):.1f}s"
            f" · p95 {q[18]:.1f}s · max {max(ok):.1f}s"
        )
    errors: dict[str, int] = {}
    for _, _, s in rows:
        if s != "ok":
            errors[s] = errors.get(s, 0) + 1
    if errors:
        lines.append("- Lỗi: " + ", ".join(f"`{k}` × {v}" for k, v in errors.items()))
    return lines


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=8)
    ap.add_argument("--burst", type=int, default=4)
    args = ap.parse_args()

    store.reload()
    c = store.get()
    if not get_client().available:
        raise SystemExit("Thiếu GEMINI_API_KEY trong backend/.env")
    person = tryon.avatar("default")
    if person is None:
        raise SystemExit("Thiếu content/media/avatars/default.png (chạy python -m scripts.generate_avatar)")

    garments = list(c.garments.values())
    sels = [
        Selection(garment_id=g.id, occasion_id=g.occasions[0], colors=g.default_colors[:2]) for g in garments
    ]

    seq: list[tuple[str, float, str]] = []
    for i in range(args.runs):
        sel = sels[i % len(sels)]
        t, status = one_call(sel, person)
        print(f"seq {i + 1}/{args.runs} {sel.garment_id}: {t:.1f}s {status}")
        seq.append((sel.garment_id, t, status))

    burst: list[tuple[str, float, str]] = []
    wall = 0.0
    if args.burst:
        start = time.perf_counter()
        picks = [sels[i % len(sels)] for i in range(args.burst)]
        with ThreadPoolExecutor(args.burst) as pool:
            results = list(pool.map(lambda s: one_call(s, person), picks))
        wall = time.perf_counter() - start
        burst = [(s.garment_id, t, st) for s, (t, st) in zip(picks, results)]
        for g, t, st in burst:
            print(f"burst {g}: {t:.1f}s {st}")

    ref_note = "có" if any(tryon._reference(s.garment_id) for s in sels) else "không (chưa có ảnh ref)"
    md = [
        "# Đo Nano Banana",
        "",
        f"Chạy lúc {datetime.now():%Y-%m-%d %H:%M} bằng `python -m scripts.bench_tryon --runs {args.runs} --burst {args.burst}`.",
        f"Model `{settings.image_model}`, timeout {settings.image_timeout_s:.0f}s, avatar mặc định, ảnh ref: {ref_note}.",
        "",
        f"## Gọi lần lượt ({args.runs} lần)",
        "",
        *summarize(seq),
        "",
    ]
    if burst:
        md += [f"## Gọi cùng lúc ({args.burst} lần, tổng {wall:.1f}s)", "", *summarize(burst), ""]
    md += [
        "## Chi tiết",
        "",
        "| Kiểu | Trang phục | Thời gian | Kết quả |",
        "|---|---|---|---|",
        *[f"| lần lượt | {g} | {t:.1f}s | {s} |" for g, t, s in seq],
        *[f"| cùng lúc | {g} | {t:.1f}s | {s} |" for g, t, s in burst],
        "",
        "Quota còn lại không đọc được qua API; xem giới hạn RPM/RPD theo tier ở Google AI Studio → Usage & Billing.",
        "",
    ]
    OUT.write_text("\n".join(md))
    print(f"Đã ghi {OUT}")


if __name__ == "__main__":
    main()
