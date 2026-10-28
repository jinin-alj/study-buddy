from functools import lru_cache
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.ai.chat_model import ChatModel
from app.ai.ollama_model import OllamaChatModel
from app.config import Settings, get_settings
from app.database import get_db
from app.models import User, UserRole
from app.security.tokens import ACCESS_TOKEN_TYPE, InvalidTokenError, read_user_id

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]
AppSettings = Annotated[Settings, Depends(get_settings)]


def unauthorized(detail: str) -> HTTPException:
    """Build the 401 error the app treats as 'please log in again'."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    db: DbSession,
    settings: AppSettings,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    """Resolve the signed-in user from the Authorization header."""
    if credentials is None:
        raise unauthorized("Not signed in")

    try:
        user_id = read_user_id(credentials.credentials, ACCESS_TOKEN_TYPE, settings)
    except InvalidTokenError as error:
        raise unauthorized("Session expired or invalid") from error

    user = db.get(User, user_id)
    if user is None:
        raise unauthorized("Account no longer exists")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_teacher(current_user: CurrentUser) -> User:
    """Allow only teacher accounts."""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teachers only")
    return current_user


def require_student(current_user: CurrentUser) -> User:
    """Allow only student accounts."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students only")
    return current_user


TeacherUser = Annotated[User, Depends(require_teacher)]
StudentUser = Annotated[User, Depends(require_student)]


@lru_cache
def get_chat_model() -> ChatModel:
    """One shared model client per process; tests swap in a fake."""
    settings = get_settings()
    return OllamaChatModel(
        base_url=settings.ollama_base_url,
        model_name=settings.ollama_model,
        timeout_seconds=settings.ollama_timeout_seconds,
        context_tokens=settings.ollama_context_tokens,
    )


AppChatModel = Annotated[ChatModel, Depends(get_chat_model)]
