"""YouTube Data API v3 publisher."""
import requests
from cryptography.fernet import Fernet

from config import settings
from models.post import Post
from models.platform_token import PlatformToken
from publishers.base_publisher import BasePublisher
from utils.errors import PublishError


class YouTubePublisher(BasePublisher):
    """
    Posts a YouTube Community post (text update).
    Full video uploads require multipart upload and are out of scope.
    """

    def publish(self, post: Post, token: PlatformToken) -> None:
        fernet = Fernet(settings.FERNET_KEY.encode())
        access_token = fernet.decrypt(token.access_token.encode()).decode()

        # YouTube Community posts (channel updates)
        url = "https://www.googleapis.com/youtube/v3/communityPosts"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "snippet": {
                "type": "textPost",
                "textOriginalContent": post.content,
            }
        }

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            if resp.status_code not in (200, 201):
                raise PublishError("youtube", f"API returned {resp.status_code}: {resp.text}")
        except requests.RequestException as exc:
            raise PublishError("youtube", str(exc))
