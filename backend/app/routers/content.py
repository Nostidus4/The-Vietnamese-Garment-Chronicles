"""Read-only content endpoints. The frontend loads almost everything with one call to /content/bootstrap."""

from fastapi import APIRouter, HTTPException

from ..content import store

router = APIRouter(tags=["content"])


def _dump(d: dict) -> list[dict]:
    return [v.model_dump() for v in d.values()]


@router.get("/content/bootstrap")
def bootstrap() -> dict:
    c = store.get()
    return {
        "regions": _dump(c.regions),
        "garments": _dump(c.garments),
        "occasions": _dump(c.occasions),
        "colors": {k: v.model_dump() for k, v in c.colors.items()},
        "accessories": {k: v.model_dump() for k, v in c.accessories.items()},
        "sources": {k: v.model_dump() for k, v in c.sources.items()},
        "opening": [s.model_dump() for s in c.opening],
        "glossary": {k: v.model_dump() for k, v in c.glossary.items()},
        # the wardrobe and the Compass rules, so the dress-up room can judge a look in the browser
        "wardrobe": [it.model_dump() for it in c.wardrobe.values()],
        "rules": [r.model_dump() for r in c.rules.values()],
    }


@router.get("/regions")
def regions() -> list[dict]:
    return _dump(store.get().regions)


@router.get("/regions/{region_id}")
def region(region_id: str) -> dict:
    c = store.get()
    reg = c.regions.get(region_id)
    if reg is None:
        raise HTTPException(404, f"Không có vùng '{region_id}'")
    return {**reg.model_dump(), "garment_details": [c.garments[g].model_dump() for g in reg.garments]}


@router.get("/garments")
def garments() -> list[dict]:
    return _dump(store.get().garments)


@router.get("/garments/{garment_id}")
def garment(garment_id: str) -> dict:
    c = store.get()
    g = c.garments.get(garment_id)
    if g is None:
        raise HTTPException(404, f"Không có trang phục '{garment_id}'")
    return {
        **g.model_dump(),
        "accessory_details": [c.accessories[a].model_dump() for a in g.accessories],
        "source_details": [c.sources[s].model_dump() for s in g.sources if s in c.sources],
    }


@router.get("/occasions")
def occasions() -> list[dict]:
    return _dump(store.get().occasions)


@router.get("/sources")
def sources() -> list[dict]:
    return _dump(store.get().sources)


@router.get("/opening")
def opening() -> list[dict]:
    return [s.model_dump() for s in store.get().opening]
