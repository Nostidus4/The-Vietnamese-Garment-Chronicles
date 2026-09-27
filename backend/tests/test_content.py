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
