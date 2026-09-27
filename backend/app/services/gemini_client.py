"""Thin wrapper around google-genai so services and tests don't depend on the SDK directly."""

import json

from ..config import settings


class GeminiUnavailable(Exception):
    pass


class GeminiClient:
    def __init__(self, api_key: str | None = settings.gemini_api_key):
        self._client = None
        if api_key:
            from google import genai

            self._client = genai.Client(api_key=api_key)

    @property
    def available(self) -> bool:
        return self._client is not None

    def generate_image(self, prompt: str, images: list[tuple[bytes, str]]) -> bytes:
        """images: (bytes, mime_type) pairs sent after the prompt. Returns the first image in the reply."""
        if not self._client:
            raise GeminiUnavailable("GEMINI_API_KEY not set")
        from google.genai import types

        parts: list = [prompt] + [types.Part.from_bytes(data=b, mime_type=m) for b, m in images]
        try:
            resp = self._client.models.generate_content(model=settings.image_model, contents=parts)
            for part in resp.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    return part.inline_data.data
        except Exception as e:  # quota, safety block, network
            raise GeminiUnavailable(str(e)) from e
        raise GeminiUnavailable("No image in response")

    def generate_json(self, prompt: str) -> dict:
        if not self._client:
            raise GeminiUnavailable("GEMINI_API_KEY not set")
        try:
            resp = self._client.models.generate_content(
                model=settings.text_model,
                contents=prompt,
                config={"response_mime_type": "application/json"},
            )
            return json.loads(resp.text)
        except Exception as e:
            raise GeminiUnavailable(str(e)) from e


_client: GeminiClient | None = None


def get_client() -> GeminiClient:
    global _client
    if _client is None:
        _client = GeminiClient()
    return _client


def set_client(client: GeminiClient) -> None:
    """For tests and scripts."""
    global _client
    _client = client
