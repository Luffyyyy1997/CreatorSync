"""
AI service — wraps the OpenAI API for content idea, caption, and hashtag generation.
All prompts are defined here; nothing AI-related lives in the routers.
"""
from openai import OpenAI, OpenAIError
from fastapi import HTTPException, status
from config import settings

# Rate limiting: simple in-memory store {user_id: [timestamps]}
from collections import defaultdict
from datetime import datetime, timezone
import json

_rate_store: dict[int, list[datetime]] = defaultdict(list)
RATE_LIMIT = 15  # max requests per minute per user


def _check_rate_limit(user_id: int) -> None:
    """Raise 429 if the user has exceeded RATE_LIMIT requests in the last 60 seconds."""
    now = datetime.now(timezone.utc)
    recent = [t for t in _rate_store[user_id] if (now - t).total_seconds() < 60]
    _rate_store[user_id] = recent
    if len(recent) >= RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"AI rate limit exceeded. Max {RATE_LIMIT} requests per minute.",
        )
    _rate_store[user_id].append(now)


def _get_client() -> OpenAI:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured. Please add your OpenAI API key.",
        )
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def generate_ideas(topic: str, platform: str, user_id: int) -> list[str]:
    """Return 5 content idea strings for a topic and platform."""
    _check_rate_limit(user_id)
    client = _get_client()
    system_msg = (
        "You are a creative social media strategist. "
        "Return ONLY a valid JSON array of exactly 5 content idea strings. "
        "No explanation, no markdown, just the JSON array."
    )
    user_msg = f"Generate 5 content ideas for {platform} about: {topic}"

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=500,
            temperature=0.8,
        )
        raw = response.choices[0].message.content.strip()
        ideas = json.loads(raw)
        return ideas if isinstance(ideas, list) else [str(i) for i in ideas]
    except (OpenAIError, json.JSONDecodeError, Exception) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(exc)}",
        )


def generate_caption(topic: str, platform: str, user_id: int) -> str:
    """Return a ready-to-use caption string."""
    _check_rate_limit(user_id)
    client = _get_client()
    system_msg = (
        "You are an expert social media copywriter. "
        "Return ONLY the caption text — no labels, no markdown, no explanation."
    )
    user_msg = (
        f"Write an engaging {platform} caption about: {topic}. "
        "Include a call-to-action. Keep it within platform character limits."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=300,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except OpenAIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(exc)}",
        )


def generate_hashtags(topic: str, platform: str, user_id: int) -> list[str]:
    """Return a list of 10-15 relevant hashtag strings (without the # symbol)."""
    _check_rate_limit(user_id)
    client = _get_client()
    system_msg = (
        "You are a social media SEO expert. "
        "Return ONLY a valid JSON array of 10-15 hashtag strings (without the # symbol). "
        "No explanation, no markdown, just the JSON array."
    )
    user_msg = f"Generate relevant hashtags for {platform} about: {topic}"

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=300,
            temperature=0.6,
        )
        raw = response.choices[0].message.content.strip()
        tags = json.loads(raw)
        return tags if isinstance(tags, list) else []
    except (OpenAIError, json.JSONDecodeError, Exception) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(exc)}",
        )
