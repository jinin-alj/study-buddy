import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import UserRole

USERNAME_PATTERN = r"^[a-z0-9_.]+$"


class RegisterRequest(BaseModel):
    """Sign-up form. Usernames and nicknames only, so students never have to give a real name."""

    username: str = Field(min_length=3, max_length=30, pattern=USERNAME_PATTERN)
    display_name: str = Field(min_length=1, max_length=40)
    # Upper limit stops very long passwords being used to slow the hasher down
    password: str = Field(min_length=8, max_length=128)
    role: UserRole

    @field_validator("username", mode="before")
    @classmethod
    def normalise_username(cls, value: object) -> object:
        """Trim and lowercase so 'Ana' and 'ana' are the same account."""
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @field_validator("display_name", mode="before")
    @classmethod
    def trim_display_name(cls, value: object) -> object:
        """Drop surrounding spaces so a blank nickname is rejected."""
        if isinstance(value, str):
            return value.strip()
        return value


class LoginRequest(BaseModel):
    """Username and password sent to log in."""

    username: str = Field(min_length=1, max_length=30)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("username", mode="before")
    @classmethod
    def normalise_username(cls, value: object) -> object:
        """Match the lowercase form saved at sign-up."""
        if isinstance(value, str):
            return value.strip().lower()
        return value


class RefreshRequest(BaseModel):
    """A refresh token traded for a new pair of tokens."""

    refresh_token: str = Field(min_length=1)


class UserPublic(BaseModel):
    """The account fields that are safe to send to the app."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    display_name: str
    role: UserRole


class AuthResponse(BaseModel):
    """Tokens plus the signed-in user, so the app needs no second request."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"  # noqa: S105 (OAuth token scheme name, not a secret)
    user: UserPublic
