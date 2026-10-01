"""#38: Gemini retry inside the 60 s budget, Retry-After on 429, and limiting by the real client IP behind Render's proxy."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.config import settings
from app.main import app
from app.models import Selection
from app.services import gemini_client, ratelimit, tryon
from app.services.gemini_client import GeminiUnavailable

SEL = Selection(garment_id="ao-dai", occasion_id="di-tich")
PERSON = (b"\x89PNG me", "image/png")


class Clock:
    """Stands in for the time module inside tryon: Gemini calls and retry sleeps advance it instead of waiting."""

    def __init__(self):
        self.now = 0.0
        self.sleeps: list[float] = []

    def monotonic(self) -> float:
        return self.now

    def sleep(self, s: float) -> None:
        self.sleeps.append(s)
        self.now += s


class ScriptedImages(gemini_client.GeminiClient):
    """Each call takes `seconds` on the clock, then returns bytes or raises."""

    def __init__(self, clock: Clock, outcomes: list[tuple[float, bytes | Exception]]):
        self.clock = clock
        self.outcomes = outcomes
        self.timeouts: list[float | None] = []

    @property
    def available(self) -> bool:
        return True

    def generate_image(self, prompt, images, aspect_ratio=None, timeout_s=None):
        self.timeouts.append(timeout_s)
        seconds, out = self.outcomes.pop(0)
        self.clock.now += seconds
        if isinstance(out, Exception):
            raise out
        return out


@pytest.fixture
def clock(monkeypatch):
    c = Clock()
    monkeypatch.setattr(tryon, "time", c)
    return c


def scripted(clock, *outcomes):
    fake = ScriptedImages(clock, list(outcomes))
    gemini_client.set_client(fake)
    return fake


@pytest.mark.parametrize("code", ["429", "500", "503"])
def test_retry_succeeds_on_second_try(clock, code):
    fake = scripted(clock, (5, GeminiUnavailable("busy", code=code)), (8, b"\x89PNG ok"))
    r = tryon.run(SEL, PERSON, None)
    assert r.image_base64
    assert len(fake.timeouts) == 2
    assert clock.sleeps == [tryon.RETRY_DELAY_S]
    # the second try only gets what is left of the budget
    assert fake.timeouts[1] <= tryon.BUDGET_S - 5 - tryon.RETRY_DELAY_S


def test_retries_only_once_then_falls_back(clock):
    fake = scripted(clock, (3, GeminiUnavailable("busy", code="503")), (3, GeminiUnavailable("busy", code="503")))
    r = tryon.run(SEL, PERSON, None)
    assert r.image_base64 is None
    assert r.fallback_url == "/media/fallback/ao-dai.png"
    assert len(fake.timeouts) == 2


def test_no_retry_when_budget_is_spent(clock):
    fake = scripted(clock, (50, GeminiUnavailable("busy", code="503")), (1, b"\x89PNG never"))
    r = tryon.run(SEL, PERSON, None)
    assert r.image_base64 is None
    assert len(fake.timeouts) == 1
    assert clock.sleeps == []


@pytest.mark.parametrize("code", ["no_image", "no_key", "400", "timeout"])
def test_no_retry_for_other_errors(clock, code):
    fake = scripted(clock, (2, GeminiUnavailable("blocked", code=code)), (1, b"\x89PNG never"))
    r = tryon.run(SEL, PERSON, None)
    assert r.image_base64 is None
    assert len(fake.timeouts) == 1


def test_retry_is_logged(clock, caplog):
    scripted(clock, (5, GeminiUnavailable("busy", code="503")), (8, b"\x89PNG ok"))
    with caplog.at_level("INFO", logger="tryon"):
        tryon.run(SEL, PERSON, None)
    assert any("retry" in m and "503" in m for m in caplog.messages)


def test_sdk_errors_carry_their_http_code():
    from google.genai import errors

    class Models:
        def generate_content(self, **_):
            raise errors.APIError(503, {"error": {"code": 503, "message": "overloaded", "status": "UNAVAILABLE"}})

    client = gemini_client.GeminiClient(api_key=None)
    client._client = type("C", (), {"models": Models()})()
    with pytest.raises(GeminiUnavailable) as e:
        client.generate_image("p", [])
    assert e.value.code == "503" and e.value.retryable

    with pytest.raises(GeminiUnavailable) as e:
        gemini_client.GeminiClient(api_key=None).generate_image("p", [])
    assert not e.value.retryable


# ---- limiter ----

FORM = {"selection": json.dumps({"garment_id": "ao-dai", "occasion_id": "di-tich"})}
PHOTO = {"photo": ("me.png", b"x", "image/png")}


@pytest.fixture
def one_per_minute(monkeypatch, fake_gemini):
    ratelimit._hits.clear()
    monkeypatch.setattr("app.routers.styling.settings", type("S", (), {"tryon_per_minute": 1, "max_upload_mb": 8})())


def test_429_says_when_to_retry(one_per_minute):
    with TestClient(app) as c:
        assert c.post("/tryon", data=FORM, files=PHOTO).status_code == 200
        r = c.post("/tryon", data=FORM, files=PHOTO, headers={"Origin": settings.cors_origins[0]})
    assert r.status_code == 429
    assert 1 <= int(r.headers["Retry-After"]) <= 60
    # the frontend runs on another origin and can only read the header if CORS exposes it
    assert "retry-after" in r.headers["access-control-expose-headers"].lower()


def _dockerfile_cmd() -> list[str]:
    line = next(x for x in (Path(__file__).parents[1] / "Dockerfile").read_text().splitlines() if x.startswith("CMD"))
    return json.loads(line.removeprefix("CMD"))


def test_limit_is_per_forwarded_ip_behind_the_proxy(one_per_minute):
    cmd = _dockerfile_cmd()
    assert "--proxy-headers" in cmd and "--forwarded-allow-ips" in cmd
    trusted = cmd[cmd.index("--forwarded-allow-ips") + 1]
    # what uvicorn does with those flags; TestClient connects as "testclient", like Render's proxy would
    with TestClient(ProxyHeadersMiddleware(app, trusted_hosts=trusted)) as c:

        def post(ip):
            return c.post("/tryon", data=FORM, files=PHOTO, headers={"X-Forwarded-For": ip}).status_code

        assert post("1.1.1.1") == 200
        assert post("2.2.2.2") == 200  # another visitor through the same proxy has their own bucket
        assert post("1.1.1.1") == 429
