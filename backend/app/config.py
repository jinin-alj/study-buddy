from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration read from environment variables or the repo-level .env file."""

    # The backend runs from backend/, so also look one folder up for the shared .env
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    database_url: str
    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = Field(default=30, gt=0)
    refresh_token_days: int = Field(default=30, gt=0)
    cors_origins: str = "http://localhost:8081"

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_timeout_seconds: float = Field(default=120.0, gt=0)
    # Ollama's default context window is too small for material plus a full conversation
    ollama_context_tokens: int = Field(default=8192, gt=0)

    # Short, capped sessions keep the app from becoming more screen time
    session_minutes: int = Field(default=15, gt=0)
    max_student_turns: int = Field(default=8, gt=0)

    def cors_origin_list(self) -> list[str]:
        """Split the comma-separated CORS_ORIGINS value into a list."""
        origins = []
        for origin in self.cors_origins.split(","):
            if origin.strip() != "":
                origins.append(origin.strip())
        return origins


@lru_cache
def get_settings() -> Settings:
    """Load settings once per process."""
    return Settings()
