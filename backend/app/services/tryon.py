"""Virtual try-on with Nano Banana. The Compass always runs first; distorted looks are never rendered."""

import base64
import hashlib
import logging
import time
from collections import OrderedDict

from ..config import settings
from ..content import store
from ..models import FallbackReason, Selection, TryOnResponse
from . import compass
from .gemini_client import GeminiUnavailable, get_client

TRYON_TEMPLATE = """Edit the person in IMAGE 1 so they wear the garment shown in IMAGE 2 (reference photo of the correct garment).
Garment: {name_en} ({name_vi}), Vietnamese, {period}.
The person in IMAGE 1 is the wearer and stays the same person: same gender, face, hair, body shape, height and skin tone. Do not replace them with a model; IMAGE 2 shows only the garment.{men_cut}
MUST KEEP: {must_keep}.
Colors: main {color_main}, accent {color_accent}.
Accessories: {accessories}.{changes}
Styling vibe: {vibe}. Background: {background}.
MUST AVOID: {must_avoid}; Chinese hanfu collar, Korean jeogori ribbon, Japanese obi, any non-Vietnamese traditional element; any visible text, letters or Chinese characters (signs, banners, couplets, lanterns).
Full body, natural light, photorealistic."""

TRYON_TEMPLATE_NO_REF = TRYON_TEMPLATE.replace("shown in IMAGE 2 (reference photo of the correct garment)", "described below").replace(
    "; IMAGE 2 shows only the garment.", "."
)

# Avatar renders are deterministic enough to cache; user photos are never cached or stored.
_cache: "OrderedDict[str, str]" = OrderedDict()
_CACHE_MAX = 64

log = logging.getLogger("tryon")

# All tries together stay within one Gemini timeout, so the frontend's 75 s limit still holds
BUDGET_S = settings.image_timeout_s
RETRY_DELAY_S = 2.0
MIN_RETRY_S = 15.0  # a render takes ~12 s (docs/NANO_BANANA_BENCH.md); with less left a retry would only time out


def fallback_reason(code: str) -> FallbackReason:
    """What the reader is told when only the sample picture came back (#52)."""
    if code == "no_image":
        return "no_person"  # Gemini answered in words: with a photo of no one, there is nobody to dress
    if code == "blocked":
        return "blocked"
    if code in ("timeout", "504"):
        return "timeout"
    if code in ("402", "no_key"):
        return "unavailable"  # no key, or prepaid credits used up: a retry in a few minutes won't help
    return "busy"


def build_prompt(sel: Selection, with_reference: bool) -> str:
    c = store.get()
    g = c.garments[sel.garment_id]
    colors = [c.colors[x].name for x in sel.colors] or [c.colors[x].name for x in g.default_colors]
    accessories = [c.accessories[a].name_vi for a in sel.accessories] or ["none"]
    # the viewer's picks from the zone options, on their own line so MUST KEEP / MUST AVOID still bind them
    picked = [o.prompt for _, o in compass.changes(sel, g)]
    tpl = TRYON_TEMPLATE if with_reference else TRYON_TEMPLATE_NO_REF
    return tpl.format(
        name_en=g.name_en,
        name_vi=g.name_vi,
        period=g.period,
        # the refs are women's cuts: without this a man in the photo came back as a woman
        men_cut=f"\nIf the wearer is a man, use the men's cut: {g.men_cut}." if g.men_cut else "",
        must_keep="; ".join(g.must_keep),
        color_main=colors[0],
        color_accent=colors[1] if len(colors) > 1 else colors[0],
        accessories=", ".join(accessories),
        changes=f"\nChanges asked by the wearer (only these; everything under MUST KEEP stays): {'; '.join(picked)}." if picked else "",
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


def _render(prompt: str, images: list[tuple[bytes, str]]) -> bytes:
    """Gemini, retried once on 429/5xx while enough of the budget is left. Raises GeminiUnavailable."""
    client = get_client()
    start = time.monotonic()
    try:
        return client.generate_image(prompt, images, timeout_s=BUDGET_S)
    except GeminiUnavailable as e:
        left = BUDGET_S - (time.monotonic() - start) - RETRY_DELAY_S
        if not e.retryable or left < MIN_RETRY_S:
            raise
        log.info("retry in %.0fs after code=%s, %.0fs of budget left", RETRY_DELAY_S, e.code, left)
        time.sleep(RETRY_DELAY_S)
        return client.generate_image(prompt, images, timeout_s=left)


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
    reason: FallbackReason = "unavailable"  # nobody to dress: no photo and no avatar picture on the server
    if person is not None:
        ref = _reference(render_sel.garment_id)
        images = [person] + ([ref] if ref else [])
        try:
            raw = _render(build_prompt(render_sel, with_reference=ref is not None), images)
            image_b64 = base64.b64encode(raw).decode()
        except GeminiUnavailable as e:
            log.warning("falling back after code=%s: %s", e.code, e)
            reason = fallback_reason(e.code)

    if key and image_b64:
        _cache[key] = image_b64
        if len(_cache) > _CACHE_MAX:
            _cache.popitem(last=False)
    return _response(result, render_sel, image_b64, cached=False, reason=reason)


def _response(result, render_sel: Selection, image_b64: str | None, cached: bool, reason: FallbackReason | None = None) -> TryOnResponse:
    c = store.get()
    fallback = f"fallback/{render_sel.garment_id}.png"
    return TryOnResponse(
        compass=result,
        rendered_alternative=render_sel is not None and result.state == "distorted",
        rendered_selection=render_sel,
        image_base64=image_b64,
        fallback_url=None if image_b64 else (f"/media/{fallback}" if c.media_exists(fallback) else None),
        fallback_reason=None if image_b64 else reason,
        cached=cached,
    )
