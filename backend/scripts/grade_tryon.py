"""Chấm ảnh thử đồ bằng Gemini, offline:  python -m scripts.grade_tryon [tuỳ chọn]

Với mỗi phiên bản prompt × trang phục × N tổ hợp (dịp, màu, phụ kiện hợp lệ): dựng ảnh bằng Nano Banana, rồi
gửi ảnh cho Gemini kèm checklist must_keep / must_avoid của trang phục để chấm từng mục đạt / không đạt.
Kết quả: backend/docs/TRYON_GRADING.md (tỉ lệ đạt theo phiên bản và theo trang phục, các mục hay trượt nhất),
ảnh lưu ở backend/data/grading/<run>/ (không commit), ảnh đạt 100% checklist vào fallback-candidates/.

  --versions v1,v3        phiên bản prompt (mặc định v1,v2,v3)
  --garments ao-dai       trang phục (mặc định tất cả)
  --combos 3              số tổ hợp mỗi trang phục (mặc định 3)
  --person path.png       ảnh người mẫu (mặc định content/media/avatars/default.png). KHÔNG dùng ảnh người thật
                          khi chưa có sự đồng ý; không commit ảnh người thật.
  --dry-run               chỉ in kế hoạch, số lời gọi và chi phí ước tính, không gọi API
  --hand-check run_dir    so điểm Gemini với điểm chấm tay trong run_dir/hand_check.csv, ghi mức khớp vào báo cáo

Phiên bản prompt (để đo mỗi phần của prompt đóng góp bao nhiêu):
  v1  chỉ tên trang phục
  v2  + MUST KEEP (cấu trúc phải giữ)
  v3  prompt đang chạy thật (app/services/tryon.py): + màu, phụ kiện, bối cảnh, MUST AVOID và yếu tố nước ngoài
Cần GEMINI_API_KEY ở gói trả phí.
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import random
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from pydantic import BaseModel, ConfigDict, ValidationError

from app.config import settings
from app.content import store
from app.models import Selection
from app.services import compass, tryon
from app.services.gemini_client import GeminiUnavailable, get_client

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "grading"
REPORT = ROOT / "docs" / "TRYON_GRADING.md"
# USD, rough list prices: check https://ai.google.dev/gemini-api/docs/pricing before a real run
PRICE_IMAGE = 0.039  # one Nano Banana image
PRICE_GRADE = 0.002  # one vision grading call


def prompt_for(version: str, sel: Selection, with_ref: bool) -> str:
    g = store.get().garments[sel.garment_id]
    if version == "v3":
        return tryon.build_prompt(sel, with_reference=with_ref)
    base = f"Edit the person in IMAGE 1 so they wear a {g.name_en} ({g.name_vi}), Vietnamese traditional garment."
    if version == "v2":
        base += f"\nMUST KEEP: {'; '.join(g.must_keep)}."
    return base + "\nKeep the person's face, body shape and skin tone unchanged. Full body, natural light, photorealistic."


def combos(garment_id: str, n: int, rnd: random.Random) -> list[Selection]:
    """n valid looks (never ⛔: those are not rendered by the app) with varied occasion, colours, accessories."""
    c = store.get()
    g = c.garments[garment_id]
    fine_acc = [a for a in g.accessories if c.accessories[a].kind in ("traditional-vn", "modern")]
    out, tries = [], 0
    while len(out) < n and tries < 200:
        tries += 1
        sel = Selection(
            garment_id=g.id,
            occasion_id=rnd.choice(g.occasions),
            vibe=rnd.choice(["traditional", "minimal", "modern", "festival"]),
            colors=rnd.sample(g.colors, k=rnd.choice([1, 2])),
            accessories=rnd.sample(fine_acc, k=rnd.randint(0, min(2, len(fine_acc)))),
        )
        if compass.evaluate(sel).state != "distorted" and sel not in out:
            out.append(sel)
    return out


class Item(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item: str
    kind: str
    ok: bool
    reason: str = ""


class Grade(BaseModel):
    items: list[Item]


GRADE_PROMPT = """You are checking an AI try-on image of a Vietnamese traditional garment for cultural accuracy.
Garment: {name} ({name_vi}).
For each checklist line, look at the image and decide.
- kind "keep": the feature MUST be visible and correct → ok = true if present.
- kind "avoid": the feature MUST NOT appear → ok = true if it is absent.
Checklist:
{lines}
Return only JSON: {{"items": [{{"item": "<the checklist text>", "kind": "keep"|"avoid", "ok": true|false, "reason": "<max 15 words>"}}]}}"""


def grade(image: bytes, garment_id: str) -> Grade:
    g = store.get().garments[garment_id]
    lines = [f'- keep: {k}' for k in g.must_keep] + [f'- avoid: {a}' for a in g.must_avoid]
    client = get_client()._client  # the raw SDK client: we send an image with the prompt
    if client is None:
        raise GeminiUnavailable("GEMINI_API_KEY not set")
    from google.genai import types

    resp = client.models.generate_content(
        model=settings.text_model,
        contents=[GRADE_PROMPT.format(name=g.name_en, name_vi=g.name_vi, lines="\n".join(lines)), types.Part.from_bytes(data=image, mime_type="image/png")],
        config={"response_mime_type": "application/json", "temperature": 0},
    )
    out = Grade.model_validate(json.loads(resp.text))
    if len(out.items) != len(lines):
        raise ValueError(f"expected {len(lines)} checklist items, got {len(out.items)}")
    return out


def report(rows: list[dict], run_dir: Path, agreement: str | None) -> str:
    """Markdown with pass rates by prompt version and by garment, and the checklist items that fail most."""
    by_v, by_vg, fails = defaultdict(lambda: [0, 0]), defaultdict(lambda: [0, 0]), defaultdict(int)
    errors = [r for r in rows if r.get("error")]
    for r in rows:
        if r.get("error"):
            continue
        full = all(i["ok"] for i in r["items"])
        by_v[r["version"]][0] += full
        by_v[r["version"]][1] += 1
        by_vg[(r["version"], r["garment"])][0] += full
        by_vg[(r["version"], r["garment"])][1] += 1
        for i in r["items"]:
            if not i["ok"]:
                fails[(r["garment"], i["kind"], i["item"])] += 1
    versions = sorted(by_v)
    garments = sorted({g for _, g in by_vg})
    md = [
        "# Chấm ảnh thử đồ bằng Gemini",
        "",
        f"*Lần chạy `{run_dir.name}` · sinh bởi `scripts/grade_tryon.py`. Một ảnh **đạt** khi mọi mục MUST KEEP có mặt và mọi mục MUST AVOID vắng mặt.*",
        "",
        "## Tỉ lệ đạt theo phiên bản prompt",
        "",
        "| Phiên bản | Đạt 100% checklist |",
        "| --- | --- |",
        *[f"| {v} | {by_v[v][0]}/{by_v[v][1]} ({by_v[v][0] / by_v[v][1]:.0%}) |" for v in versions],
        "",
        "## Theo trang phục",
        "",
        "| Trang phục | " + " | ".join(versions) + " |",
        "| --- | " + " | ".join("---" for _ in versions) + " |",
        *[
            f"| {g} | " + " | ".join(f"{by_vg[(v, g)][0]}/{by_vg[(v, g)][1]}" if by_vg[(v, g)][1] else "–" for v in versions) + " |"
            for g in garments
        ],
        "",
        "## Mục hay trượt nhất",
        "",
        *[f"- {n}× · {g} · {k}: {item}" for (g, k, item), n in sorted(fails.items(), key=lambda x: -x[1])[:10]],
        "",
        f"Ảnh lỗi hoặc chấm lỗi (đếm riêng, không tính vào tỉ lệ): {len(errors)}",
        "",
        "## Đối chiếu với chấm tay",
        "",
        agreement or f"Chưa có. Điền cột `human_ok` trong `{run_dir.relative_to(ROOT)}/hand_check.csv` rồi chạy `python -m scripts.grade_tryon --hand-check {run_dir.relative_to(ROOT)}`.",
        "",
    ]
    return "\n".join(md)


def hand_check(run_dir: Path) -> str:
    rows = list(csv.DictReader((run_dir / "hand_check.csv").open()))
    rated = [r for r in rows if r["human_ok"].strip().lower() in ("true", "false", "1", "0", "đạt", "không")]
    same = sum((r["human_ok"].strip().lower() in ("true", "1", "đạt")) == (r["gemini_ok"] == "True") for r in rated)
    return f"{len(rated)} ảnh chấm tay, Gemini khớp {same}/{len(rated)} ({same / len(rated):.0%})." if rated else "Chưa có ảnh nào được chấm tay."


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--versions", default="v1,v2,v3")
    ap.add_argument("--garments")
    ap.add_argument("--combos", type=int, default=3)
    ap.add_argument("--person")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--hand-check")
    args = ap.parse_args()
    store.reload()
    c = store.get()

    if args.hand_check:
        run_dir = ROOT / args.hand_check
        rows = json.loads((run_dir / "results.json").read_text())
        REPORT.write_text(report(rows, run_dir, hand_check(run_dir)))
        print(f"Đã cập nhật {REPORT.relative_to(ROOT)}")
        return

    versions = args.versions.split(",")
    garments = args.garments.split(",") if args.garments else sorted(c.garments)
    rnd = random.Random(args.seed)
    looks = {g: combos(g, args.combos, rnd) for g in garments}
    n = sum(len(v) for v in looks.values()) * len(versions)
    missing_ref = [g for g in garments if not tryon._reference(g)]
    print(f"Kế hoạch: {len(versions)} phiên bản × {len(garments)} trang phục × {args.combos} tổ hợp = {n} ảnh + {n} lời chấm")
    print(f"Chi phí ước tính: ~{n * PRICE_IMAGE + n * PRICE_GRADE:.2f} USD (ảnh {PRICE_IMAGE} USD, chấm {PRICE_GRADE} USD; kiểm tra bảng giá trước khi chạy)")
    if missing_ref:
        print(f"⚠️  Thiếu ảnh tham chiếu (reference_image) cho: {', '.join(missing_ref)}: dựng ảnh sẽ kém chính xác hơn.")
    person_path = Path(args.person) if args.person else c.root / "media" / "avatars" / "default.png"
    if not person_path.is_file():
        print(f"⚠️  Chưa có ảnh người mẫu ở {person_path}. Dùng --person <ảnh avatar tạo bằng AI>.")
    if args.dry_run:
        for g, sels in looks.items():
            for s in sels:
                print(f"   {g}: dịp {s.occasion_id}, màu {s.colors}, phụ kiện {s.accessories or '—'}, vibe {s.vibe}")
        return
    if not person_path.is_file():
        raise SystemExit("Thiếu ảnh người mẫu.")
    person = (person_path.read_bytes(), "image/png")

    run_dir = OUT_DIR / datetime.now().strftime("%Y%m%d-%H%M%S")
    (run_dir / "fallback-candidates").mkdir(parents=True, exist_ok=True)
    rows: list[dict] = []
    k = 0
    for v in versions:
        for g, sels in looks.items():
            for i, sel in enumerate(sels):
                k += 1
                name = f"{v}-{g}-{i + 1}"
                row = {"version": v, "garment": g, "look": sel.model_dump(), "image": f"{name}.png"}
                print(f"[{k}/{n}] {name}")
                try:
                    ref = tryon._reference(g)
                    img = get_client().generate_image(prompt_for(v, sel, ref is not None), [person] + ([ref] if ref else []))
                    (run_dir / row["image"]).write_bytes(img)
                    graded = grade(img, g)
                    row["items"] = [i_.model_dump() for i_ in graded.items]
                    if all(i_["ok"] for i_ in row["items"]):
                        (run_dir / "fallback-candidates" / row["image"]).write_bytes(img)
                except (GeminiUnavailable, ValidationError, ValueError, json.JSONDecodeError) as e:
                    row["error"] = f"{type(e).__name__}: {str(e)[:200]}"  # counted apart, never stops the run
                    print(f"   ! {row['error']}")
                rows.append(row)
                (run_dir / "results.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2))
                time.sleep(1)

    ok_rows = [r for r in rows if not r.get("error")]
    with (run_dir / "hand_check.csv").open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["image", "version", "garment", "gemini_ok", "human_ok"])
        for r in random.Random(1).sample(ok_rows, min(10, len(ok_rows))):
            w.writerow([r["image"], r["version"], r["garment"], all(i["ok"] for i in r["items"]), ""])
    REPORT.write_text(report(rows, run_dir, None))
    print(f"Xong. Báo cáo: {REPORT.relative_to(ROOT)} · ảnh: {run_dir.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
