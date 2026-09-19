"""Posts router — full CRUD + publish-now endpoint."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.post import PostStatus
from schemas.post import PostCreate, PostUpdate, PostOut
from services import post_service
from services import publish_service
from services import scheduler_service
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("", response_model=list[PostOut])
def list_posts(
    from_dt: Optional[datetime] = None,
    to_dt: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all posts for the current user, with optional date-range filter."""
    return post_service.list_posts(db, current_user, from_dt, to_dt)


@router.post("", response_model=PostOut, status_code=201)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new post. If status='scheduled' and scheduled_at is set, a job is registered."""
    post = post_service.create_post(db, current_user, data)

    # Register scheduler job if this post is scheduled for the future
    if post.status == PostStatus.scheduled and post.scheduled_at:
        scheduler_service.schedule_job(post.id, post.scheduled_at)

    return PostOut.model_validate(post)


@router.get("/{post_id}", response_model=PostOut)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PostOut.model_validate(post_service.get_post(db, post_id, current_user))


@router.put("/{post_id}", response_model=PostOut)
def update_post(
    post_id: int,
    data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a post. Re-registers the scheduler job if scheduled_at changed."""
    post = post_service.update_post(db, post_id, current_user, data)

    # Cancel old job and re-register if still scheduled
    scheduler_service.cancel_job(post_id)
    if post.status == PostStatus.scheduled and post.scheduled_at:
        scheduler_service.schedule_job(post.id, post.scheduled_at)

    return PostOut.model_validate(post)


@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a post and cancel any pending scheduled job."""
    scheduler_service.cancel_job(post_id)
    post_service.delete_post(db, post_id, current_user)


@router.post("/{post_id}/publish-now", response_model=PostOut)
def publish_now(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Immediately publish a post to all its target platforms."""
    # Verify ownership
    post = post_service.get_post(db, post_id, current_user)
    # Cancel any scheduled future job first
    scheduler_service.cancel_job(post_id)
    publish_service.publish_post(post_id, db)
    db.refresh(post)
    return PostOut.model_validate(post)
