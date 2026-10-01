import pytest

from app.content import store
from app.services import gemini_client


class FakeGemini(gemini_client.GeminiClient):
    """No network: returns a tiny fixed PNG and a canned grounded answer."""

    def __init__(self):
        self.image_calls: list[str] = []

    @property
    def available(self) -> bool:
        return True

    def generate_image(self, prompt, images, aspect_ratio=None):
        self.image_calls.append(prompt)
        return b"\x89PNG fake"

    def generate_json(self, prompt):
        return {"answer": "Năm 1744 áo ngũ thân thành thường phục chung.", "sources": ["ref-03", "ref-made-up"]}


@pytest.fixture(autouse=True)
def content():
    store.reload()
    # Tests never call the real Gemini, even if .env has a key
    gemini_client.set_client(gemini_client.GeminiClient(api_key=None))
    yield store.get()


@pytest.fixture
def fake_gemini():
    fake = FakeGemini()
    gemini_client.set_client(fake)
    yield fake
    gemini_client.set_client(gemini_client.GeminiClient(api_key=None))
