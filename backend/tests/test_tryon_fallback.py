"""#52: when the try-on falls back to the sample picture, the response says why, so the page can tell the reader."""

import pytest
from google.genai import types

from app.models import Selection
from app.services import gemini_client, tryon
from app.services.gemini_client import GeminiUnavailable

SEL = Selection(garment_id="ao-dai", occasion_id="di-tich")
PHOTO = (b"\x89PNG me", "image/png")


class Once(gemini_client.GeminiClient):
    def __init__(self, out: bytes | Exception):
        self.out = out

    def generate_image(self, prompt, images, aspect_ratio=None, timeout_s=None):
        if isinstance(self.out, Exception):
            raise self.out
        return self.out


@pytest.fixture(autouse=True)
def no_retry_wait(monkeypatch):
    monkeypatch.setattr(tryon, "RETRY_DELAY_S", 0.0)


def test_a_fresh_render_has_no_fallback_reason():
    gemini_client.set_client(Once(b"\x89PNG ok"))
    r = tryon.run(SEL, PHOTO, None)
    assert r.image_base64 and r.fallback_reason is None


@pytest.mark.parametrize(
    "code, reason",
    [
        ("no_image", "no_person"),  # Gemini answered in words: with a photo, almost always "no one to dress"
        ("blocked", "blocked"),
        ("timeout", "timeout"),
        ("504", "timeout"),
        ("503", "busy"),
        ("429", "busy"),
        ("no_key", "busy"),
        ("400", "busy"),
    ],
)
def test_the_sample_says_why(code, reason):
    gemini_client.set_client(Once(GeminiUnavailable("x", code=code)))
    r = tryon.run(SEL, PHOTO, None)
    assert r.image_base64 is None
    assert r.fallback_url == "/media/fallback/ao-dai.png"
    assert r.fallback_reason == reason


def _client_answering(resp) -> gemini_client.GeminiClient:
    class Models:
        def generate_content(self, **_):
            return resp

    client = gemini_client.GeminiClient(api_key=None)
    client._client = type("C", (), {"models": Models()})()
    return client


def _code(resp) -> str:
    with pytest.raises(GeminiUnavailable) as e:
        _client_answering(resp).generate_image("p", [])
    return e.value.code


def test_a_blocked_prompt_is_blocked():
    resp = types.GenerateContentResponse(prompt_feedback=types.GenerateContentResponsePromptFeedback(block_reason="SAFETY"))
    assert _code(resp) == "blocked"


@pytest.mark.parametrize("finish", ["SAFETY", "IMAGE_SAFETY", "PROHIBITED_CONTENT"])
def test_a_safety_stop_is_blocked(finish):
    resp = types.GenerateContentResponse(candidates=[types.Candidate(finish_reason=finish)])
    assert _code(resp) == "blocked"


def test_words_without_a_picture_are_no_image():
    part = types.Part(text="I can't find a person in this image.")
    resp = types.GenerateContentResponse(candidates=[types.Candidate(content=types.Content(parts=[part]), finish_reason="STOP")])
    assert _code(resp) == "no_image"
