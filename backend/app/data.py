import json
from functools import lru_cache
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load(name: str) -> dict:
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


@lru_cache
def garments_doc() -> dict:
    return _load("garments.json")


@lru_cache
def rules() -> dict[str, dict]:
    return {r["id"]: r for r in _load("rules.json")["rules"]}


@lru_cache
def occasions_doc() -> dict:
    return _load("occasions.json")


def garment(garment_id: str) -> dict | None:
    return next((g for g in garments_doc()["garments"] if g["id"] == garment_id), None)


def accessory(accessory_id: str) -> dict | None:
    return garments_doc()["accessories"].get(accessory_id)


def color(color_id: str) -> dict | None:
    return garments_doc()["colors"].get(color_id)


def occasion(occasion_id: str) -> dict | None:
    return next((o for o in occasions_doc()["occasions"] if o["id"] == occasion_id), None)
