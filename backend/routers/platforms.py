"""
Platforms router — OAuth 2.0 connect/callback/disconnect for all four platforms.
Uses Authlib for OAuth flows. Tokens are Fernet-encrypted before storage.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
from datetime import datetime, timezone
from authlib.integrations.requests_client import OAuth2Session

from config import settings
from database import get_db
from models.user import User
from models.platform_token import PlatformToken
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/platforms", tags=["platforms"])

KNOWN_PLATFORMS = ["twitter", "instagram", "youtube", "tiktok"]

# OAuth configuration per platform
PLATFORM_CONFIG = {
    "twitter": {
        "client_id": lambda: settings.TWITTER_CLIENT_ID,
        "client_secret": lambda: settings.TWITTER_CLIENT_SECRET,
        "authorize_url": "https://twitter.com/i/oauth2/authorize",
        "token_url": "https://api.twitter.com/2/oauth2/token",
        "scope": "tweet.read tweet.write users.read offline.access",
    },
    "instagram": {
        "client_id": lambda: settings.INSTAGRAM_CLIENT_ID,
        "client_secret": lambda: settings.INSTAGRAM_CLIENT_SECRET,
        "authorize_url": "https://api.instagram.com/oauth/authorize",
        "token_url": "https://api.instagram.com/oauth/access_token",
        "scope": "instagram_basic instagram_content_publish",
    },
    "youtube": {
        "client_id": lambda: settings.YOUTUBE_CLIENT_ID,
        "client_secret": lambda: settings.YOUTUBE_CLIENT_SECRET,
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scope": "https://www.googleapis.com/auth/youtube",
    },
    "tiktok": {
        "client_id": lambda: settings.TIKTOK_CLIENT_ID,
        "client_secret": lambda: settings.TIKTOK_CLIENT_SECRET,
        "authorize_url": "https://www.tiktok.com/v2/auth/authorize/",
        "token_url": "https://open.tiktokapis.com/v2/oauth/token/",
        "scope": "user.info.basic video.publish",
    },
}


def _fernet() -> Fernet:
    return Fernet(settings.FERNET_KEY.encode())


def _encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


@router.get("/status")
def platform_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return which platforms are connected for the current user."""
    tokens = (
        db.query(PlatformToken)
        .filter(PlatformToken.user_id == current_user.id)
        .all()
    )
    connected = {t.platform for t in tokens}
    return {p: p in connected for p in KNOWN_PLATFORMS}


@router.get("/{platform}/connect")
def connect_platform(
    platform: str,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Redirect the user to the platform's OAuth consent screen."""
    if platform not in PLATFORM_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")

    cfg = PLATFORM_CONFIG[platform]
    if not cfg["client_id"]():
        raise HTTPException(
            status_code=503,
            detail=f"{platform} OAuth credentials are not configured.",
        )

    callback_url = str(request.base_url) + f"platforms/{platform}/callback"
    oauth = OAuth2Session(
        client_id=cfg["client_id"](),
        redirect_uri=callback_url,
        scope=cfg["scope"],
    )
    # Encode user_id in state so we can look them up in the callback
    state = f"uid_{current_user.id}"
    uri, _ = oauth.create_authorization_url(cfg["authorize_url"], state=state)
    return RedirectResponse(url=uri)


@router.get("/{platform}/callback")
def platform_callback(
    platform: str,
    code: str,
    state: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Handle OAuth callback, exchange code for token, and store encrypted token."""
    if platform not in PLATFORM_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")

    # Extract user_id from state
    if not state.startswith("uid_"):
        raise HTTPException(status_code=400, detail="Invalid OAuth state.")
    try:
        user_id = int(state.split("_")[1])
    except (IndexError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid OAuth state.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    cfg = PLATFORM_CONFIG[platform]
    callback_url = str(request.base_url) + f"platforms/{platform}/callback"

    oauth = OAuth2Session(
        client_id=cfg["client_id"](),
        client_secret=cfg["client_secret"](),
        redirect_uri=callback_url,
    )
    try:
        token_data = oauth.fetch_token(
            cfg["token_url"],
            authorization_response=str(request.url),
            code=code,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Token exchange failed: {str(exc)}"
        )

    access_token = token_data.get("access_token", "")
    refresh_token = token_data.get("refresh_token", "")
    expires_at = None
    if token_data.get("expires_at"):
        expires_at = datetime.fromtimestamp(token_data["expires_at"], tz=timezone.utc)

    # Upsert the token record
    existing = (
        db.query(PlatformToken)
        .filter(
            PlatformToken.user_id == user_id,
            PlatformToken.platform == platform,
        )
        .first()
    )

    if existing:
        existing.access_token = _encrypt(access_token)
        existing.refresh_token = _encrypt(refresh_token) if refresh_token else None
        existing.expires_at = expires_at
    else:
        pt = PlatformToken(
            user_id=user_id,
            platform=platform,
            access_token=_encrypt(access_token),
            refresh_token=_encrypt(refresh_token) if refresh_token else None,
            expires_at=expires_at,
        )
        db.add(pt)

    db.commit()

    # Redirect back to the frontend connections page
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/connect-platforms?connected={platform}")


@router.delete("/{platform}/disconnect", status_code=204)
def disconnect_platform(
    platform: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke and delete the stored OAuth token for a platform."""
    if platform not in KNOWN_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")

    token = (
        db.query(PlatformToken)
        .filter(
            PlatformToken.user_id == current_user.id,
            PlatformToken.platform == platform,
        )
        .first()
    )
    if not token:
        raise HTTPException(status_code=404, detail=f"{platform} is not connected.")

    db.delete(token)
    db.commit()
