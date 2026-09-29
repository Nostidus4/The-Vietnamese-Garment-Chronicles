import json
import shutil

from app.content import store


def test_real_content_has_no_errors():
    _, rep = store.load()
    assert rep.errors == []


def _copy(tmp_path):
    dst = tmp_path / "content"
    shutil.copytree(store.CONTENT_DIR, dst)
    return dst


def test_typo_in_field_name_is_an_error(tmp_path):
    root = _copy(tmp_path)
    p = root / "garments" / "ao-dai.json"
    data = json.loads(p.read_text())
    data["colours"] = data.pop("colors")
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    assert any("colours" in e for e in rep.errors)
    assert any("colors" in e and "Field required" in e for e in rep.errors)


def test_unknown_reference_is_an_error(tmp_path):
    root = _copy(tmp_path)
    p = root / "garments" / "ao-dai.json"
    data = json.loads(p.read_text())
    data["accessories"].append("khong-ton-tai")
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    assert any("unknown accessory 'khong-ton-tai'" in e for e in rep.errors)


def test_file_name_must_match_id(tmp_path):
    root = _copy(tmp_path)
    (root / "garments" / "ao-dai.json").rename(root / "garments" / "ao-dai-moi.json")
    _, rep = store.load(root)
    assert any("must match the file name" in e for e in rep.errors)


def test_invalid_json_reports_line(tmp_path):
    root = _copy(tmp_path)
    (root / "colors.json").write_text('{"colors": [}')
    _, rep = store.load(root)
    assert any("colors.json: invalid JSON at line 1" in e for e in rep.errors)


def test_every_region_has_a_diary(content):
    for reg in content.regions.values():
        assert reg.journey is not None, reg.id
        assert reg.journey.hover_line and reg.journey.arrive.entry and reg.journey.own.invite


def test_locked_region_cannot_have_life_or_people(tmp_path):
    root = _copy(tmp_path)
    p = root / "regions" / "tay-bac.json"
    data = json.loads(p.read_text())
    data["life"] = {"date": "x", "entry": "x", "items": []}
    data["look"]["frames"][0]["no_people"] = False
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    assert any("must not have 'life'" in e for e in rep.errors)
    assert any("no_people: true" in e for e in rep.errors)


def test_wear_page_must_use_a_garment_of_the_region(tmp_path):
    root = _copy(tmp_path)
    p = root / "regions" / "nam-bo.json"
    data = json.loads(p.read_text())
    data["wear"][0]["garment"] = "ao-tu-than"
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    assert any("'ao-tu-than' is not listed for this region" in e for e in rep.errors)


def test_journey_file_needs_a_known_region(tmp_path):
    root = _copy(tmp_path)
    (root / "regions" / "khong-co.json").write_text("{}")
    _, rep = store.load(root)
    assert any("no region 'khong-co'" in e for e in rep.errors)


def test_region_check_answer_must_exist(tmp_path):
    root = _copy(tmp_path)
    p = root / "regions" / "hue.json"
    data = json.loads(p.read_text())
    data["check"]["post"][0]["answer"] = 9
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    assert any("answer 9 has no matching choice" in e for e in rep.errors)


def test_open_regions_have_three_questions(content):
    for reg in content.regions.values():
        if reg.status == "open":
            assert reg.journey.check and len(reg.journey.check.post) == 3
