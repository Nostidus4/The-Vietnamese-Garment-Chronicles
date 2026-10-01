import pytest

from app.models import Modification, Selection
from app.services.compass import SelectionError, evaluate


def sel(**kw) -> Selection:
    return Selection(**{"garment_id": "ao-ngu-than", "occasion_id": "di-tich", **kw})


def test_plain_garment_is_fit_and_authentic():
    r = evaluate(sel(colors=["tim-hue"], accessories=["khan-van"]))
    assert (r.state, r.label) == ("fit", "Authentic")


def test_modern_accessory_is_adapted_not_fusion():
    r = evaluate(sel(accessories=["sneakers-trang"]))
    assert (r.state, r.label) == ("adapted", "Adapted")


def test_non_default_color_is_adapted():
    assert evaluate(sel(colors=["xanh-mint"])).state == "adapted"


def test_foreign_accessory_is_distorted_uses_its_own_message_and_offers_alternative():
    r = evaluate(sel(accessories=["sneakers-trang", "obi"]))
    assert r.state == "distorted" and r.label is None
    assert r.triggers[0].type == "fusion"
    assert "kimono" in r.triggers[0].ti  # accessory.message overrides the generic rule text
    assert r.alternative.accessories == ["sneakers-trang"]
    assert r.alternative_state == "adapted"


def test_restricted_item_is_distorted():
    assert evaluate(sel(accessories=["mu-canh-chuon"])).state == "distorted"


def test_core_zone_cannot_be_changed():
    # keep zones have no options (#40): the builder shows them locked, the API refuses them
    with pytest.raises(SelectionError):
        evaluate(sel(modifications=[Modification(zone="số thân áo (5 thân)", change="2 thân")]))


def test_caution_zone_change_is_review():
    r = evaluate(sel(modifications=[Modification(zone="độ dài tay", change="tay-lung")]))
    assert (r.state, r.label) == ("review", "Inspired")


def test_free_zone_change_is_adapted():
    assert evaluate(sel(modifications=[Modification(zone="chất liệu", change="lua")])).state == "adapted"


def test_accessory_occasion_mismatch_is_review():
    r = evaluate(Selection(garment_id="ao-tu-than", occasion_id="su-kien-truong", accessories=["non-quai-thao"]))
    assert r.state == "review"


def test_garment_occasion_mismatch_is_review():
    # ao-ngu-than does not list su-kien-truong
    assert evaluate(sel(occasion_id="su-kien-truong")).state == "review"


def test_heaviest_state_wins_and_is_listed_first():
    r = evaluate(sel(colors=["xanh-mint"], accessories=["no-jeogori"]))
    assert r.state == "distorted"
    assert r.triggers[0].state == "distorted"


@pytest.mark.parametrize(
    "bad",
    [
        {"garment_id": "khong-co"},
        {"occasion_id": "khong-co"},
        {"colors": ["trang"]},  # not offered for ao-ngu-than
        {"accessories": ["khan-ran"]},  # not offered for ao-ngu-than
        {"modifications": [Modification(zone="không có")]},
    ],
)
def test_invalid_selection_is_rejected(bad):
    with pytest.raises(SelectionError):
        evaluate(sel(**bad))


def test_harmony_notes_never_change_state():
    r = evaluate(sel(colors=["do-son", "vang-nghe"]))
    assert r.state == "adapted"
