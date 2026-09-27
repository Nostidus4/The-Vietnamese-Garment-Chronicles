"""All Gemini calls live here. Prompts are assembled from data, never hand-written per call."""

import base64
import json
import os
from pathlib import Path

from . import data
from .models import Selection

IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")  # Nano Banana
TEXT_MODEL = os.getenv("GEMINI_TEXT_MODEL", "gemini-2.5-flash")

TRYON_TEMPLATE = """Edit the person in IMAGE 1 to wear the garment shown in IMAGE 2 (reference).
Garment: {name_en} ({name_vi}), {period}.
MUST KEEP: {must_keep}.
Colors: main {color_main}, accent {color_accent}. Accessories: {accessories}.
Vibe: {vibe}. Background: {background}.
MUST AVOID: {must_avoid}; Chinese hanfu collar, Korean jeogori ribbon, Japanese obi.
Keep the person's face, body shape and skin tone unchanged. Full body, natural light."""

ASK_SYSTEM = """Bạn là Tèo, hướng dẫn viên văn hóa của Việt Phục Du Ký.
Chỉ trả lời dựa trên DỮ LIỆU bên dưới. Mỗi ý phải kèm source_id.
Nếu dữ liệu không có câu trả lời: nói "Mình chưa có nguồn đáng tin cho câu này" và gợi ý câu hỏi khác.
Không so sánh hơn thua giữa các nước; không dùng từ "quốc phục".
Trả lời tối đa 80 từ, giọng thân thiện với học sinh, sinh viên.
Trả về JSON: {"answer": "...", "sources": ["..."]}
DỮ LIỆU: """


def build_tryon_prompt(sel: Selection) -> str:
    g = data.garment(sel.garment_id)
    colors = [data.color(c)["name"] for c in sel.colors if data.color(c)] or ["traditional default"]
    accessories = [data.accessory(a)["name"] for a in sel.accessories if data.accessory(a)] or ["none"]
    occ = data.occasion(sel.occasion_id)
    return TRYON_TEMPLATE.format(
        name_en=g["name_en"],
        name_vi=g["name_vi"],
        period=g["period"],
        must_keep="; ".join(g["must_keep"]),
        color_main=colors[0],
        color_accent=colors[1] if len(colors) > 1 else colors[0],
        accessories=", ".join(accessories),
        vibe=sel.vibe,
        background=occ["background"] if occ else "plain studio",
        must_avoid="; ".join(g["must_avoid"]),
    )


def _client():
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return None
    from google import genai

    return genai.Client(api_key=key)


def render_tryon(sel: Selection, person_png: bytes) -> str | None:
    """Returns a base64 PNG, or None when Gemini is unavailable (caller uses the fallback gallery)."""
    client = _client()
    if client is None:
        return None
    from google.genai import types

    ref_path = data.DATA_DIR / data.garment(sel.garment_id)["reference_image"]
    contents: list = [build_tryon_prompt(sel), types.Part.from_bytes(data=person_png, mime_type="image/png")]
    if ref_path.exists():
        contents.append(types.Part.from_bytes(data=ref_path.read_bytes(), mime_type="image/png"))
    try:
        resp = client.models.generate_content(model=IMAGE_MODEL, contents=contents)
        for part in resp.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                return base64.b64encode(part.inline_data.data).decode()
    except Exception as exc:  # network, quota, safety block: all fall back
        print(f"[tryon] Gemini error: {exc}")
    return None


def ask_teo(garment_id: str, question: str) -> dict:
    g = data.garment(garment_id)
    client = _client()
    if client is None or g is None:
        return {"answer": "Mình chưa có nguồn đáng tin cho câu này.", "sources": []}
    resp = client.models.generate_content(
        model=TEXT_MODEL,
        contents=ASK_SYSTEM + json.dumps(g, ensure_ascii=False) + "\n\nCÂU HỎI: " + question,
        config={"response_mime_type": "application/json"},
    )
    try:
        return json.loads(resp.text)
    except (json.JSONDecodeError, TypeError):
        return {"answer": "Mình chưa có nguồn đáng tin cho câu này.", "sources": []}


def avatar_bytes(avatar_id: str) -> bytes | None:
    p: Path = data.DATA_DIR / "avatars" / f"{avatar_id}.png"
    return p.read_bytes() if p.exists() else None
