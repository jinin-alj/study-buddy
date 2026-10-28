from app.security.passwords import hash_password, verify_password


def test_correct_password_verifies() -> None:
    password_hash = hash_password("correct-horse-battery")

    assert verify_password("correct-horse-battery", password_hash) is True


def test_wrong_password_fails() -> None:
    password_hash = hash_password("correct-horse-battery")

    assert verify_password("wrong-password", password_hash) is False


def test_same_password_hashes_differently_each_time() -> None:
    assert hash_password("same-password") != hash_password("same-password")


def test_malformed_hash_fails_instead_of_crashing() -> None:
    assert verify_password("anything", "not-a-hash") is False
