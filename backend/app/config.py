import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY") or None
    image_model: str = os.getenv("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")  # Nano Banana
    text_model: str = os.getenv("GEMINI_TEXT_MODEL", "gemini-3.8-flash")
    cors_origins: tuple[str, ...] = tuple(os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","))
    admin_token: str | None = os.getenv("ADMIN_TOKEN") or None
    tryon_per_minute: int = int(os.getenv("TRYON_PER_MINUTE", "6"))
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "8"))


settings = Settings()
