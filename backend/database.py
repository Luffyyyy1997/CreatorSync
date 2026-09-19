"""
SQLAlchemy engine, session factory, and base model class.
All ORM models inherit from `Base`.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from typing import Generator
from config import settings


engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite
    echo=settings.ENV == "development",
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables on startup if they don't already exist."""
    # Import models so SQLAlchemy registers them before create_all
    import models.user  # noqa: F401
    import models.post  # noqa: F401
    import models.platform_token  # noqa: F401

    Base.metadata.create_all(bind=engine)
