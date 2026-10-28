from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

# Argon2id with the library's recommended parameters (RFC 9106 low-memory profile)
password_hasher = PasswordHasher()

# Checked when the username doesn't exist so failed logins take the same time either way
DUMMY_PASSWORD_HASH = password_hasher.hash("not-a-real-password")


def hash_password(plain_password: str) -> str:
    """Return an Argon2id hash that is safe to store."""
    return password_hasher.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check a password against a stored hash without raising."""
    try:
        return password_hasher.verify(password_hash, plain_password)
    except (VerificationError, InvalidHashError):
        return False
