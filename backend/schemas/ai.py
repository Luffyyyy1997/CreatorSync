"""Pydantic schemas for AI assistant requests and responses."""
from pydantic import BaseModel, field_validator

ALLOWED_PLATFORMS = {"twitter", "instagram", "youtube", "tiktok", "general"}


class AiIdeasRequest(BaseModel):
    topic: str
    platform: str = "general"

    @field_validator("topic")
    @classmethod
    def topic_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Topic must not be empty.")
        if len(v) > 300:
            raise ValueError("Topic is too long (max 300 chars).")
        return v.strip()


class AiCaptionRequest(BaseModel):
    topic: str
    platform: str = "general"

    @field_validator("topic")
    @classmethod
    def topic_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Topic must not be empty.")
        return v.strip()


class AiHashtagsRequest(BaseModel):
    topic: str
    platform: str = "general"

    @field_validator("topic")
    @classmethod
    def topic_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Topic must not be empty.")
        return v.strip()


class AiIdeasResponse(BaseModel):
    ideas: list[str]


class AiCaptionResponse(BaseModel):
    caption: str


class AiHashtagsResponse(BaseModel):
    hashtags: list[str]
