"""PlatformToken ORM model — stores encrypted OAuth tokens per platform per user."""
from datetime import datetime, timezone
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class PlatformToken(Base):
    __tablename__ = "platform_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    # One of: twitter, instagram, youtube, tiktok
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    # Fernet-encrypted tokens
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationship
    owner: Mapped["User"] = relationship("User", back_populates="platform_tokens")  # noqa: F821
