"""
FastAPI application entry point.
Sets up CORS, registers all routers, handles global exceptions,
and manages the APScheduler lifecycle.
"""
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db, SessionLocal
from routers import auth, posts, platforms, ai as ai_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB tables + start scheduler. Shutdown: stop scheduler."""
    init_db()
    db = SessionLocal()
    try:
        from services.scheduler_service import start_scheduler
        start_scheduler(db)
    finally:
        db.close()
    yield
    from services.scheduler_service import stop_scheduler
    stop_scheduler()


app = FastAPI(
    title="CreatorSync API",
    description="Schedule and publish social media content across platforms.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
allowed_origins = [settings.FRONTEND_URL]
if settings.ENV == "development":
    # Allow Vite dev server on any port during development
    allowed_origins.append("http://localhost:5173")
    allowed_origins.append("http://127.0.0.1:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(platforms.router)
app.include_router(ai_router.router)


# ── Global exception handlers ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all: log the full error but return a safe 500 message to the client."""
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again."},
    )


@app.get("/health", tags=["health"])
def health_check():
    """Simple health-check endpoint for load balancers."""
    return {"status": "ok"}
