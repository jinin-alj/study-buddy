from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.models import User
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
