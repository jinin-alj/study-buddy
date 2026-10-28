import uuid
from datetime import UTC, datetime, timedelta

import jwt

from app.config import Settings

# Labels for the "type" claim, not secrets
ACCESS_TOKEN_TYPE = "access"  # noqa: S105
REFRESH_TOKEN_TYPE = "refresh"  # noqa: S105


class InvalidTokenError(Exception):
    """Raised when a token is expired, tampered with or of the wrong type."""


def create_token(
    user_id: uuid.UUID, token_type: str, lifetime: timedelta, settings: Settings
) -> str:
    """Sign a JWT for one user with an expiry and a type claim."""
    issued_at = datetime.now(UTC)
    claims = {
        "sub": str(user_id),
        "type": token_type,
        "iat": issued_at,
        "exp": issued_at + lifetime,
    }
    return jwt.encode(claims, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: uuid.UUID, settings: Settings) -> str:
    """Short-lived token sent with every API request."""
    lifetime = timedelta(minutes=settings.access_token_minutes)
    return create_token(user_id, ACCESS_TOKEN_TYPE, lifetime, settings)


def create_refresh_token(user_id: uuid.UUID, settings: Settings) -> str:
    """Long-lived token used only to get a new access token."""
    lifetime = timedelta(days=settings.refresh_token_days)
    return create_token(user_id, REFRESH_TOKEN_TYPE, lifetime, settings)


def read_user_id(token: str, expected_type: str, settings: Settings) -> uuid.UUID:
    """Verify a token and return the user id inside it."""
    try:
        # Pinning the algorithm list blocks the "alg: none" downgrade attack
        claims = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["sub", "type", "exp"]},
        )
    except jwt.PyJWTError as error:
        raise InvalidTokenError("Token could not be verified") from error

    if claims["type"] != expected_type:
        raise InvalidTokenError(f"Expected a {expected_type} token")

    try:
        return uuid.UUID(claims["sub"])
    except ValueError as error:
        raise InvalidTokenError("Token subject is not a user id") from error
