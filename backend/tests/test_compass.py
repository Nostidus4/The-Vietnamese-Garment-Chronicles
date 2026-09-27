from app.compass import evaluate
from app.gemini import build_tryon_prompt
from app.models import Modification, Selection


def sel(**kw) -> Selection:
    base = {"garment_id": "ao-ngu-than", "occasion_id": "di-tich"}
    return Selection(**{**base, **kw})


def test_plain_garment_is_fit_and_authentic():
    r = evaluate(sel(colors=["tim-hue"], accessories=["khan-van"]))
    assert r.state == "fit"
    assert r.label == "Authentic"


def test_modern_accessory_is_adapted_not_fusion():
    r = evaluate(sel(accessories=["sneakers-trang"]))
    assert r.state == "adapted"
    assert r.label == "Adapted"


def test_non_default_color_is_adapted():
    assert evaluate(sel(colors=["xanh-mint"])).state == "adapted"


def test_foreign_traditional_accessory_is_distorted_with_alternative():
    r = evaluate(sel(accessories=["sneakers-trang", "obi"]))
    assert r.state == "distorted"
    assert r.label is None
    assert r.alternative is not None
    assert r.alternative.accessories == ["sneakers-trang"]


def test_restricted_item_is_distorted():
    assert evaluate(sel(accessories=["mu-canh-chuon"])).state == "distorted"


def test_changing_core_zone_is_distorted():
    r = evaluate(sel(modifications=[Modification(zone="số thân áo (5 thân)", change="2 thân")]))
    assert r.state == "distorted"


def test_changing_free_zone_is_adapted():
    r = evaluate(sel(modifications=[Modification(zone="chất liệu", change="linen")]))
    assert r.state == "adapted"


def test_occasion_mismatch_is_review():
    # non-quai-thao is only tagged for festivals, Tết and heritage sites
    r = evaluate(Selection(garment_id="ao-tu-than", occasion_id="su-kien-truong", accessories=["non-quai-thao"]))
    assert r.state == "review"
    assert r.label == "Inspired"


def test_heaviest_state_wins():
    r = evaluate(sel(colors=["xanh-mint"], accessories=["no-jeogori"]))
    assert r.state == "distorted"


def test_harmony_note_does_not_change_state():
    r = evaluate(sel(colors=["do-son", "vang-nghe", "tim-hue"]))
    assert r.state == "adapted"


def test_tryon_prompt_uses_data_guardrails():
    p = build_tryon_prompt(sel(colors=["tim-hue"], accessories=["khan-van"]))
    assert "five panels" in p
    assert "Japanese obi" in p
    assert "Khăn vấn" in p
