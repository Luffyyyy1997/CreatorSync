"""AI router — /ai/ideas, /ai/caption, /ai/hashtags"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.ai import (
    AiIdeasRequest, AiIdeasResponse,
    AiCaptionRequest, AiCaptionResponse,
    AiHashtagsRequest, AiHashtagsResponse,
)
from services import ai_service
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/ideas", response_model=AiIdeasResponse)
def get_ideas(
    data: AiIdeasRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate 5 content ideas for a given topic and platform."""
    ideas = ai_service.generate_ideas(data.topic, data.platform, current_user.id)
    return AiIdeasResponse(ideas=ideas)


@router.post("/caption", response_model=AiCaptionResponse)
def get_caption(
    data: AiCaptionRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate a caption for a given topic and platform."""
    caption = ai_service.generate_caption(data.topic, data.platform, current_user.id)
    return AiCaptionResponse(caption=caption)


@router.post("/hashtags", response_model=AiHashtagsResponse)
def get_hashtags(
    data: AiHashtagsRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate hashtags for a given topic and platform."""
    hashtags = ai_service.generate_hashtags(data.topic, data.platform, current_user.id)
    return AiHashtagsResponse(hashtags=hashtags)
