from datetime import UTC, datetime
from enum import StrEnum


def utc_now() -> datetime:
    """Current time in UTC, used as a column default."""
    return datetime.now(UTC)


def enum_values(members: type[StrEnum]) -> list[str]:
    """Store enums by their lowercase value instead of the Python member name."""
    values = []
    for member in members:
        values.append(member.value)
    return values
