import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.common import enum_values, utc_now


class UserRole(StrEnum):
    """What a user is allowed to do in the app."""

    STUDENT = "student"
    TEACHER = "teacher"


class User(Base):
    """A student or teacher account. Stores no email or real name to keep data on minors minimal."""

    __tablename__ = "users"

    # Random UUIDs so account ids can't be guessed or counted
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(40))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", values_callable=enum_values)
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
