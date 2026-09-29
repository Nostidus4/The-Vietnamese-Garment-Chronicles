"""F8 Hỏi Tèo: Gemini answers only from the garment data cards and must cite source ids."""

import json

from pydantic import BaseModel, ConfigDict, ValidationError

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
DỮ LIỆU (danh sách thẻ trang phục; thẻ có "dang_xem": true là trang phục người hỏi đang xem): {data}

CÂU HỎI: {question}"""


class _Answer(BaseModel):
    """What Gemini must return. Strict: a list, a number, an object answer or a string of sources is rejected."""

    model_config = ConfigDict(strict=True)
    answer: str
    sources: list[str] = []


def _refuse() -> AskResponse:
    return AskResponse(answer=NO_SOURCE, sources=[], grounded=False)


def ask(garment_id: str, question: str) -> AskResponse:
    c = store.get()
    g = c.garments.get(garment_id)
    if g is None:
        return _refuse()
    # every garment card, the one being viewed first and marked, so comparisons can be answered
    cards = []
    for x in [g, *(o for o in c.garments.values() if o.id != g.id)]:
        card = x.model_dump(include={"id", "name_vi", "period", "summary", "facts", "occasions", "zones", "sources"})
        card["source_titles"] = {s: c.sources[s].title for s in x.sources if s in c.sources}
        if x.id == g.id:
            card["dang_xem"] = True
        cards.append(card)
    prompt = SYSTEM.format(no_source=NO_SOURCE, data=json.dumps(cards, ensure_ascii=False), question=question)
    try:
        raw = get_client().generate_json(prompt)
    except GeminiUnavailable:
        return _refuse()
    try:
        out = _Answer.model_validate(raw)
    except ValidationError:
        return _refuse()  # wrong shape from the model: refuse politely, never a 500

    answer = out.answer.strip()
    if not answer or answer == NO_SOURCE:
        return _refuse()
    # Drop any source id Gemini invented; answer only while at least one real source remains
    allowed = {s for x in c.garments.values() for s in [*x.sources, *(s for f in x.facts for s in f.sources)]}
    sources = list(dict.fromkeys(s for s in out.sources if s in allowed))
    if not sources:
        return _refuse()
    return AskResponse(answer=answer, sources=sources, grounded=True)
