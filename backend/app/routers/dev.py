"""Dev-only tools for the /voice-review page. Mounted only when DEV_TOOLS=1 (never on the demo server)."""

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from ..content import store
from ..services import voiceover as vo

router = APIRouter(prefix="/dev/voiceover", tags=["dev"])


def _screen(sid: str):
    s = next((x for x in store.get().opening if x.id == sid), None)
    if s is None:
        raise HTTPException(404, f"no screen {sid}")
    return s


@router.get("")
def overview() -> dict:
    """Voices with their designed options, and every screen's takes (planned and generated)."""
    doc = vo.voices_doc()
    voices = {v["id"]: v for v in doc["voices"]}
    screens = []
    for s in store.get().opening:
        takes = vo.takes_of(s, voices)
        if not takes:
            continue
        m = vo.load_manifest(s.id) or {"takes": []}
        made = {t["id"]: t for t in m["takes"]}
        screens.append(
            {
                "id": s.id,
                "title": s.title,
                "scene": s.scene,
                "takes": [made.get(t.id) or {"id": t.id, "voice": t.voice, "beats": t.beats, "text": t.text, "missing": True} for t in takes],
            }
        )
    return {"voices": doc["voices"], "screens": screens}


class VoicePick(BaseModel):
    voice: str
    voice_id: str


@router.post("/voice-pick")
def voice_pick(p: VoicePick) -> dict:
    doc = vo.voices_doc()
    v = next((x for x in doc["voices"] if x["id"] == p.voice), None)
    if v is None or p.voice_id not in [c["voice_id"] for c in v.get("candidates", [])]:
        raise HTTPException(400, "unknown voice option")
    v["voice_id"] = p.voice_id
    vo.save_voices_doc(doc)
    return {"ok": True, "note": "Tạo lại các đoạn của nhân vật này để dùng giọng mới."}


class TakePick(BaseModel):
    screen: str
    take: str
    key: str


@router.post("/take-pick")
def take_pick(p: TakePick) -> dict:
    m = vo.load_manifest(p.screen)
    t = next((x for x in (m or {}).get("takes", []) if x["id"] == p.take), None)
    c = next((x for x in (t or {}).get("candidates", []) if x["key"] == p.key), None)
    if c is None:
        raise HTTPException(404, "unknown take or candidate")
    t.update(vo.pick(p.screen, t, c))
    vo.save_manifest(p.screen, m)
    return t


class Regen(BaseModel):
    screen: str
    take: str | None = None  # null = every take of the screen


@router.post("/regenerate")
async def regenerate(p: Regen) -> dict:
    s = _screen(p.screen)
    return await run_in_threadpool(lambda: vo.make_screen(vo.client(), s, only=p.take))
