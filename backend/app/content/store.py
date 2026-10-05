"""Loads backend/content, validates every file and every cross-reference, and keeps it in memory.

Errors (bad field, unknown id) stop the server so broken data never reaches the demo.
Warnings (unverified, missing image or source) are listed in GET /admin/content-report.
"""

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from collections.abc import Callable
from typing import TypeVar

from pydantic import BaseModel, ValidationError

from .schemas import (
    KEEP_OPTION,
    Accessory,
    Color,
    Garment,
    GlossaryTerm,
    Journey,
    Occasion,
    OpeningScreen,
    QuizItem,
    Region,
    Rule,
    Shop,
    Source,
    Voice,
    WardrobeItem,
)

CONTENT_DIR = Path(__file__).resolve().parents[2] / "content"
M = TypeVar("M", bound=BaseModel)


@dataclass
class Report:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {"ok": not self.errors, "errors": self.errors, "warnings": self.warnings}


@dataclass
class Content:
    root: Path
    sources: dict[str, Source]
    colors: dict[str, Color]
    accessories: dict[str, Accessory]
    garments: dict[str, Garment]
    occasions: dict[str, Occasion]
    regions: dict[str, Region]
    rules: dict[str, Rule]
    quiz: dict[str, QuizItem]
    shops: dict[str, Shop]
    opening: list[OpeningScreen]
    glossary: dict[str, GlossaryTerm] = field(default_factory=dict)
    voices: dict[str, Voice] = field(default_factory=dict)
    wardrobe: dict[str, WardrobeItem] = field(default_factory=dict)

    def media_exists(self, rel: str | None) -> bool:
        return bool(rel) and (self.root / "media" / rel).is_file()


class ContentError(Exception):
    def __init__(self, report: Report):
        self.report = report
        super().__init__("Content has errors:\n- " + "\n- ".join(report.errors))


def _read(path: Path, report: Report) -> object | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        report.errors.append(f"{path.name}: file missing")
    except json.JSONDecodeError as e:
        report.errors.append(f"{path.name}: invalid JSON at line {e.lineno}, column {e.colno}: {e.msg}")
    return None


def _parse_list(raw: object, key: str, model: type[M], where: str, report: Report) -> list[M]:
    items = raw.get(key, []) if isinstance(raw, dict) else []
    out: list[M] = []
    for i, item in enumerate(items):
        try:
            out.append(model.model_validate(item))
        except ValidationError as e:
            for err in e.errors():
                loc = ".".join(str(p) for p in err["loc"])
                label = item.get("id", f"#{i}") if isinstance(item, dict) else f"#{i}"
                report.errors.append(f"{where} [{label}] {loc}: {err['msg']}")
    return out


def _index(items: list[M], where: str, report: Report, key: str = "id") -> dict[str, M]:
    out: dict[str, M] = {}
    for it in items:
        k = getattr(it, key)
        if k in out:
            report.errors.append(f"{where}: duplicate {key} '{k}'")
        out[k] = it
    return out


def load(root: Path = CONTENT_DIR) -> tuple[Content, Report]:
    r = Report()

    def lst(file: str, key: str, model: type[M]) -> list[M]:
        raw = _read(root / file, r)
        return _parse_list(raw, key, model, file, r) if raw is not None else []

    garment_list: list[Garment] = []
    for gf in sorted((root / "garments").glob("*.json")):
        raw = _read(gf, r)
        if raw is None:
            continue
        parsed = _parse_list({"x": [raw]}, "x", Garment, f"garments/{gf.name}", r)
        for g in parsed:
            if g.id != gf.stem:
                r.errors.append(f"garments/{gf.name}: id '{g.id}' must match the file name")
        garment_list += parsed

    c = Content(
        root=root,
        sources=_index(lst("sources.json", "sources", Source), "sources.json", r),
        colors=_index(lst("colors.json", "colors", Color), "colors.json", r),
        accessories=_index(lst("accessories.json", "accessories", Accessory), "accessories.json", r),
        garments=_index(garment_list, "garments/", r),
        occasions=_index(lst("occasions.json", "occasions", Occasion), "occasions.json", r),
        regions=_index(lst("regions.json", "regions", Region), "regions.json", r),
        rules=_index(lst("rules.json", "rules", Rule), "rules.json", r, key="type"),
        quiz=_index(lst("quiz.json", "items", QuizItem), "quiz.json", r),
        shops=_index(lst("shops.json", "shops", Shop), "shops.json", r),
        opening=lst("opening.json", "screens", OpeningScreen),
        glossary=_index(lst("glossary.json", "terms", GlossaryTerm), "glossary.json", r) if (root / "glossary.json").is_file() else {},
        voices=_index(lst("voices.json", "voices", Voice), "voices.json", r),
        wardrobe=_index(lst("wardrobe.json", "items", WardrobeItem), "wardrobe.json", r) if (root / "wardrobe.json").is_file() else {},
    )
    for jf in sorted((root / "regions").glob("*.json")) if (root / "regions").is_dir() else []:
        raw = _read(jf, r)
        if raw is None:
            continue
        reg = c.regions.get(jf.stem)
        if reg is None:
            r.errors.append(f"regions/{jf.name}: no region '{jf.stem}' in regions.json")
            continue
        parsed = _parse_list({"x": [raw]}, "x", Journey, f"regions/{jf.name}", r)
        if parsed:
            reg.journey = parsed[0]
    _check_refs(c, r)
    return c, r


def _check_refs(c: Content, r: Report) -> None:
    frontend_public = c.root.parents[1] / "frontend" / "public"

    def need(ids: list[str] | None, pool: dict, where: str, what: str) -> None:
        for i in ids or []:
            if i not in pool:
                r.errors.append(f"{where}: unknown {what} '{i}'")

    def srcs(ids: list[str], where: str, required: bool = True) -> None:
        need(ids, c.sources, where, "source")
        if required and not ids:
            r.warnings.append(f"{where}: no sources yet")

    def media(path: str | None, where: str) -> None:
        if path and not c.media_exists(path):
            r.warnings.append(f"{where}: image not found at content/media/{path}")

    for t in ("fusion", "restricted", "core", "caution", "occasion", "flexible"):
        if t not in c.rules:
            r.errors.append(f"rules.json: missing rule of type '{t}'")
    for rule in c.rules.values():
        srcs(rule.sources, f"rules.json [{rule.type}]")

    for a in c.accessories.values():
        w = f"accessories.json [{a.id}]"
        need(a.occasions, c.occasions, w, "occasion")
        need([a.alternative] if a.alternative else [], c.accessories, w, "alternative accessory")
        srcs(a.sources, w, required=a.kind in ("traditional-vn", "traditional-foreign", "restricted"))
        media(a.image, w)
        if not a.verified and a.kind != "modern":
            r.warnings.append(f"{w}: not verified")

    for g in c.garments.values():
        w = f"garments/{g.id}.json"
        need([g.region], c.regions, w, "region")
        need(g.occasions, c.occasions, w, "occasion")
        need(g.colors, c.colors, w, "color")
        need(g.accessories, c.accessories, w, "accessory")
        for dc in g.default_colors:
            if dc not in g.colors:
                r.errors.append(f"{w}: default color '{dc}' is not in its colors list")
        for f in g.facts:
            need(f.sources, c.sources, w, "source")
        _check_zones(g, w, r, lambda ids: need(ids, c.sources, w, "source"))
        srcs(g.sources, w)
        if g.reference_image is None:
            r.warnings.append(f"{w}: no reference_image (try-on accuracy drops without it)")
        media(g.reference_image, w)
        for s in g.wearing_steps:
            media(s.image, w)
        if not g.verified:
            r.warnings.append(f"{w}: not verified")
        reg = c.regions.get(g.region)
        if reg and g.id not in reg.garments:
            r.errors.append(f"{w}: region '{g.region}' does not list this garment")

    for reg in c.regions.values():
        w = f"regions.json [{reg.id}]"
        need(reg.garments, c.garments, w, "garment")
        if reg.status == "open" and not reg.garments:
            r.errors.append(f"{w}: open region needs at least one garment")
        if reg.status == "locked" and not reg.lock_note:
            r.warnings.append(f"{w}: locked region should explain why (lock_note)")
        media(reg.stamp_image, w)
        j = reg.journey
        if j is None:
            r.warnings.append(f"{w}: no diary yet (content/regions/{reg.id}.json)")
            continue
        wj = f"regions/{reg.id}.json"
        srcs(j.sources, wj)
        pages = [p for p in (j.arrive, j.look, j.life, j.festivals, *j.stops, *j.wear) if p]
        frames = [*(j.look.frames if j.look else []), *(st.frame for st in j.stops if st.frame)]
        published = any(ch.status == "open" for ch in reg.chapters)
        if reg.status == "locked" and not published:
            # locked regions are written with their communities: a passing entry and landscapes, nothing else yet
            if j.life or j.festivals or j.wear:
                r.errors.append(f"{wj}: locked region must not have 'life', 'festivals' or 'wear'")
            if j.stops and not j.community_review:
                r.errors.append(f"{wj}: a locked region's chapter must be a community_review draft")
            if not j.community_review:
                for f in frames:
                    if not f.no_people:
                        r.errors.append(f"{wj}: locked region frames must be landscapes (no_people: true)")
        else:
            # an open region, or a locked one whose chapter is published (try-on stays closed while locked)
            if not j.wear:
                r.errors.append(f"{wj}: open region needs at least one 'wear' page")
            for wp in j.wear:
                need([wp.garment], c.garments, wj, "garment")
                if wp.garment not in reg.garments:
                    r.errors.append(f"{wj}: wear page garment '{wp.garment}' is not listed for this region")
        if j.check:
            if reg.status == "locked" and not published:
                r.errors.append(f"{wj}: locked region must not have 'check'")
            for q in [j.check.pre, *j.check.post]:
                if q.answer >= len(q.choices):
                    r.errors.append(f"{wj} [{q.id}]: answer {q.answer} has no matching choice")
                need(q.sources, c.sources, wj, "source")
                if not q.verified:
                    r.warnings.append(f"{wj} [{q.id}]: question not verified")
        elif reg.status == "open":
            r.warnings.append(f"{wj}: no 'Bà hỏi con' questions yet (check)")
        def public(path: str | None, what: str) -> None:
            if path and frontend_public.exists() and not (frontend_public / path.lstrip("/")).is_file():
                r.warnings.append(f"{wj}: {what} not found at frontend/public{path}")

        for f in frames:
            public(f.image, "frame image")
        ids = [st.id for st in j.stops]
        if len(ids) != len(set(ids)):
            r.errors.append(f"{wj}: duplicate stop id")
        for st in j.stops:
            if st.today and st.today.photo:
                public(st.today.photo.image, f"photo of stop '{st.id}'")
            for fe in st.festivals:
                if fe.photo:
                    public(fe.photo.image, f"photo of festival '{fe.id}'")
            if st.game:
                g = st.game
                if g.teo:
                    need(g.teo.sources, c.sources, wj, "source")
                    if g.teo.verified and not g.teo.sources:
                        r.errors.append(f"{wj}: verified Tèo note in game '{g.kind}' needs a source")
                for i, rd in enumerate(g.rounds):
                    if rd.choices and (rd.answer is None or rd.answer >= len(rd.choices)):
                        r.errors.append(f"{wj} [{st.id}] game round {i}: answer has no matching choice")
                if j.community_review and not g.community_review and any(ch.status == "draft" for ch in reg.chapters):
                    r.errors.append(f"{wj} [{st.id}]: games in a community draft must be community_review")
            if st.hat:
                public(st.hat.hat, "hat image")
                public(st.hat.hidden, "hidden hat image")
        if j.letter:
            public(j.letter.image, "postcard image")
        for pg in pages:
            for n in pg.teo:
                need(n.sources, c.sources, wj, "source")
                if not n.verified:
                    r.warnings.append(f"{wj}: Tèo note not verified: {n.text[:40]}…")
                elif not n.sources:
                    r.errors.append(f"{wj}: verified Tèo note needs a source: {n.text[:40]}…")
                if n.unesco and not n.sources:
                    r.warnings.append(f"{wj}: UNESCO year needs a source: {n.text[:40]}…")

    for reg in c.regions.values():
        w = f"regions.json [{reg.id}]"
        names = [ch.province for ch in reg.chapters]
        if len(names) != len(set(names)):
            r.errors.append(f"{w}: a province is listed twice in 'chapters'")
        opened = [ch for ch in reg.chapters if ch.status in ("open", "draft")]
        if len(opened) > 1:
            r.errors.append(f"{w}: only one chapter per region can be open for now (its journey)")
        for ch in opened:
            if reg.journey is None:
                r.errors.append(f"{w}: chapter '{ch.province}' is {ch.status} but the region has no journey")
            elif ch.status == "open" and not reg.journey.stops and reg.status == "locked":
                r.errors.append(f"{w}: chapter '{ch.province}' is open but the locked region has no chapter to read")
            elif ch.status == "open" and reg.journey.community_review:
                # published with a notice at the top of the chapter; the team keeps looking for community readers
                r.warnings.append(f"{w}: chapter '{ch.province}' is published before community review (shown with a notice)")
            elif ch.status == "draft" and not reg.journey.community_review:
                r.errors.append(f"{w}: chapter '{ch.province}' is 'draft' but its journey is not community_review")
        if reg.status == "open" and reg.chapters and not opened:
            r.warnings.append(f"{w}: no chapter is marked open")

    # the wardrobe only re-uses garments and accessories: every piece points at exactly one of them
    for it in c.wardrobe.values():
        w = f"wardrobe.json [{it.id}]"
        if (it.garment is None) == (it.accessory is None):
            r.errors.append(f"{w}: needs exactly one of 'garment' or 'accessory'")
        if (it.slot == "set") != (it.garment is not None):
            r.errors.append(f"{w}: slot 'set' is for garments, other slots for accessories")
        need([it.garment] if it.garment else [], c.garments, w, "garment")
        need([it.accessory] if it.accessory else [], c.accessories, w, "accessory")
        for body, path in it.layers.items():
            if not (frontend_public / path.lstrip("/")).is_file():
                r.warnings.append(f"{w}: layer for '{body}' not found ({path}), the drawn doll is used")

    # [[shown words|term-id]] in any diary text must point to glossary.json
    for t in c.glossary.values():
        w = f"glossary.json [{t.id}]"
        need(t.sources, c.sources, w, "source")
        if t.verified and not t.sources:
            r.errors.append(f"{w}: verified term needs a source")
        elif not t.verified:
            r.warnings.append(f"{w}: not verified")
    for reg in c.regions.values():
        if reg.journey:
            for m in re.finditer(r"\[\[([^|\]]+)\|([^\]]+)\]\]", json.dumps(reg.journey.model_dump(), ensure_ascii=False)):
                if m.group(2) not in c.glossary:
                    r.errors.append(f"regions/{reg.id}.json: unknown glossary term '{m.group(2)}' (in [[{m.group(1)}|…]])")

    for q in c.quiz.values():
        w = f"quiz.json [{q.id}]"
        need([q.garment_id] if q.garment_id else [], c.garments, w, "garment")
        srcs(q.sources, w)
        media(q.image, w)

    for s in c.shops.values():
        w = f"shops.json [{s.id}]"
        need(s.garments, c.garments, w, "garment")
        if not s.verified:
            r.warnings.append(f"{w}: not verified")

    ids = [s.id for s in c.opening]
    if len(ids) != len(set(ids)):
        r.errors.append("opening.json: duplicate screen id")
    for v in c.voices.values():
        if not v.voice_id:
            r.warnings.append(f"voices.json [{v.id}]: no designed voice_id yet (falls back to {v.fallback})")
    for s in c.opening:
        voiced = [b for b in s.beats if b.voice]
        for n, b in enumerate(s.beats):
            if b.voice and b.voice not in c.voices:
                r.errors.append(f"opening.json [{s.id}] beat {n}: unknown voice '{b.voice}'")
        manifest = frontend_public / "opening" / f"voice-{s.id}" / "takes.json"
        if voiced and frontend_public.exists() and not manifest.is_file():
            r.warnings.append(f"opening.json [{s.id}]: no voice-over yet (python -m scripts.generate_voices takes --screen {s.id})")
        if frontend_public.exists() and not (frontend_public / s.image.lstrip("/")).is_file():
            r.warnings.append(f"opening.json [{s.id}]: image not found at frontend/public{s.image}")

    avatar = "avatars/default.png"
    if not c.media_exists(avatar):
        r.warnings.append(f"media: content/media/{avatar} missing (needed for avatar try-on)")
    for g in c.garments.values():
        if not c.media_exists(f"fallback/{g.id}.png"):
            r.warnings.append(f"media: fallback/{g.id}.png missing (shown when Gemini is unavailable)")


def _check_zones(g: Garment, w: str, r: Report, known: Callable[[list[str]], None]) -> None:
    """Zone options (#40): only caution/free zones not set by another control, 2–4 of them, 'giu-nguyen' first."""
    for z in g.zones:
        if not z.options:
            continue
        if z.level == "keep":
            r.errors.append(f"{w}: keep zone '{z.part}' must not have options")
        if z.control:
            r.errors.append(f"{w}: '{z.part}' is changed with {z.control}, so it must not have options")
        if not 2 <= len(z.options) <= 4:
            r.errors.append(f"{w}: zone '{z.part}' needs 2–4 options")
        if z.options[0].id != KEEP_OPTION:
            r.errors.append(f"{w}: first option of '{z.part}' must be '{KEEP_OPTION}'")
        seen: set[str] = set()
        for o in z.options:
            if o.id in seen:
                r.errors.append(f"{w}: zone '{z.part}' has a duplicate option '{o.id}'")
            seen.add(o.id)
            known(o.sources)
            if o.id == KEEP_OPTION:
                continue
            if not o.sources:
                r.errors.append(f"{w}: option '{o.id}' needs a source")
            if not o.prompt:
                r.errors.append(f"{w}: option '{o.id}' needs a prompt")


_current: tuple[Content, Report] | None = None


def get() -> Content:
    global _current
    if _current is None:
        reload()
    return _current[0]  # type: ignore[index]


def report() -> Report:
    get()
    return _current[1]  # type: ignore[index]


def reload(root: Path = CONTENT_DIR) -> Report:
    """Reloads content; raises ContentError and keeps the old content if the new one is broken."""
    global _current
    content, rep = load(root)
    if rep.errors:
        raise ContentError(rep)
    _current = (content, rep)
    return rep
