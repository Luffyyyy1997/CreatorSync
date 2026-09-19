"""Pydantic schemas for Post."""
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, field_validator, model_validator

ALLOWED_PLATFORMS = {"twitter", "instagram", "youtube", "tiktok"}


class PostCreate(BaseModel):
    title: str
    content: str
    media_url: Optional[str] = None
    platforms: list[str]
    scheduled_at: Optional[datetime] = None
    status: str = "draft"

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Content must not be empty.")
        if len(v) > 2200:
            raise ValueError("Content must not exceed 2200 characters.")
        return v

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title must not be empty.")
        return v.strip()

    @field_validator("platforms")
    @classmethod
    def platforms_valid(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one platform must be selected.")
        unknown = set(v) - ALLOWED_PLATFORMS
        if unknown:
            raise ValueError(f"Unknown platforms: {unknown}")
        return v

    @model_validator(mode="after")
    def scheduled_at_in_future(self) -> "PostCreate":
        if self.scheduled_at and self.status == "scheduled":
            now = datetime.now(timezone.utc)
            # Make scheduled_at timezone-aware if it isn't
            sa = self.scheduled_at
            if sa.tzinfo is None:
                sa = sa.replace(tzinfo=timezone.utc)
            if sa <= now:
                raise ValueError("scheduled_at must be a future datetime.")
        return self


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    media_url: Optional[str] = None
    platforms: Optional[list[str]] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None

    @field_validator("content")
    @classmethod
    def content_length(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.strip():
                raise ValueError("Content must not be empty.")
            if len(v) > 2200:
                raise ValueError("Content must not exceed 2200 characters.")
        return v

    @field_validator("platforms")
    @classmethod
    def platforms_valid(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is not None:
            if not v:
                raise ValueError("At least one platform must be selected.")
            unknown = set(v) - ALLOWED_PLATFORMS
            if unknown:
                raise ValueError(f"Unknown platforms: {unknown}")
        return v


class PostOut(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    media_url: Optional[str]
    platforms: list[str]
    scheduled_at: Optional[datetime]
    status: str
    publish_error: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
