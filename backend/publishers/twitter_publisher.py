"""Twitter/X v2 API publisher."""
import requests
from cryptography.fernet import Fernet

from config import settings
from models.post import Post
from models.platform_token import PlatformToken
from publishers.base_publisher import BasePublisher
from utils.errors import PublishError


class TwitterPublisher(BasePublisher):
    API_URL = "https://api.twitter.com/2/tweets"

    def publish(self, post: Post, token: PlatformToken) -> None:
        fernet = Fernet(settings.FERNET_KEY.encode())
        access_token = fernet.decrypt(token.access_token.encode()).decode()

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        # Twitter has a 280 char limit; truncate gracefully
        text = post.content[:280]
        payload = {"text": text}

        try:
            resp = requests.post(self.API_URL, json=payload, headers=headers, timeout=10)
            if resp.status_code not in (200, 201):
                raise PublishError("twitter", f"API returned {resp.status_code}: {resp.text}")
        except requests.RequestException as exc:
            raise PublishError("twitter", str(exc))
