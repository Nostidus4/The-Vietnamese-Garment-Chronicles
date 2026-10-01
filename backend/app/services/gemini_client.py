"""Thin wrapper around google-genai so services and tests don't depend on the SDK directly."""

import json
import logging
import time

from ..config import settings

log = logging.getLogger("gemini")


class GeminiUnavailable(Exception):
    def __init__(self, message: str, code: str = "unknown"):
        super().__init__(message)
        self.code = code

    @property
    def retryable(self) -> bool:
        """Quota (429) and server errors (5xx) often pass in a second; safety blocks and a missing key don't."""
        return self.code == "429" or (len(self.code) == 3 and self.code.startswith("5"))


def _error_code(e: Exception) -> str:
    """429 = quota, 504/timeout = too slow; anything else is logged by class name."""
    code = getattr(e, "code", None)
    if code:
        return str(code)
    return "timeout" if "timeout" in type(e).__name__.lower() or "timed out" in str(e).lower() else type(e).__name__


class GeminiClient:
    def __init__(self, api_key: str | None = settings.gemini_api_key):
        self._client = None
        if api_key:
            from google import genai

            self._client = genai.Client(api_key=api_key)

    @property
    def available(self) -> bool:
        return self._client is not None

    def generate_image(
        self, prompt: str, images: list[tuple[bytes, str]], aspect_ratio: str | None = None, timeout_s: float | None = None
    ) -> bytes:
        """images: (bytes, mime_type) pairs sent after the prompt. Returns the first image in the reply."""
        if not self._client:
            raise GeminiUnavailable("GEMINI_API_KEY not set", code="no_key")
        from google.genai import types

        parts: list = [prompt] + [types.Part.from_bytes(data=b, mime_type=m) for b, m in images]
        config = types.GenerateContentConfig(
            http_options=types.HttpOptions(timeout=int((timeout_s or settings.image_timeout_s) * 1000)),
            image_config=types.ImageConfig(aspect_ratio=aspect_ratio) if aspect_ratio else None,
        )
        start = time.perf_counter()
        try:
            resp = self._client.models.generate_content(model=settings.image_model, contents=parts, config=config)
            for part in resp.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    log.info("image ok %.1fs", time.perf_counter() - start)
                    return part.inline_data.data
        except Exception as e:  # quota, safety block, network, timeout
            code = _error_code(e)
            log.warning("image failed %.1fs code=%s: %s", time.perf_counter() - start, code, e)
            raise GeminiUnavailable(str(e), code=code) from e
        log.warning("image failed %.1fs code=no_image", time.perf_counter() - start)
        raise GeminiUnavailable("No image in response", code="no_image")

    def generate_json(self, prompt: str) -> dict:
        if not self._client:
            raise GeminiUnavailable("GEMINI_API_KEY not set", code="no_key")
        from google.genai import types

        start = time.perf_counter()
        try:
            resp = self._client.models.generate_content(
                model=settings.text_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    http_options=types.HttpOptions(timeout=int(settings.text_timeout_s * 1000)),
                ),
            )
            out = json.loads(resp.text)
        except Exception as e:
            log.warning("json failed %.1fs code=%s: %s", time.perf_counter() - start, _error_code(e), e)
            raise GeminiUnavailable(str(e), code=_error_code(e)) from e
        log.info("json ok %.1fs", time.perf_counter() - start)
        return out


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
