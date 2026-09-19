"""Abstract base class for all platform publishers."""
from abc import ABC, abstractmethod
from models.post import Post
from models.platform_token import PlatformToken


class BasePublisher(ABC):
    """
    Every platform publisher implements this interface.
    `publish` should raise `utils.errors.PublishError` on failure.
    """

    @abstractmethod
    def publish(self, post: Post, token: PlatformToken) -> None:
        """Publish the post to the platform using the provided OAuth token."""
        ...
