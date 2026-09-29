from pathlib import Path

import pytest
from pydantic import ValidationError

from app.content import store
from app.services import compass
from scripts import grade_tryon as gt


def test_combos_are_valid_and_never_refused():
    store.reload()
    import random

    looks = gt.combos("ao-dai", 5, random.Random(1))
    assert len(looks) == 5
    assert all(compass.evaluate(s).state != "distorted" for s in looks)


def test_prompt_versions_add_up():
    store.reload()
    sel = gt.combos("ao-dai", 1, __import__("random").Random(2))[0]
    v1, v2, v3 = (gt.prompt_for(v, sel, False) for v in ("v1", "v2", "v3"))
    assert "MUST KEEP" not in v1 and "MUST KEEP" in v2 and "MUST AVOID" in v3


def test_grade_output_is_validated():
    with pytest.raises(ValidationError):
        gt.Grade.model_validate({"items": [{"item": "x", "kind": "keep", "ok": "maybe"}]})
    assert gt.Grade.model_validate({"items": [{"item": "x", "kind": "keep", "ok": True}]}).items[0].ok


def test_report_counts_errors_apart():
    rows = [
        {"version": "v1", "garment": "ao-dai", "items": [{"item": "two flaps", "kind": "keep", "ok": False}]},
        {"version": "v3", "garment": "ao-dai", "items": [{"item": "two flaps", "kind": "keep", "ok": True}]},
        {"version": "v3", "garment": "ao-dai", "error": "GeminiUnavailable: quota"},
    ]
    md = gt.report(rows, gt.ROOT / "data" / "grading" / "test", None)
    assert "| v1 | 0/1 (0%) |" in md and "| v3 | 1/1 (100%) |" in md
    assert "Ảnh lỗi hoặc chấm lỗi (đếm riêng, không tính vào tỉ lệ): 1" in md
    assert "1× · ao-dai · keep: two flaps" in md
