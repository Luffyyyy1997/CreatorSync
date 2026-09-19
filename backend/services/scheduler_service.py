"""
Scheduler service — APScheduler integration.
Loads existing scheduled posts on startup and manages job registration.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(
    jobstores={"default": MemoryJobStore()},
    job_defaults={"coalesce": True, "max_instances": 1},
    timezone="UTC",
)


def _run_publish_job(post_id: int) -> None:
    """Called by APScheduler. Creates its own DB session."""
    # Import here to avoid circular imports at module level
    from database import SessionLocal
    from services.publish_service import publish_post

    db: Session = SessionLocal()
    try:
        publish_post(post_id, db)
    finally:
        db.close()


def schedule_job(post_id: int, run_at: datetime) -> None:
    """Register an APScheduler job to publish post_id at run_at (UTC)."""
    # Ensure timezone-aware
    if run_at.tzinfo is None:
        run_at = run_at.replace(tzinfo=timezone.utc)

    job_id = f"post_{post_id}"
    # Remove old job if it exists (e.g. rescheduling)
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)

    scheduler.add_job(
        _run_publish_job,
        trigger="date",
        run_date=run_at,
        id=job_id,
        args=[post_id],
    )
    logger.info("Scheduled job %s at %s", job_id, run_at)


def cancel_job(post_id: int) -> None:
    """Cancel a scheduled job for the given post."""
    job_id = f"post_{post_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        logger.info("Cancelled job %s", job_id)


def load_existing_jobs(db: Session) -> None:
    """On startup, re-register all future scheduled posts."""
    from models.post import Post, PostStatus

    now = datetime.now(timezone.utc)
    scheduled_posts = (
        db.query(Post)
        .filter(Post.status == PostStatus.scheduled, Post.scheduled_at > now)
        .all()
    )
    for post in scheduled_posts:
        schedule_job(post.id, post.scheduled_at)
    logger.info("Loaded %d existing scheduled jobs", len(scheduled_posts))


def start_scheduler(db: Session) -> None:
    """Start the scheduler and load existing jobs."""
    scheduler.start()
    load_existing_jobs(db)
    logger.info("APScheduler started")


def stop_scheduler() -> None:
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")
