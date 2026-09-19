"""Instagram Graph API publisher (Business/Creator accounts only)."""
import requests
from cryptography.fernet import Fernet

from config import settings
from models.post import Post
from models.platform_token import PlatformToken
from publishers.base_publisher import BasePublisher
from utils.errors import PublishError


class InstagramPublisher(BasePublisher):
    """
    Instagram publishing requires:
    1. A media container creation call
    2. A publish call with the container ID
    Media URL (image) is required.
    """

    def publish(self, post: Post, token: PlatformToken) -> None:
        fernet = Fernet(settings.FERNET_KEY.encode())
        access_token = fernet.decrypt(token.access_token.encode()).decode()

        # Retrieve the Instagram Business Account ID (stored as refresh_token field)
        ig_account_id = token.refresh_token  # We store account ID here for Instagram

        if not post.media_url:
            raise PublishError("instagram", "Instagram posts require a media URL.")

        if not ig_account_id:
            raise PublishError("instagram", "Instagram account ID not found.")

        # Step 1 — Create media container
        try:
            container_resp = requests.post(
                f"https://graph.facebook.com/v19.0/{ig_account_id}/media",
                params={
                    "image_url": post.media_url,
                    "caption": post.content,
                    "access_token": access_token,
                },
                timeout=10,
            )
            if container_resp.status_code != 200:
                raise PublishError(
                    "instagram",
                    f"Container creation failed: {container_resp.text}",
                )
            container_id = container_resp.json().get("id")

            # Step 2 — Publish the container
            pub_resp = requests.post(
                f"https://graph.facebook.com/v19.0/{ig_account_id}/media_publish",
                params={"creation_id": container_id, "access_token": access_token},
                timeout=10,
            )
            if pub_resp.status_code != 200:
                raise PublishError(
                    "instagram",
                    f"Publish failed: {pub_resp.text}",
                )
        except requests.RequestException as exc:
            raise PublishError("instagram", str(exc))
