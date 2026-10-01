"""Virtual try-on with Nano Banana. The Compass always runs first; distorted looks are never rendered."""

import base64
import hashlib
from collections import OrderedDict

from ..content import store
from ..models import Selection, TryOnResponse
from . import compass
from .gemini_client import GeminiUnavailable, get_client

TRYON_TEMPLATE = """Edit the person in IMAGE 1 so they wear the garment shown in IMAGE 2 (reference photo of the correct garment).
Garment: {name_en} ({name_vi}), Vietnamese, {period}.
MUST KEEP: {must_keep}.
Colors: main {color_main}, accent {color_accent}.
Accessories: {accessories}.
Styling vibe: {vibe}. Background: {background}.
MUST AVOID: {must_avoid}; Chinese hanfu collar, Korean jeogori ribbon, Japanese obi, any non-Vietnamese traditional element; any visible text, letters or Chinese characters (signs, banners, couplets, lanterns).
Keep the person's face, body shape and skin tone unchanged. Full body, natural light, photorealistic."""

TRYON_TEMPLATE_NO_REF = TRYON_TEMPLATE.replace(" in IMAGE 2 (reference photo of the correct garment)", " described below")

# Avatar renders are deterministic enough to cache; user photos are never cached or stored.
_cache: "OrderedDict[str, str]" = OrderedDict()
_CACHE_MAX = 64


def build_prompt(sel: Selection, with_reference: bool) -> str:
    c = store.get()
    g = c.garments[sel.garment_id]
    colors = [c.colors[x].name for x in sel.colors] or [c.colors[x].name for x in g.default_colors]
    accessories = [c.accessories[a].name_vi for a in sel.accessories] or ["none"]
    tpl = TRYON_TEMPLATE if with_reference else TRYON_TEMPLATE_NO_REF
    return tpl.format(
        name_en=g.name_en,
        name_vi=g.name_vi,
        period=g.period,
        must_keep="; ".join(g.must_keep),
        color_main=colors[0],
        color_accent=colors[1] if len(colors) > 1 else colors[0],
        accessories=", ".join(accessories),
        vibe=sel.vibe,
        background=c.occasions[sel.occasion_id].background,
        must_avoid="; ".join(g.must_avoid) or "none",
    )


def _reference(garment_id: str) -> tuple[bytes, str] | None:
    c = store.get()
    rel = c.garments[garment_id].reference_image
    if rel and c.media_exists(rel):
        return (c.root / "media" / rel).read_bytes(), "image/png"
    return None


def avatar(avatar_id: str) -> tuple[bytes, str] | None:
    c = store.get()
    rel = f"avatars/{avatar_id}.png"
    return ((c.root / "media" / rel).read_bytes(), "image/png") if c.media_exists(rel) else None


def run(sel: Selection, person: tuple[bytes, str] | None, cache_key: str | None) -> TryOnResponse:
    result = compass.evaluate(sel)
    render_sel = result.alternative if result.state == "distorted" and result.alternative else sel

    key = None
    if cache_key:
        key = hashlib.sha256((cache_key + render_sel.model_dump_json()).encode()).hexdigest()
        if key in _cache:
            _cache.move_to_end(key)
            return _response(result, render_sel, _cache[key], cached=True)

    image_b64 = None
    if person is not None:
        ref = _reference(render_sel.garment_id)
        images = [person] + ([ref] if ref else [])
        try:
            raw = get_client().generate_image(build_prompt(render_sel, with_reference=ref is not None), images)
            image_b64 = base64.b64encode(raw).decode()
        except GeminiUnavailable as e:
            print(f"[tryon] falling back: {e}")

    if key and image_b64:
        _cache[key] = image_b64
        if len(_cache) > _CACHE_MAX:
            _cache.popitem(last=False)
    return _response(result, render_sel, image_b64, cached=False)


def _response(result, render_sel: Selection, image_b64: str | None, cached: bool) -> TryOnResponse:
    c = store.get()
    fallback = f"fallback/{render_sel.garment_id}.png"
    return TryOnResponse(
        compass=result,
        rendered_alternative=render_sel is not None and result.state == "distorted",
        rendered_selection=render_sel,
        image_base64=image_b64,
        fallback_url=None if image_b64 else (f"/media/{fallback}" if c.media_exists(fallback) else None),
        cached=cached,
    )
