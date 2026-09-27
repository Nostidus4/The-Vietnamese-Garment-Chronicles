import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

load_dotenv()

from . import compass, data, gemini  # noqa: E402  (env must be loaded first)
from .models import AskRequest, CompassResult, Selection  # noqa: E402

app = FastAPI(title="Việt Phục Du Ký API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
# Fallback gallery + reference images, served for the frontend
app.mount("/static", StaticFiles(directory=data.DATA_DIR), name="static")


@app.get("/health")
def health() -> dict:
    return {"ok": True, "gemini": bool(os.getenv("GEMINI_API_KEY"))}


@app.get("/garments")
def garments() -> dict:
    return data.garments_doc()


@app.get("/occasions")
def occasions() -> dict:
    return data.occasions_doc()


@app.post("/compass", response_model=CompassResult)
def run_compass(sel: Selection) -> CompassResult:
    try:
        return compass.evaluate(sel)
    except ValueError as e:
        raise HTTPException(404, str(e))


@app.post("/tryon")
async def tryon(
    selection: str = Form(...),
    avatar_id: str | None = Form(None),
    photo: UploadFile | None = File(None),
) -> dict:
    sel = Selection.model_validate(json.loads(selection))
    result = compass.evaluate(sel)

    # A distorted look is never sent to Nano Banana: render the alternative instead.
    render_sel = result.alternative if result.state == "distorted" else sel

    person = await photo.read() if photo else gemini.avatar_bytes(avatar_id or "default")
    image_b64 = gemini.render_tryon(render_sel, person) if person else None
    # The user's photo is only held in memory for this request; nothing is written to disk.

    return {
        "compass": result.model_dump(),
        "rendered_alternative": result.state == "distorted",
        "image_base64": image_b64,
        "fallback_url": None if image_b64 else f"/static/fallback/{render_sel.garment_id}.png",
        "label_note": "Ảnh minh họa AI – cấu trúc chuẩn xem ở Story Card",
    }


@app.post("/ask")
def ask(req: AskRequest) -> dict:
    return gemini.ask_teo(req.garment_id, req.question)
