import uuid
from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserRole(StrEnum):
    """What a user is allowed to do in the app."""

    STUDENT = "student"
    TEACHER = "teacher"


def role_values(roles: type[UserRole]) -> list[str]:
    """Store roles by their lowercase value instead of the Python member name."""
    values = []
    for role in roles:
        values.append(role.value)
    return values


def utc_now() -> datetime:
    """Current time in UTC, used as a column default."""
    return datetime.now(UTC)


class User(Base):
    """A student or teacher account. Stores no email or real name to keep data on minors minimal."""

    __tablename__ = "users"

    # Random UUIDs so account ids can't be guessed or counted
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(40))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", values_callable=role_values)
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
