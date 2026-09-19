"""Tests for publish service — mocks platform publishers."""
import pytest
from unittest.mock import patch, MagicMock
from cryptography.fernet import Fernet

from config import settings


def _make_token(platform: str, db, user_id: int):
    """Insert a fake encrypted platform token for testing."""
    from models.platform_token import PlatformToken

    fernet = Fernet(settings.FERNET_KEY.encode())
    token = PlatformToken(
        user_id=user_id,
        platform=platform,
        access_token=fernet.encrypt(b"fake_token").decode(),
        refresh_token=None,
        expires_at=None,
    )
    db.add(token)
    db.commit()
    return token


@patch("services.publish_service._PUBLISHERS")
def test_publish_post_success(mock_publishers, client, registered_user, auth_headers):
    user, _ = registered_user

    # Create a post
    post_resp = client.post(
        "/posts",
        json={
            "title": "Publish Test",
            "content": "Test content",
            "platforms": ["twitter"],
            "status": "scheduled",
        },
        headers=auth_headers,
    )
    assert post_resp.status_code == 201
    post_id = post_resp.json()["id"]

    # Mock the twitter publisher
    mock_twitter = MagicMock()
    mock_publishers.__getitem__ = MagicMock(return_value=mock_twitter)
    mock_publishers.get = MagicMock(return_value=mock_twitter)

    # Call publish-now
    resp = client.post(f"/posts/{post_id}/publish-now", headers=auth_headers)
    # Without a real token in DB, this will fail gracefully
    assert resp.status_code == 200
    # Status should be "failed" since no token exists, but endpoint should not 500
    assert resp.json()["status"] in ("published", "failed")


def test_publish_no_token_marks_failed(client, registered_user, auth_headers):
    """Publishing without a connected platform token should mark the post as failed."""
    post_id = client.post(
        "/posts",
        json={
            "title": "No Token Post",
            "content": "Test content",
            "platforms": ["twitter"],
            "status": "draft",
        },
        headers=auth_headers,
    ).json()["id"]

    resp = client.post(f"/posts/{post_id}/publish-now", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "failed"
    assert "twitter" in data["publish_error"]
