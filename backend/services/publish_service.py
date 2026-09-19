"""
Publish service — orchestrates publishing a post to all its target platforms.
Each publisher failure is isolated: one failed platform doesn't stop others.
"""
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from models.post import Post, PostStatus
from models.platform_token import PlatformToken
from publishers.twitter_publisher import TwitterPublisher
from publishers.instagram_publisher import InstagramPublisher
from publishers.youtube_publisher import YouTubePublisher
from publishers.tiktok_publisher import TikTokPublisher
from utils.errors import PublishError, PlatformTokenMissingError

import logging

logger = logging.getLogger(__name__)

# Registry mapping platform name → publisher instance
_PUBLISHERS = {
    "twitter": TwitterPublisher(),
    "instagram": InstagramPublisher(),
    "youtube": YouTubePublisher(),
    "tiktok": TikTokPublisher(),
}


def publish_post(post_id: int, db: Session) -> None:
    """
    Publish a post to all its target platforms.
    Updates post.status to 'published' or 'failed' when done.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        logger.warning("publish_post: post %s not found", post_id)
        return

    errors: list[str] = []

    for platform in post.platforms:
        publisher = _PUBLISHERS.get(platform)
        if not publisher:
            errors.append(f"{platform}: unsupported platform")
            continue

        token = (
            db.query(PlatformToken)
            .filter(
                PlatformToken.user_id == post.user_id,
                PlatformToken.platform == platform,
            )
            .first()
        )

        if not token:
            err_msg = f"{platform}: no OAuth token connected"
            errors.append(err_msg)
            logger.warning("publish_post: %s for user %s", err_msg, post.user_id)
            continue

        try:
            publisher.publish(post, token)
            logger.info("publish_post: published post %s to %s", post_id, platform)
        except PublishError as exc:
            errors.append(str(exc))
            logger.error("publish_post: %s", exc)

    # Update post status
    if errors:
        post.status = PostStatus.failed
        post.publish_error = "; ".join(errors)
    else:
        post.status = PostStatus.published
        post.publish_error = None

    post.updated_at = datetime.now(timezone.utc)
    db.commit()
