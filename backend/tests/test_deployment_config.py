import httpx
import pytest

from app.ai.chat_model import ChatModelError
from app.ai.ollama_model import OllamaChatModel
from app.config import Settings, normalise_database_url


@pytest.mark.parametrize(
    "given, expected",
    [
        (
            "postgresql://user:secret@ep-cool-1.eu-central-1.aws.neon.tech/neondb?sslmode=require",
            "postgresql+psycopg://user:secret@ep-cool-1.eu-central-1.aws.neon.tech/neondb?sslmode=require",
        ),
        ("postgres://user:secret@host:5432/db", "postgresql+psycopg://user:secret@host:5432/db"),
        ("postgresql+psycopg://user:secret@host/db", "postgresql+psycopg://user:secret@host/db"),
        ("sqlite+pysqlite:///:memory:", "sqlite+pysqlite:///:memory:"),
    ],
)
def test_database_urls_from_hosts_use_psycopg(given: str, expected: str) -> None:
    assert normalise_database_url(given) == expected


def test_settings_normalise_the_database_url() -> None:
    settings = Settings(
        database_url="postgres://user:secret@host/db",
        jwt_secret="x" * 32,
    )

    assert settings.database_url == "postgresql+psycopg://user:secret@host/db"


def test_ollama_client_sends_the_gateway_key_when_set() -> None:
    model = OllamaChatModel(
        base_url="https://gateway.example",
        model_name="llama3.1:8b",
        timeout_seconds=5,
        context_tokens=8192,
        api_key="gateway-secret",
    )

    assert model.http_client.headers["Authorization"] == "Bearer gateway-secret"


def test_ollama_client_sends_no_key_for_local_ollama() -> None:
    model = OllamaChatModel(
        base_url="http://localhost:11434",
        model_name="llama3.1:8b",
        timeout_seconds=5,
        context_tokens=8192,
    )

    assert "Authorization" not in model.http_client.headers


def test_ollama_client_reports_a_rejected_key_as_a_model_error() -> None:
    def reject(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"error": "unauthorised"})

    model = OllamaChatModel(
        base_url="https://gateway.example",
        model_name="llama3.1:8b",
        timeout_seconds=5,
        context_tokens=8192,
        api_key="wrong",
    )
    model.http_client = httpx.Client(
        base_url="https://gateway.example", transport=httpx.MockTransport(reject)
    )

    with pytest.raises(ChatModelError):
        model.complete([{"role": "user", "content": "Hi"}], temperature=0.0)
