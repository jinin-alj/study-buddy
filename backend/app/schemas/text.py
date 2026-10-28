from typing import Annotated

from pydantic import BeforeValidator


def strip_whitespace(value: object) -> object:
    """Trim surrounding spaces so blank input fails the minimum-length check."""
    if isinstance(value, str):
        return value.strip()
    return value


TrimmedText = Annotated[str, BeforeValidator(strip_whitespace)]
