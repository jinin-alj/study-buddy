from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

# Hosted poolers drop idle connections after a few minutes, so renew ours before that
CONNECTION_RECYCLE_SECONDS = 300


class Base(DeclarativeBase):
    """Parent class for every database table."""


def build_engine(database_url: str, pool_size: int = 5) -> Engine:
    """Create a connection pool; pre_ping drops dead connections after database restarts."""
    if database_url.startswith("sqlite"):
        return create_engine(database_url, pool_pre_ping=True)
    return create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=pool_size,
        max_overflow=pool_size,
        pool_recycle=CONNECTION_RECYCLE_SECONDS,
    )


settings = get_settings()
engine = build_engine(settings.database_url, settings.database_pool_size)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """Give each request its own database session and always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
