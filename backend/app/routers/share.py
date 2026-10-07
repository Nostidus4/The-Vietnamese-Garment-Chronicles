"""Public links for single Du Ký pages (see services/share.py for what is and is not shared)."""

import re

from fastapi import APIRouter, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import ValidationError

from ..services import ratelimit, share

router = APIRouter(prefix="/share", tags=["share"])
ID = re.compile(r"^[A-Za-z0-9_-]{8,20}$")


@router.post("", status_code=201)
async def create_share(request: Request, meta: str = Form(...), photos: list[UploadFile] = File(default=[])) -> dict:
    # abuse guard only: the address is used in memory for a minute and never stored
    if not ratelimit.allow(f"share:{request.client.host if request.client else '-'}", 5):
        raise HTTPException(429, "Con tạo link hơi nhanh, thử lại sau một phút nhé")
    try:
        m = share.ShareMeta.model_validate_json(meta)
    except ValidationError as err:
        raise HTTPException(422, err.errors(include_url=False, include_context=False)) from None
    if len(photos) > 3 or len(photos) != len(m.photo_kinds):
        raise HTTPException(422, "Số ảnh không khớp")
    files = []
    for f in photos:
        if f.content_type not in share.PHOTO_TYPES:
            raise HTTPException(415, "Chỉ nhận ảnh JPEG, PNG hoặc WebP")
        data = await f.read()
        if len(data) > share.MAX_PHOTO_BYTES:
            raise HTTPException(413, "Ảnh quá lớn")
        files.append((data, f.content_type))
    sid, key = share.create(m, files)
    return {"id": sid, "delete_key": key}


@router.get("/{sid}")
def read_share(sid: str) -> dict:
    page = share.get(sid) if ID.match(sid) else None
    if page is None:
        raise HTTPException(404, "Link này không còn hoặc chưa từng có")
    return page


@router.get("/{sid}/photo/{name}")
def share_photo(sid: str, name: str):
    p = share.local_photo(sid, name) if ID.match(sid) and re.match(r"^\d\.(jpg|png|webp)$", name) else None
    if p is None:
        raise HTTPException(404)
    return FileResponse(p)


@router.delete("/{sid}")
def delete_share(sid: str, x_delete_key: str = Header(...)) -> dict:
    if not ID.match(sid) or not share.delete(sid, x_delete_key):
        raise HTTPException(404, "Không gỡ được: sai link hoặc sai mã")
    return {"deleted": True}
