"""F4 weather hint via Open-Meteo (free, no key). Cached 30 minutes per region."""

import time

import httpx

from ..content import store

HOT_C = 30.0
_cache: dict[str, tuple[float, dict]] = {}


def for_region(region_id: str) -> dict | None:
    c = store.get()
    reg = c.regions.get(region_id)
    if reg is None:
        return None
    if not reg.weather_point:
        return {"available": False}

    hit = _cache.get(region_id)
    if hit and time.time() - hit[0] < 1800:
        return hit[1]

    try:
        r = httpx.get(
            "https://api.open-meteo.com/v1/forecast",
            params={"latitude": reg.weather_point.lat, "longitude": reg.weather_point.lon, "current": "temperature_2m"},
            timeout=3,
        )
        temp = float(r.json()["current"]["temperature_2m"])
    except Exception:
        return {"available": False}

    hot = temp >= HOT_C
    tips = [
        {"garment_id": g, "tip": c.garments[g].hot_weather_tip}
        for g in reg.garments
        if hot and c.garments[g].hot_weather_tip
    ]
    out = {"available": True, "temperature_c": temp, "is_hot": hot, "tips": tips}
    _cache[region_id] = (time.time(), out)
    return out
