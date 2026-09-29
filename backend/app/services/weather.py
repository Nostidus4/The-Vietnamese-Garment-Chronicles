"""F4 weather hint via Open-Meteo (free, no key). Cached 30 minutes per region (and per date for forecasts)."""

import time
from datetime import date as Date

import httpx

from ..content import store

HOT_C = 30.0
_cache: dict[str, tuple[float, dict]] = {}


FORECAST_DAYS = 16  # Open-Meteo's horizon


def _tips(reg, hot: bool) -> list[dict]:
    c = store.get()
    return [{"garment_id": g, "tip": c.garments[g].hot_weather_tip} for g in reg.garments if hot and c.garments[g].hot_weather_tip]


def forecast(region_id: str, day: Date) -> dict | None:
    """Daily max temperature for one day of an event (ticket #25), or why there is none yet."""
    c = store.get()
    reg = c.regions.get(region_id)
    if reg is None:
        return None
    if not reg.weather_point:
        return {"available": False, "reason": "no_point"}
    ahead = (day - Date.today()).days
    if ahead < 0:
        return {"available": False, "reason": "past"}
    if ahead >= FORECAST_DAYS:
        return {"available": False, "reason": "too_far", "days_until_forecast": ahead - FORECAST_DAYS + 1}
    key = f"{region_id}@{day.isoformat()}"
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < 1800:
        return hit[1]
    try:
        r = httpx.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": reg.weather_point.lat,
                "longitude": reg.weather_point.lon,
                "daily": "temperature_2m_max,precipitation_probability_max",
                "timezone": "Asia/Ho_Chi_Minh",
                "start_date": day.isoformat(),
                "end_date": day.isoformat(),
            },
            timeout=3,
        )
        d = r.json()["daily"]
        temp = float(d["temperature_2m_max"][0])
        rain = d.get("precipitation_probability_max", [None])[0]
    except Exception:
        return {"available": False, "reason": "unreachable"}
    hot = temp >= HOT_C
    out = {"available": True, "date": day.isoformat(), "max_c": temp, "rain_chance": rain, "is_hot": hot, "tips": _tips(reg, hot)}
    _cache[key] = (time.time(), out)
    return out


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
    out = {"available": True, "temperature_c": temp, "is_hot": hot, "tips": _tips(reg, hot)}
    _cache[region_id] = (time.time(), out)
    return out
