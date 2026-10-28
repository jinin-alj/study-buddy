import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.ai.checker import ApplicationResult, CheckerFeedback
from app.models import SessionStatus, Speaker
from app.schemas.text import TrimmedText

# Roughly two minutes of speech, plenty for one turn
TURN_MAX_CHARACTERS = 2000


class StartSessionRequest(BaseModel):
    """Which unit the student wants to explain."""

    unit_id: uuid.UUID


class StudentTurnRequest(BaseModel):
    """What the student just said, already turned into text on the device."""

    text: TrimmedText = Field(min_length=1, max_length=TURN_MAX_CHARACTERS)


class TurnPublic(BaseModel):
    """One line of the conversation."""

    model_config = ConfigDict(from_attributes=True)

    position: int
    speaker: Speaker
    text: str


class SessionDetail(BaseModel):
    """Everything the app needs to show a session, during or after it."""

    id: uuid.UUID
    unit_id: uuid.UUID
    unit_title: str
    status: SessionStatus
    started_at: datetime
    ends_at: datetime
    completed_at: datetime | None
    student_turns_left: int
    turns: list[TurnPublic]
    coverage_percent: int | None
    feedback: CheckerFeedback | None
    application_answer: str | None
    application_result: ApplicationResult | None
