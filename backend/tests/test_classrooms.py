from fastapi.testclient import TestClient

from app.services.classrooms import JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH, generate_join_code
from tests.helpers import MATERIAL, create_class_with_unit, sign_up_as


def test_join_codes_use_only_unambiguous_characters() -> None:
    for _attempt in range(200):
        join_code = generate_join_code()
        assert len(join_code) == JOIN_CODE_LENGTH
        for character in join_code:
            assert character in JOIN_CODE_ALPHABET


def test_teacher_creates_classroom_with_join_code(client: TestClient) -> None:
    teacher = sign_up_as(client, "ms_lopez", "teacher")

    response = client.post(
        "/classrooms", json={"name": "  Biology 3A ", "subject": "Biology"}, headers=teacher
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Biology 3A"
    assert len(response.json()["join_code"]) == JOIN_CODE_LENGTH


def test_student_cannot_create_classroom(client: TestClient) -> None:
    student = sign_up_as(client, "ana_g", "student")

    response = client.post(
        "/classrooms", json={"name": "Fake", "subject": "Biology"}, headers=student
    )

    assert response.status_code == 403


def test_student_joins_with_code_typed_loosely(client: TestClient) -> None:
    teacher = sign_up_as(client, "ms_lopez", "teacher")
    student = sign_up_as(client, "ana_g", "student")
    _classroom_id, join_code, _unit_id = create_class_with_unit(client, teacher)
    loose_code = f" {join_code[:3].lower()} {join_code[3:].lower()} "

    response = client.post("/classrooms/join", json={"join_code": loose_code}, headers=student)

    assert response.status_code == 200
    joined = client.get("/classrooms", headers=student).json()
    assert len(joined) == 1
    assert joined[0]["name"] == "Biology 3A"


def test_joining_twice_keeps_one_membership(client: TestClient) -> None:
    teacher = sign_up_as(client, "ms_lopez", "teacher")
    student = sign_up_as(client, "ana_g", "student")
    _classroom_id, join_code, _unit_id = create_class_with_unit(client, teacher)

    client.post("/classrooms/join", json={"join_code": join_code}, headers=student)
    second = client.post("/classrooms/join", json={"join_code": join_code}, headers=student)

    assert second.status_code == 200
    assert len(client.get("/classrooms", headers=student).json()) == 1


def test_wrong_join_code_is_not_found(client: TestClient) -> None:
    student = sign_up_as(client, "ana_g", "student")

    response = client.post("/classrooms/join", json={"join_code": "ZZZZZZ"}, headers=student)

    assert response.status_code == 404


def test_teacher_cannot_join_as_student(client: TestClient) -> None:
    teacher = sign_up_as(client, "ms_lopez", "teacher")
    _classroom_id, join_code, _unit_id = create_class_with_unit(client, teacher)

    response = client.post("/classrooms/join", json={"join_code": join_code}, headers=teacher)

    assert response.status_code == 403


def test_teacher_sees_only_own_classrooms(client: TestClient) -> None:
    first_teacher = sign_up_as(client, "ms_lopez", "teacher")
    second_teacher = sign_up_as(client, "mr_ruiz", "teacher")
    create_class_with_unit(client, first_teacher)

    assert client.get("/classrooms", headers=second_teacher).json() == []


def test_other_teacher_cannot_add_units(client: TestClient) -> None:
    owner = sign_up_as(client, "ms_lopez", "teacher")
    other_teacher = sign_up_as(client, "mr_ruiz", "teacher")
    classroom_id, _join_code, _unit_id = create_class_with_unit(client, owner)

    response = client.post(
        f"/classrooms/{classroom_id}/units",
        json={"title": "Sneaky", "material": MATERIAL},
        headers=other_teacher,
    )

    assert response.status_code == 404


def test_unit_material_must_be_long_enough_to_grade(client: TestClient) -> None:
    teacher = sign_up_as(client, "ms_lopez", "teacher")
    classroom_id, _join_code, _unit_id = create_class_with_unit(client, teacher)

    response = client.post(
        f"/classrooms/{classroom_id}/units",
        json={"title": "Too short", "material": "Plants are green."},
        headers=teacher,
    )

    assert response.status_code == 422


def test_enrolled_student_lists_units_without_material(client: TestClient) -> None:
    teacher = sign_up_as(client, "ms_lopez", "teacher")
    student = sign_up_as(client, "ana_g", "student")
    classroom_id, join_code, _unit_id = create_class_with_unit(client, teacher)
    client.post("/classrooms/join", json={"join_code": join_code}, headers=student)

    response = client.get(f"/classrooms/{classroom_id}/units", headers=student)

    assert response.status_code == 200
    assert response.json()[0]["title"] == "Photosynthesis"
    assert "material" not in response.json()[0]


def test_student_outside_class_cannot_list_units(client: TestClient) -> None:
    teacher = sign_up_as(client, "ms_lopez", "teacher")
    outsider = sign_up_as(client, "bea_m", "student")
    classroom_id, _join_code, _unit_id = create_class_with_unit(client, teacher)

    response = client.get(f"/classrooms/{classroom_id}/units", headers=outsider)

    assert response.status_code == 404
