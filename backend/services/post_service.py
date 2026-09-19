"""Post business logic — CRUD operations with ownership checks."""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.post import Post, PostStatus
from models.user import User
from schemas.post import PostCreate, PostUpdate
from utils.errors import PostNotFoundError, UnauthorizedError


def _get_owned_post(db: Session, post_id: int, user: User) -> Post:
    """Fetch a post and verify ownership."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise PostNotFoundError(post_id)
    if post.user_id != user.id:
        raise UnauthorizedError()
    return post


def list_posts(
    db: Session,
    user: User,
    from_dt: datetime | None = None,
    to_dt: datetime | None = None,
) -> list[Post]:
    """List all posts for a user, optionally filtered by date range."""
    q = db.query(Post).filter(Post.user_id == user.id)
    if from_dt:
        q = q.filter(Post.scheduled_at >= from_dt)
    if to_dt:
        q = q.filter(Post.scheduled_at <= to_dt)
    return q.order_by(Post.created_at.desc()).all()


def get_post(db: Session, post_id: int, user: User) -> Post:
    return _get_owned_post(db, post_id, user)


def create_post(db: Session, user: User, data: PostCreate) -> Post:
    """Insert a new post and trigger scheduling if needed."""
    # Determine initial status
    if data.scheduled_at and data.status == "scheduled":
        initial_status = PostStatus.scheduled
    elif data.status == "draft":
        initial_status = PostStatus.draft
    else:
        initial_status = PostStatus.draft

    post = Post(
        user_id=user.id,
        title=data.title,
        content=data.content,
        media_url=data.media_url,
        platforms=data.platforms,
        scheduled_at=data.scheduled_at,
        status=initial_status,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def update_post(db: Session, post_id: int, user: User, data: PostUpdate) -> Post:
    """Partially update a post."""
    post = _get_owned_post(db, post_id, user)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)

    post.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(post)
    return post


def delete_post(db: Session, post_id: int, user: User) -> None:
    """Delete a post (and its scheduled job via the scheduler service)."""
    post = _get_owned_post(db, post_id, user)
    db.delete(post)
    db.commit()
