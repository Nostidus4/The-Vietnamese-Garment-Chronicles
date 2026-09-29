"""Số liệu Impact từ sự kiện ẩn danh:  python -m scripts.event_stats [--json]

Đọc bảng events trên Supabase (cần SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong backend/.env),
hoặc backend/data/events.jsonl khi chạy local.
"""

import argparse
import json
from collections import defaultdict

from app.services import events


def summarize(rows: list[dict]) -> dict:
    by_session: dict[str, list[dict]] = defaultdict(list)
    for r in sorted(rows, key=lambda r: r["ts"]):
        by_session[r["session_id"]].append(r)
    counts: dict[str, int] = defaultdict(int)
    for r in rows:
        counts[r["type"]] += 1

    # 1. Occasion Adoption Rate: the last occasion each session picked for a garment fits that garment
    last_pick: dict[tuple[str, str], bool] = {}
    for sid, rs in by_session.items():
        for r in rs:
            if r["type"] == "occasion_selected":
                last_pick[(sid, r["payload"]["garment_id"])] = r["payload"]["fits"]
    occasion = {"picks": len(last_pick), "fits": sum(last_pick.values())}
    occasion["rate"] = round(occasion["fits"] / occasion["picks"], 3) if occasion["picks"] else None

    # 2. Quiz before vs after: sessions that answered in both phases
    pre, post = [], []
    for rs in by_session.values():
        score = {"pre": [], "post": []}
        for r in rs:
            if r["type"] == "quiz_answer":
                score[r["payload"]["phase"]].append(r["payload"]["correct"])
        if score["pre"] and score["post"]:
            pre.append(sum(score["pre"]) / len(score["pre"]))
            post.append(sum(score["post"]) / len(score["post"]))
    quiz = {
        "sessions_with_both": len(pre),
        "pre_avg": round(sum(pre) / len(pre), 3) if pre else None,
        "post_avg": round(sum(post) / len(post), 3) if post else None,
    }

    # 2b. The same per region ("Bà hỏi con": one question before the diary, three after)
    per: dict[str, dict[str, list[float]]] = defaultdict(lambda: {"pre": [], "post": []})
    for rs in by_session.values():
        score: dict[str, dict[str, list[bool]]] = defaultdict(lambda: {"pre": [], "post": []})
        for r in rs:
            if r["type"] == "quiz_answer":
                score[r["payload"]["region_id"]][r["payload"]["phase"]].append(r["payload"]["correct"])
        for region, sc in score.items():
            if sc["pre"] and sc["post"]:
                per[region]["pre"].append(sum(sc["pre"]) / len(sc["pre"]))
                per[region]["post"].append(sum(sc["post"]) / len(sc["post"]))
    quiz["by_region"] = {
        region: {"sessions": len(v["pre"]), "pre_avg": round(sum(v["pre"]) / len(v["pre"]), 3), "post_avg": round(sum(v["post"]) / len(v["post"]), 3)}
        for region, v in sorted(per.items())
    }

    # 3. Looks fixed: sessions that met ⚠️/⛔ and later reached ✅/✨ on the same garment
    met, fixed = set(), set()
    for sid, rs in by_session.items():
        for r in rs:
            p = r["payload"]
            if r["type"] == "compass_result" and p["state"] in ("review", "distorted"):
                met.add((sid, p["garment_id"]))
            if r["type"] == "look_fixed":
                fixed.add((sid, p["garment_id"]))
    looks = {"flagged": len(met), "fixed": len(met & fixed)}
    looks["rate"] = round(looks["fixed"] / looks["flagged"], 3) if looks["flagged"] else None

    return {"sessions": len(by_session), "events": dict(counts), "occasion_adoption": occasion, "quiz": quiz, "looks_fixed": looks}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    s = summarize(events.load_all())
    if args.json:
        print(json.dumps(s, ensure_ascii=False, indent=2))
        return
    pct = lambda x: "–" if x is None else f"{x * 100:.0f}%"  # noqa: E731
    print(f"Phiên: {s['sessions']} · Sự kiện: {sum(s['events'].values())} {s['events']}")
    o = s["occasion_adoption"]
    print(f"Chọn đúng dịp (Occasion Adoption Rate): {pct(o['rate'])} ({o['fits']}/{o['picks']} lựa chọn cuối)")
    q = s["quiz"]
    print(f"Quiz: trước {pct(q['pre_avg'])} → sau {pct(q['post_avg'])} ({q['sessions_with_both']} phiên làm cả hai lần)")
    for region, v in q["by_region"].items():
        print(f"  {region}: trước {pct(v['pre_avg'])} → sau {pct(v['post_avg'])} ({v['sessions']} phiên)")
    lk = s["looks_fixed"]
    print(f"Look ⚠️/⛔ được sửa lại: {pct(lk['rate'])} ({lk['fixed']}/{lk['flagged']})")


if __name__ == "__main__":
    main()
