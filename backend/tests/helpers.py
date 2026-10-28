from fastapi.testclient import TestClient

TEST_PASSWORD = "correct-horse-battery"

MATERIAL = (
    "Photosynthesis happens in the chloroplasts of plant cells. Plants take in carbon dioxide "
    "and water, and use energy from sunlight to make glucose. Oxygen is released as a by-product."
)


def auth_header(token: str) -> dict[str, str]:
    """Authorization header for a bearer token."""
    return {"Authorization": f"Bearer {token}"}


def sign_up_as(client: TestClient, username: str, role: str) -> dict[str, str]:
    """Register an account and return its auth header."""
    response = client.post(
        "/auth/register",
        json={
            "username": username,
            "display_name": username,
            "password": TEST_PASSWORD,
            "role": role,
        },
    )
    assert response.status_code == 201
    return auth_header(response.json()["access_token"])


def create_class_with_unit(client: TestClient, teacher: dict[str, str]) -> tuple[str, str, str]:
    """Create a class and one unit; return the class id, join code and unit id."""
    classroom = client.post(
        "/classrooms", json={"name": "Biology 3A", "subject": "Biology"}, headers=teacher
    ).json()
    unit = client.post(
        f"/classrooms/{classroom['id']}/units",
        json={"title": "Photosynthesis", "material": MATERIAL},
        headers=teacher,
    ).json()
    return classroom["id"], classroom["join_code"], unit["id"]


def enrolled_student_with_unit(client: TestClient) -> tuple[dict[str, str], str]:
    """A teacher's class with a unit, joined by a student; return the student header and unit id."""
    teacher = sign_up_as(client, "ms_lopez", "teacher")
    student = sign_up_as(client, "ana_g", "student")
    _classroom_id, join_code, unit_id = create_class_with_unit(client, teacher)
    client.post("/classrooms/join", json={"join_code": join_code}, headers=student)
    return student, unit_id
