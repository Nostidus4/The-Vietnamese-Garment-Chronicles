"""F8 Hỏi Tèo: Gemini answers only from the garment's data card and must cite source ids."""

import json

from ..content import store
from ..models import AskResponse
from .gemini_client import GeminiUnavailable, get_client

NO_SOURCE = "Mình chưa có nguồn đáng tin cho câu này. Bạn thử hỏi về nguồn gốc, dịp mặc hoặc phần nào được đổi nhé."

SYSTEM = """Bạn là Tèo, hướng dẫn viên văn hóa của Việt Phục Du Ký.
Chỉ trả lời dựa trên DỮ LIỆU bên dưới. Mỗi ý phải kèm source_id có trong DỮ LIỆU.
Nếu dữ liệu không có câu trả lời, trả về đúng câu: "{no_source}" và "sources": [].
Không so sánh hơn thua giữa các nước; không dùng từ "quốc phục".
Trả lời tối đa 80 từ, giọng thân thiện với học sinh, sinh viên.
Trả về JSON: {{"answer": "...", "sources": ["..."]}}
DỮ LIỆU: {data}

CÂU HỎI: {question}"""


def ask(garment_id: str, question: str) -> AskResponse:
    c = store.get()
    g = c.garments.get(garment_id)
    if g is None:
        return AskResponse(answer=NO_SOURCE, sources=[], grounded=False)
    card = g.model_dump(include={"name_vi", "period", "summary", "facts", "occasions", "zones", "sources"})
    card["source_titles"] = {s: c.sources[s].title for s in g.sources if s in c.sources}
    prompt = SYSTEM.format(no_source=NO_SOURCE, data=json.dumps(card, ensure_ascii=False), question=question)
    try:
        out = get_client().generate_json(prompt)
    except GeminiUnavailable:
        return AskResponse(answer=NO_SOURCE, sources=[], grounded=False)

    # Drop any source id Gemini invented
    allowed = set(g.sources) | {s for f in g.facts for s in f.sources}
    sources = [s for s in out.get("sources", []) if s in allowed]
    answer = str(out.get("answer", "")).strip() or NO_SOURCE
    if not sources and answer != NO_SOURCE:
        return AskResponse(answer=NO_SOURCE, sources=[], grounded=False)
    return AskResponse(answer=answer, sources=sources, grounded=bool(sources))
