"""Zone options (#40): the parts of a garment the viewer may change, each change picked from a sourced list."""

import json
import shutil
import tempfile
from pathlib import Path

import pytest

from app.content import store

OPEN = ["ao-tu-than", "ao-ngu-than", "ao-dai", "ao-ba-ba"]


def _with_zone(tmp_path, garment: str, part: str, **zone):
    """A copy of the content where one zone of one garment is replaced by the given fields."""
    root = Path(tempfile.mkdtemp(dir=tmp_path)) / "content"  # a test may load several copies
    shutil.copytree(store.CONTENT_DIR, root)
    p = root / "garments" / f"{garment}.json"
    data = json.loads(p.read_text())
    z = next(z for z in data["zones"] if z["part"] == part)
    z.clear()
    z.update({"part": part, **zone})
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    return rep.errors


KEEP = {"id": "giu-nguyen", "label": "Giữ nguyên"}
WIDE = {"id": "tay-thung", "label": "Tay thụng", "prompt": "wide sleeves", "sources": ["vietnamplus-ngu-than"]}


# ---- check_content ----


def test_options_pass(tmp_path):
    assert _with_zone(tmp_path, "ao-ngu-than", "độ dài tay", level="caution", options=[KEEP, WIDE]) == []


def test_keep_zone_has_no_options(tmp_path):
    errors = _with_zone(tmp_path, "ao-ngu-than", "cổ áo", level="keep", options=[KEEP, WIDE])
    assert any("keep zone 'cổ áo' must not have options" in e for e in errors)


def test_first_option_keeps_the_garment_as_it_is(tmp_path):
    errors = _with_zone(tmp_path, "ao-ngu-than", "độ dài tay", level="caution", options=[WIDE, KEEP])
    assert any("first option of 'độ dài tay' must be 'giu-nguyen'" in e for e in errors)


def test_option_ids_are_unique(tmp_path):
    errors = _with_zone(tmp_path, "ao-ngu-than", "độ dài tay", level="caution", options=[KEEP, WIDE, WIDE])
    assert any("duplicate option 'tay-thung'" in e for e in errors)


def test_two_to_four_options(tmp_path):
    assert any("2–4 options" in e for e in _with_zone(tmp_path, "ao-ngu-than", "độ dài tay", level="caution", options=[KEEP]))
    many = [KEEP] + [{**WIDE, "id": f"tay-{i}"} for i in range(4)]
    assert any("2–4 options" in e for e in _with_zone(tmp_path, "ao-ngu-than", "độ dài tay", level="caution", options=many))


def test_a_change_needs_a_known_source_and_a_prompt(tmp_path):
    errors = _with_zone(tmp_path, "ao-ngu-than", "độ dài tay", level="caution", options=[KEEP, {**WIDE, "sources": []}])
    assert any("option 'tay-thung' needs a source" in e for e in errors)
    errors = _with_zone(tmp_path, "ao-ngu-than", "độ dài tay", level="caution", options=[KEEP, {**WIDE, "sources": ["ref-khong-co"]}])
    assert any("unknown source 'ref-khong-co'" in e for e in errors)
    errors = _with_zone(tmp_path, "ao-ngu-than", "độ dài tay", level="caution", options=[KEEP, {**WIDE, "prompt": None}])
    assert any("option 'tay-thung' needs a prompt" in e for e in errors)


def test_a_zone_set_by_another_control_has_no_options(tmp_path):
    errors = _with_zone(tmp_path, "ao-ngu-than", "màu vải", level="free", control="colors", options=[KEEP, WIDE])
    assert any("'màu vải' is changed with colors" in e for e in errors)


def test_real_content_gives_every_open_caution_or_free_zone_options_or_a_control(content):
    for gid in OPEN:
        for z in content.garments[gid].zones:
            if z.level == "keep":
                assert not z.options and z.control is None, (gid, z.part)
            else:
                assert bool(z.options) != bool(z.control), (gid, z.part)
    # regions still locked: untouched
    for gid in ["ao-com", "tho-cam-e-de"]:
        assert all(not z.options for z in content.garments[gid].zones), gid


# ---- Compass and try-on, on a copy where áo ngũ thân's sleeves have options ----

SLEEVES = [KEEP, WIDE, {"id": "tay-lung", "label": "Tay lửng", "prompt": "three-quarter sleeves", "sources": ["vietnamplus-ngu-than"]}]


@pytest.fixture
def sleeves(tmp_path, client):
    """Loaded after the app has started, since startup loads the real content."""
    root = Path(tempfile.mkdtemp(dir=tmp_path)) / "content"
    shutil.copytree(store.CONTENT_DIR, root)
    p = root / "garments" / "ao-ngu-than.json"
    data = json.loads(p.read_text())
    for z in data["zones"]:
        z.pop("options", None)
        if z["part"] == "độ dài tay":
            z["options"] = SLEEVES
        if z["part"] == "chất liệu":
            z["options"] = [KEEP, {"id": "lua", "label": "Lụa", "prompt": "silk", "sources": ["vietnamplus-ngu-than"]}]
    p.write_text(json.dumps(data, ensure_ascii=False))
    store.reload(root)


def _sel(*mods: tuple[str, str]) -> dict:
    return {
        "garment_id": "ao-ngu-than",
        "occasion_id": "di-tich",
        "modifications": [{"zone": z, "change": c} for z, c in mods],
    }


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    from app.main import app
    from app.services import ratelimit, tryon

    ratelimit._hits.clear()
    tryon._cache.clear()
    with TestClient(app) as c:
        yield c


def test_compass_picks_the_level_of_the_zone(sleeves, client):
    r = client.post("/compass", json=_sel(("độ dài tay", "tay-thung"))).json()
    assert r["state"] == "review"
    assert r["triggers"][0]["target"] == "độ dài tay"
    assert "Tay thụng" in r["triggers"][0]["target_name"]
    assert client.post("/compass", json=_sel(("chất liệu", "lua"))).json()["state"] == "adapted"


def test_keeping_the_zone_as_it_is_changes_nothing(sleeves, client):
    assert client.post("/compass", json=_sel(("độ dài tay", "giu-nguyen"))).json()["state"] == "fit"


@pytest.mark.parametrize(
    "zone,change",
    [
        ("độ dài tay", "tay-cut"),  # not one of the options
        ("độ dài tay", "tay lửng"),  # the label, not the id
        ("chất liệu", "tay-thung"),  # an option of another zone
        ("cổ áo", "co-tron"),  # a keep zone has no options at all
        ("màu vải", "do"),  # changed with the colour picker
    ],
)
def test_compass_refuses_a_change_outside_the_options(sleeves, client, zone, change):
    r = client.post("/compass", json=_sel((zone, change)))
    assert r.status_code == 422


def _tryon(client, sel: dict) -> dict:
    r = client.post("/tryon", data={"selection": json.dumps(sel), "avatar_id": "default"})
    assert r.status_code == 200, r.text
    return r.json()


def test_modifications_go_into_the_prompt_on_their_own_line(sleeves, client, fake_gemini):
    _tryon(client, _sel(("độ dài tay", "tay-thung"), ("chất liệu", "lua")))
    prompt = fake_gemini.image_calls[0]
    line = next(x for x in prompt.splitlines() if "wide sleeves" in x)
    assert "silk" in line
    assert not line.startswith(("MUST KEEP", "MUST AVOID"))
    # the rules around it are untouched
    assert "MUST KEEP: five panels; button closure; Vietnamese standing collar." in prompt.splitlines()
    assert any(x.startswith("MUST AVOID: hanfu cross collar;") for x in prompt.splitlines())


def test_no_change_line_without_modifications(sleeves, client, fake_gemini):
    _tryon(client, _sel(("độ dài tay", "giu-nguyen")))
    assert "wide sleeves" not in fake_gemini.image_calls[0]
    assert "giu-nguyen" not in fake_gemini.image_calls[0]


def test_avatar_cache_tells_modifications_apart(sleeves, client, fake_gemini):
    assert _tryon(client, _sel(("độ dài tay", "tay-thung")))["cached"] is False
    assert _tryon(client, _sel(("độ dài tay", "tay-lung")))["cached"] is False
    assert _tryon(client, _sel(("độ dài tay", "tay-thung")))["cached"] is True
    assert len(fake_gemini.image_calls) == 2
