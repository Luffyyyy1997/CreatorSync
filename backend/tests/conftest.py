"""
Shared pytest fixtures for all backend tests.
Uses an in-memory SQLite database so tests are isolated from the real DB.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import database  # imported so we can monkeypatch its internals
from database import Base, get_db
from main import app

TEST_DATABASE_URL = "sqlite:///./test_creator_sync.db"

test_engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db(monkeypatch):
    """
    Redirect the database module's engine and SessionLocal to the test DB,
    create all tables before each test, and drop them after.
    """
    import models.user  # noqa: F401
    import models.post  # noqa: F401
    import models.platform_token  # noqa: F401

    # Point the database module at the test engine so init_db() and
    # start_scheduler() both operate on the test DB
    monkeypatch.setattr(database, "engine", test_engine)
    monkeypatch.setattr(database, "SessionLocal", TestingSessionLocal)

    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client(setup_db):
    """Test client with test DB dependency override."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def registered_user(client):
    """Register a test user and return (client, user_data, token)."""
    resp = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "display_name": "Test User",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    return data["user"], data["access_token"]


@pytest.fixture
def auth_headers(registered_user):
    _, token = registered_user
    return {"Authorization": f"Bearer {token}"}
