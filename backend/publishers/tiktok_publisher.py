"""
TikTok Content Posting API publisher.
NOTE: TikTok's API requires developer application approval.
This publisher will log a warning and raise PublishError if credentials are missing.
"""
import requests
from cryptography.fernet import Fernet

from config import settings
from models.post import Post
from models.platform_token import PlatformToken
from publishers.base_publisher import BasePublisher
from utils.errors import PublishError


class TikTokPublisher(BasePublisher):
    """
    Posts a TikTok video or photo (requires a hosted video/image URL).
    Falls back to a warning if TikTok credentials are not configured.
    """

    def publish(self, post: Post, token: PlatformToken) -> None:
        if not settings.TIKTOK_CLIENT_ID:
            raise PublishError(
                "tiktok",
                "TikTok API credentials are not configured. "
                "Please add TIKTOK_CLIENT_ID and TIKTOK_CLIENT_SECRET to your environment.",
            )

        fernet = Fernet(settings.FERNET_KEY.encode())
        access_token = fernet.decrypt(token.access_token.encode()).decode()

        if not post.media_url:
            raise PublishError("tiktok", "TikTok posts require a media URL.")

        # TikTok Direct Post API
        url = "https://open.tiktokapis.com/v2/post/publish/video/init/"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
        }
        payload = {
            "post_info": {
                "title": post.content[:150],
                "privacy_level": "PUBLIC_TO_EVERYONE",
                "disable_duet": False,
                "disable_comment": False,
                "disable_stitch": False,
            },
            "source_info": {
                "source": "PULL_FROM_URL",
                "video_url": post.media_url,
            },
        }

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=15)
            if resp.status_code not in (200, 201):
                raise PublishError("tiktok", f"API returned {resp.status_code}: {resp.text}")
        except requests.RequestException as exc:
            raise PublishError("tiktok", str(exc))
