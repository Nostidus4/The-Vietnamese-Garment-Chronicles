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
        j = reg.journey
        assert j.hover_line and j.own.invite
        assert (j.arrive and j.arrive.entry) or (j.chapter and j.stops[0].entry)


def test_locked_region_cannot_have_life_or_people(tmp_path):
    root = _copy(tmp_path)
    # a locked region whose chapter is not published: only a passing entry and landscapes are allowed
    regions = root / "regions.json"
    rdata = json.loads(regions.read_text())
    for c in next(r for r in rdata["regions"] if r["id"] == "tay-bac")["chapters"]:
        c["status"] = "waiting"
    regions.write_text(json.dumps(rdata, ensure_ascii=False))
    p = root / "regions" / "tay-bac.json"
    data = json.loads(p.read_text())
    data["life"] = {"date": "x", "entry": "x", "items": []}
    data["community_review"] = False
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    assert any("must not have 'life', 'festivals' or 'wear'" in e for e in rep.errors)
    assert any("must be a community_review draft" in e for e in rep.errors)
    assert any("must not have 'check'" in e for e in rep.errors)
    assert any("no_people: true" in e for e in rep.errors) or all(st["frame"]["no_people"] for st in data["stops"] if st["frame"])


def test_wear_page_must_use_a_garment_of_the_region(tmp_path):
    root = _copy(tmp_path)
    p = root / "regions" / "nam-bo.json"
    data = json.loads(p.read_text())
    data["wear"][0]["garment"] = "ao-tu-than"
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    assert any("'ao-tu-than' is not listed for this region" in e for e in rep.errors)


def test_verified_teo_note_needs_a_source(tmp_path):
    root = _copy(tmp_path)
    p = root / "regions" / "tay-bac.json"
    data = json.loads(p.read_text())
    note = next(n for st in data["stops"] for n in st["teo"] if n["verified"])
    note["sources"] = []
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    assert any("verified Tèo note needs a source" in e for e in rep.errors)


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


def test_trip_chapter_needs_a_title_page(tmp_path):
    root = _copy(tmp_path)
    p = root / "regions" / "hue.json"
    data = json.loads(p.read_text())
    del data["chapter"]
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    assert any("needs 'chapter'" in e for e in rep.errors)


def test_glossary_terms_must_exist(tmp_path):
    root = _copy(tmp_path)
    p = root / "regions" / "hue.json"
    data = json.loads(p.read_text())
    data["stops"][0]["entry"] += " [[từ lạ|khong-co]]"
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    assert any("unknown glossary term 'khong-co'" in e for e in rep.errors)


def test_only_one_open_chapter_per_region(tmp_path):
    root = _copy(tmp_path)
    p = root / "regions.json"
    data = json.loads(p.read_text())
    hue = next(r for r in data["regions"] if r["id"] == "hue")
    for ch in hue["chapters"][:2]:
        ch["status"] = "open"
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    assert any("only one chapter per region" in e for e in rep.errors)


def test_every_hue_stop_photo_is_credited(content):
    for st in content.regions["hue"].journey.stops:
        photos = [st.today.photo] if st.today and st.today.photo else []
        photos += [f.photo for f in st.festivals if f.photo]
        for ph in photos:
            assert ph.credit and ph.license and ph.source_url.startswith("https://")


def test_community_draft_games_must_be_reviewed_first(tmp_path):
    root = _copy(tmp_path)
    regions = root / "regions.json"
    rdata = json.loads(regions.read_text())
    tn = next(r for r in rdata["regions"] if r["id"] == "tay-nguyen")
    next(c for c in tn["chapters"] if c["province"] == "Đắk Lắk")["status"] = "draft"
    regions.write_text(json.dumps(rdata, ensure_ascii=False))
    p = root / "regions" / "tay-nguyen.json"
    data = json.loads(p.read_text())
    next(st for st in data["stops"] if st["game"])["game"]["community_review"] = False
    p.write_text(json.dumps(data, ensure_ascii=False))
    _, rep = store.load(root)
    assert any("games in a community draft must be community_review" in e for e in rep.errors)


def test_a_chapter_published_before_community_review_is_flagged(content):
    rep = store.report()
    assert any("published before community review" in w for w in rep.warnings)
    for rid in ("tay-bac", "tay-nguyen"):
        reg = content.regions[rid]
        assert reg.journey.community_review and any(c.status == "open" for c in reg.chapters)


def test_wardrobe_points_at_real_garments_and_accessories(content):
    assert content.wardrobe, "wardrobe.json should load"
    for it in content.wardrobe.values():
        if it.slot == "set":
            assert it.garment in content.garments
        else:
            assert it.accessory in content.accessories


def test_wardrobe_piece_needs_one_target_and_the_right_slot(tmp_path):
    root = _copy(tmp_path)
    p = root / "wardrobe.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    data["items"].append({"id": "lac-loai", "slot": "head", "garment": "ao-dai", "art": "x"})
    data["items"].append({"id": "khong-co", "slot": "feet", "accessory": "giay-khong-co", "art": "x"})
    p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    _, rep = store.load(root)
    assert any("lac-loai" in e and "slot 'set'" in e for e in rep.errors)
    assert any("khong-co" in e and "unknown accessory" in e for e in rep.errors)


def test_team_notes_never_reach_the_reader(tmp_path):
    # #50: "Research Mục…" and "(cần thẩm định)" belong in internal_ref / note, not in shown text
    root = _copy(tmp_path)
    p = root / "rules.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    data["rules"][0]["why"] = "Research Mục 19.2, tiêu chí 3."
    p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    s = root / "sources.json"
    src = json.loads(s.read_text(encoding="utf-8"))
    src["sources"][0]["title"] += " (cần thẩm định)"
    src["sources"][1]["note"] = "Research Report – cần thẩm định"  # a team note is fine
    s.write_text(json.dumps(src, ensure_ascii=False), encoding="utf-8")
    _, rep = store.load(root)
    shown = [e for e in rep.errors if "team note shown" in e]
    assert any("rules.json" in e and "why" in e for e in shown)
    assert any("sources.json" in e and "title" in e for e in shown)
    assert not any("note" in e.split("at ")[-1] for e in shown)
