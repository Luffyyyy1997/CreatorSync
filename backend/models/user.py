"""User ORM model."""
from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    posts: Mapped[list["Post"]] = relationship(  # noqa: F821
        "Post", back_populates="owner", cascade="all, delete-orphan"
    )
    platform_tokens: Mapped[list["PlatformToken"]] = relationship(  # noqa: F821
        "PlatformToken", back_populates="owner", cascade="all, delete-orphan"
    )
