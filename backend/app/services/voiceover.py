"""Voice-over for the Opening, generated with Gemini TTS and checked before it reaches the web.

Unit of work = a *take*: consecutive lines of one speaker in a screen with no click pause between them.
A take is spoken in ONE call, so a teacher's three sentences never come out as three different voices.
Each take is generated as 3 candidates; every candidate is loudness-normalised, trimmed with breathing room,
analysed (speaking rate, pauses) and scored; the best is picked automatically and can be changed on /voice-review.

Files, one folder per screen so it is easy to keep track:
  frontend/public/opening/voice-s01/takes.json            manifest the player reads (cue times per line)
  frontend/public/opening/voice-s01/t01-co-giao.mp3        the chosen take
  frontend/public/opening/voice-s01/_candidates/…          the 3 candidates (not committed)
  frontend/public/opening/voice-design/<voice>-<k>.mp3     voice-design samples (not committed)
"""

from __future__ import annotations

import base64
import json
import re
import shutil
import subprocess
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path

from google import genai

from app.config import settings
from app.content.schemas import OpeningScreen

ROOT = Path(__file__).resolve().parents[3]
CONTENT = ROOT / "backend" / "content"
PUBLIC = ROOT / "frontend" / "public" / "opening"
KEYS = "abc"


# ---------------------------------------------------------------- data files


def voices_doc() -> dict:
    return json.loads((CONTENT / "voices.json").read_text())


def save_voices_doc(doc: dict) -> None:
    (CONTENT / "voices.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")


def screen_dir(screen_id: str) -> Path:
    return PUBLIC / f"voice-{screen_id}"


def load_manifest(screen_id: str) -> dict | None:
    p = screen_dir(screen_id) / "takes.json"
    return json.loads(p.read_text()) if p.is_file() else None


def save_manifest(screen_id: str, m: dict) -> None:
    d = screen_dir(screen_id)
    d.mkdir(parents=True, exist_ok=True)
    (d / "takes.json").write_text(json.dumps(m, ensure_ascii=False, indent=2) + "\n")


# ---------------------------------------------------------------- takes


@dataclass
class Take:
    id: str  # t01, t02…
    voice: str
    beats: list[int]
    text: str
    style: str


def _sentence(t: str) -> str:
    t = " ".join(t.split())  # line breaks are for the page layout, not for the voice
    return t if re.search(r"[.!?…]$", t) else t + "."


def takes_of(screen: OpeningScreen, voice: dict[str, dict]) -> list[Take]:
    """Group a screen's voiced lines into takes: same speaker, no click pause in between."""
    groups: list[list[int]] = []
    for n, b in enumerate(screen.beats):
        if not b.voice:
            continue
        prev = groups[-1][-1] if groups else None
        same = prev is not None and prev == n - 1 and screen.beats[prev].voice == b.voice and not b.wait_click
        if same:
            groups[-1].append(n)
        else:
            groups.append([n])
    out = []
    for i, g in enumerate(groups, 1):
        bs = [screen.beats[n] for n in g]
        v = bs[0].voice
        text = " ".join(_sentence(b.say or b.text) for b in bs)
        how = bs[0].delivery or ""
        if len(bs) > 1:
            how = " Then: ".join(filter(None, (b.delivery for b in bs)))
        style = " ".join(
            filter(
                None,
                [
                    f"Scene: {screen.scene}" if screen.scene else None,
                    f"Speaker: {voice[v]['base_style']}",
                    f"Delivery: {how}" if how else None,
                    "Speak Vietnamese with a natural Northern accent. Leave a short natural pause between sentences.",
                ],
            )
        )
        out.append(Take(id=f"t{i:02d}", voice=v, beats=g, text=text, style=style))
    return out


# ---------------------------------------------------------------- Gemini


def client() -> genai.Client:
    if not settings.gemini_api_key:
        raise RuntimeError("Thiếu GEMINI_API_KEY trong backend/.env")
    return genai.Client(api_key=settings.gemini_api_key)


def _retry(fn, what: str):
    for attempt in range(4):
        try:
            return fn()
        except Exception as e:  # noqa: BLE001 – any API hiccup: report and retry
            if attempt == 3 or "400" in str(e)[:40] or "blocked" in str(e) or "per day" in str(e):
                raise  # a refused request will be refused again: fail fast
            wait = 6 * (attempt + 1)
            print(f"   ! {what}: {e.__class__.__name__} {str(e)[:140]} – thử lại sau {wait}s")
            time.sleep(wait)


def synth(c: genai.Client, model: str, voice: str, text: str, style: str) -> bytes:
    def call():
        it = c.interactions.create(
            model=model,
            input=[{"type": "user_input", "content": [{"type": "text", "text": text, "annotations": [{"type": "speech_metadata", "style": style}]}]}],
            response_format={"type": "audio"},
            generation_config={"speech_config": [{"voice": voice}]},
            timeout=120,  # a hung call must not stall the whole batch
        )
        return base64.b64decode(it.output_audio.data)

    return _retry(call, "TTS")


def design(c: genai.Client, voice_id: str, n: int = 3) -> list[dict]:
    """Create n designed voices from the description; save their samples for listening."""
    doc = voices_doc()
    v = next(x for x in doc["voices"] if x["id"] == voice_id)
    out = []
    for k in KEYS[:n]:
        try:
            res = _retry(
                lambda: c.voices.create(
                    voice={
                        "type": "prompted",
                        "prompted": {"input": v["design_prompt"]},
                        "display_name": f"vpdk-{voice_id}-{k}",
                        "language_code": "vi-VN",
                        "gender": v["gender"],
                    },
                    store=True,
                    timeout=180,
                ),
                "voice design",
            )
        except Exception as e:  # noqa: BLE001 – one refused option must not lose the others
            print(f"   {voice_id}-{k}: bị từ chối ({str(e)[-90:]})")
            continue
        d = res.model_dump()
        raw = (d.get("sample_audio") or {}).get("data")
        sample = None
        if raw:
            dest = PUBLIC / "voice-design" / f"{voice_id}-{k}.mp3"
            encode(base64.b64decode(raw) if isinstance(raw, str) else raw, dest, normalize=True, trim=False)
            sample = f"/opening/voice-design/{voice_id}-{k}.mp3"
        out.append({"key": k, "voice_id": d["id"], "sample": sample})
        print(f"   {voice_id}-{k}: {d['id']}")
    if not out:
        raise RuntimeError(f"Không tạo được phương án nào cho {voice_id}: cần sửa design_prompt")
    v["candidates"] = out
    v["voice_id"] = v.get("voice_id") or out[0]["voice_id"]
    save_voices_doc(doc)
    return out


# ---------------------------------------------------------------- audio processing


def encode(wav: bytes, dest: Path, normalize: bool = True, trim: bool = True) -> None:
    """WAV → mono MP3 at -16 LUFS. Trim keeps 150 ms before the first word and 300 ms after the last."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    chain = []
    if trim:
        chain.append("silenceremove=start_periods=1:start_silence=0.15:start_threshold=-50dB")
        chain.append("areverse,silenceremove=start_periods=1:start_silence=0.30:start_threshold=-50dB,areverse")
    if normalize:
        chain.append("loudnorm=I=-16:TP=-1.5:LRA=11")
    with tempfile.NamedTemporaryFile(suffix=".wav") as f:
        f.write(wav)
        f.flush()
        cmd = ["ffmpeg", "-loglevel", "error", "-y", "-i", f.name]
        if chain:
            cmd += ["-af", ",".join(chain)]
        subprocess.run(cmd + ["-ar", "24000", "-ac", "1", "-b:a", "80k", str(dest)], check=True)


def analyse(path: Path) -> tuple[float, list[tuple[float, float]]]:
    """Duration and the silent gaps inside the clip (start, end) in seconds."""
    r = subprocess.run(
        ["ffmpeg", "-i", str(path), "-af", "silencedetect=noise=-38dB:d=0.16", "-f", "null", "-"], capture_output=True, text=True
    )
    dur = float(
        subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], capture_output=True, text=True
        ).stdout
    )
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    gaps = [(s, e) for s, e in zip(starts, ends) if s > 0.2 and e < dur - 0.2]
    return dur, gaps


def syllables(text: str) -> int:
    return len(re.findall(r"[\wÀ-ỹ]+", text))


def _snap(t: float, gaps: list[tuple[float, float]], window: float) -> float | None:
    """The end of the pause closest to t (a line starts right after a pause), if one is near enough."""
    near = [e for _, e in gaps if abs(e - t) <= window]
    return min(near, key=lambda e: abs(e - t)) if near else None


def align(c: genai.Client | None, path: Path, lines: list[str]) -> list[float] | None:
    """Ask Gemini to listen and say when each line starts (seconds). None if it cannot."""
    if c is None or len(lines) < 2:
        return None
    try:
        r = c.models.generate_content(
            model=settings.text_model,
            contents=[
                genai.types.Part.from_bytes(data=path.read_bytes(), mime_type="audio/mpeg"),
                "Listen to this Vietnamese recording. It reads these lines in order:\n"
                + "\n".join(f"{i + 1}. {t}" for i, t in enumerate(lines))
                + "\nReturn only JSON: a list with the start time in seconds (one decimal) of each line, "
                "e.g. [0.0, 3.4, 6.1]. The first line starts at the first spoken word.",
            ],
            config={"response_mime_type": "application/json", "temperature": 0},
        )
        times = json.loads(r.text)
        if isinstance(times, list) and len(times) == len(lines) and all(isinstance(x, (int, float)) for x in times):
            return [float(x) for x in times]
    except Exception as e:  # noqa: BLE001 – alignment is a helper; fall back to pauses
        print(f"   ! align: {str(e)[:100]}")
    return None


def cues_for(
    beats_text: list[str], dur: float, gaps: list[tuple[float, float]], heard: list[float] | None = None
) -> tuple[list[float], bool]:
    """When each line starts inside the take.

    Expected positions come from what Gemini heard (or, failing that, the share of syllables); each is snapped to
    the nearest real pause. cues_ok is False when a line boundary has no pause near where it should be.
    """
    k = len(beats_text) - 1
    if k == 0:
        return [0.0], True
    if heard:
        expected = heard[1:]
    else:
        total = sum(syllables(t) for t in beats_text) or 1
        speech = dur - 0.45
        acc, expected = 0, []
        for t in beats_text[:-1]:
            acc += syllables(t)
            expected.append(0.15 + speech * acc / total)
    cues, ok, last = [0.0], True, 0.0
    for e in expected:
        snapped = _snap(e, [g for g in gaps if g[1] > last + 0.3], window=0.6 if heard else 1.2)
        if snapped is None:
            ok = False
            snapped = max(e, last + 0.3)
        cues.append(round(snapped - 0.05, 2))
        last = snapped
    return cues, ok


def score(rate: float, target: float, cues_ok: bool, gaps: list[tuple[float, float]], dur: float, sylls: int) -> float:
    """Lower is better: close to the character's pace, pauses found for every line, no dead air, not clipped."""
    s = abs(rate - target) / target
    s += 0 if cues_ok else 0.6
    s += 0.5 * sum(1 for a, b in gaps if b - a > 1.4)
    if dur < 0.8 + sylls / 6.5:
        s += 1.0  # too short: swallowed words
    return round(s, 3)


# ---------------------------------------------------------------- one take


def make_take(c: genai.Client, screen: OpeningScreen, take: Take, n: int = 3) -> dict:
    doc = voices_doc()
    by_id = {x["id"]: x for x in doc["voices"]}
    v = by_id[take.voice]
    src = by_id[v["same_as"]] if v.get("same_as") else v  # e.g. Tí lúc bé speaks with Tí's voice, lighter
    voice_name = src.get("voice_id") or src["fallback"]
    d = screen_dir(screen.id)
    beats_text = [(screen.beats[b].say or screen.beats[b].text).strip() for b in take.beats]
    sylls = syllables(take.text)
    cands = []
    for k in KEYS[:n]:
        dest = d / "_candidates" / f"{take.id}-{take.voice}-{k}.mp3"
        encode(synth(c, doc["model"], voice_name, take.text, take.style), dest)
        dur, gaps = analyse(dest)
        speech = max(0.3, dur - 0.45 - sum(b - a for a, b in gaps))
        rate = round(sylls / speech, 2)
        cues, ok = cues_for(beats_text, dur, gaps, align(c, dest, beats_text))
        cands.append(
            {
                "key": k,
                "file": f"_candidates/{dest.name}",
                "duration": round(dur, 2),
                "rate": rate,
                "cues": cues,
                "cues_ok": ok,
                "long_pauses": sum(1 for a, b in gaps if b - a > 1.4),
                "score": score(rate, v["rate"], ok, gaps, dur, sylls),
            }
        )
        print(f"   {take.id} {take.voice}-{k}: {dur:.1f}s {rate} ât/s cues={'ok' if ok else 'ƯỚC LƯỢNG'} score={cands[-1]['score']}")
    best = min(cands, key=lambda x: x["score"])
    return {
        "id": take.id,
        "voice": take.voice,
        "voice_name": voice_name,
        "beats": take.beats,
        "text": take.text,
        "style": take.style,
        "target_rate": v["rate"],
        "candidates": cands,
        **pick(screen.id, take, best),
    }


def pick(screen_id: str, take: Take | dict, cand: dict) -> dict:
    """Copy a candidate to the take file the player uses; returns the fields to store in the manifest."""
    tid, voice = (take.id, take.voice) if isinstance(take, Take) else (take["id"], take["voice"])
    d = screen_dir(screen_id)
    name = f"{tid}-{voice}.mp3"
    shutil.copyfile(d / cand["file"], d / name)
    return {"file": name, "picked": cand["key"], "duration": cand["duration"], "cues": cand["cues"], "cues_ok": cand["cues_ok"]}


def make_screen(c: genai.Client, screen: OpeningScreen, only: str | None = None) -> dict:
    voice = {x["id"]: x for x in voices_doc()["voices"]}
    takes = takes_of(screen, voice)
    old = load_manifest(screen.id) or {}
    old_takes = {t["id"]: t for t in old.get("takes", [])}
    out = []
    for t in takes:
        if only and t.id != only and t.id in old_takes and old_takes[t.id]["text"] == t.text:
            out.append(old_takes[t.id])
            continue
        out.append(make_take(c, screen, t))
    m = {"screen": screen.id, "takes": out}
    save_manifest(screen.id, m)
    return m


def recue_screen(c: genai.Client, screen: OpeningScreen) -> dict:
    """Re-measure the takes already on disk (cues, rate, score) and re-pick the best, without new audio."""
    m = load_manifest(screen.id)
    if not m:  # a run cut short: rebuild the manifest from the candidates already on disk
        doc = voices_doc()
        voices = {x["id"]: x for x in doc["voices"]}
        m = {"screen": screen.id, "takes": []}
        for t in takes_of(screen, voices):
            files = sorted((screen_dir(screen.id) / "_candidates").glob(f"{t.id}-{t.voice}-*.mp3"))
            if not files:
                continue
            m["takes"].append(
                {"id": t.id, "voice": t.voice, "voice_name": "", "beats": t.beats, "text": t.text, "style": t.style,
                 "target_rate": voices[t.voice]["rate"],
                 "candidates": [{"key": f.stem[-1], "file": f"_candidates/{f.name}"} for f in files]}
            )
    d = screen_dir(screen.id)
    for t in m["takes"]:
        beats_text = [(screen.beats[b].say or screen.beats[b].text).strip() for b in t["beats"]]
        sylls = syllables(t["text"])
        for cand in t["candidates"]:
            dur, gaps = analyse(d / cand["file"])
            speech = max(0.3, dur - 0.45 - sum(b - a for a, b in gaps))
            cand["duration"] = round(dur, 2)
            cand["long_pauses"] = sum(1 for a, b in gaps if b - a > 1.4)
            cand["rate"] = round(sylls / speech, 2)
            cand["cues"], cand["cues_ok"] = cues_for(beats_text, dur, gaps, align(c, d / cand["file"], beats_text))
            cand["score"] = score(cand["rate"], t["target_rate"], cand["cues_ok"], gaps, dur, sylls)
        best = min(t["candidates"], key=lambda x: x["score"])
        t.update(pick(screen.id, t, best))
        print(f"   {t['id']} {t['voice']}: chọn {best['key']} cues {best['cues']}")
    save_manifest(screen.id, m)
    return m
