from fastapi.testclient import TestClient

from app.main import create_app


def test_health_returns_ok() -> None:
    """The health route answers 200 with status ok."""
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
