from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Hosted databases (Neon, Supabase, Render) hand out URLs in these forms
PLAIN_POSTGRES_PREFIXES = ("postgres://", "postgresql://")
PSYCOPG_PREFIX = "postgresql+psycopg://"


def normalise_database_url(database_url: str) -> str:
    """Point plain Postgres URLs at the psycopg 3 driver this app uses."""
    for prefix in PLAIN_POSTGRES_PREFIXES:
        if database_url.startswith(prefix):
            return PSYCOPG_PREFIX + database_url[len(prefix) :]
    return database_url


class Settings(BaseSettings):
    """Runtime configuration read from environment variables or the repo-level .env file."""

    # The backend runs from backend/, so also look one folder up for the shared .env
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    database_url: str
    # Free hosted databases allow few connections, so keep the pool small
    database_pool_size: int = Field(default=5, gt=0)
    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = Field(default=30, gt=0)
    refresh_token_days: int = Field(default=30, gt=0)
    cors_origins: str = "http://localhost:8081"

    ollama_base_url: str = "http://localhost:11434"
    # Sent as a bearer token so only this backend can use the laptop's AI gateway
    ollama_api_key: str | None = None
    ollama_model: str = "llama3.1:8b"
    ollama_timeout_seconds: float = Field(default=120.0, gt=0)
    # Ollama's default context window is too small for material plus a full conversation
    ollama_context_tokens: int = Field(default=8192, gt=0)

    # Short, capped sessions keep the app from becoming more screen time
    session_minutes: int = Field(default=15, gt=0)
    max_student_turns: int = Field(default=8, gt=0)

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, value: str) -> str:
        """Accept the URL exactly as the database host shows it."""
        return normalise_database_url(value)

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
