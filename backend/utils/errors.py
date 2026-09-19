"""Custom application exception classes."""
from fastapi import HTTPException, status


class PostNotFoundError(HTTPException):
    def __init__(self, post_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post {post_id} not found.",
        )


class UnauthorizedError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource.",
        )


class PublishError(Exception):
    """Raised when publishing to a platform fails."""

    def __init__(self, platform: str, message: str):
        self.platform = platform
        self.message = message
        super().__init__(f"[{platform}] {message}")


class PlatformTokenMissingError(Exception):
    """Raised when a required OAuth token is not stored."""

    def __init__(self, platform: str):
        self.platform = platform
        super().__init__(f"No OAuth token found for platform: {platform}")
