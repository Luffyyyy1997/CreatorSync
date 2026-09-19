"""Tests for /posts routes."""
import pytest
from datetime import datetime, timedelta, timezone


def future_dt(minutes: int = 60) -> str:
    return (datetime.now(timezone.utc) + timedelta(minutes=minutes)).isoformat()


POST_PAYLOAD = {
    "title": "Test Post",
    "content": "Hello social media!",
    "platforms": ["twitter"],
    "status": "draft",
}


def test_create_post(client, auth_headers):
    resp = client.post("/posts", json=POST_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test Post"
    assert data["status"] == "draft"


def test_list_posts(client, auth_headers):
    client.post("/posts", json=POST_PAYLOAD, headers=auth_headers)
    client.post("/posts", json={**POST_PAYLOAD, "title": "Second Post"}, headers=auth_headers)
    resp = client.get("/posts", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_post(client, auth_headers):
    post_id = client.post("/posts", json=POST_PAYLOAD, headers=auth_headers).json()["id"]
    resp = client.get(f"/posts/{post_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == post_id


def test_update_post(client, auth_headers):
    post_id = client.post("/posts", json=POST_PAYLOAD, headers=auth_headers).json()["id"]
    resp = client.put(f"/posts/{post_id}", json={"title": "Updated"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated"


def test_delete_post(client, auth_headers):
    post_id = client.post("/posts", json=POST_PAYLOAD, headers=auth_headers).json()["id"]
    resp = client.delete(f"/posts/{post_id}", headers=auth_headers)
    assert resp.status_code == 204
    resp = client.get(f"/posts/{post_id}", headers=auth_headers)
    assert resp.status_code == 404


def test_create_post_empty_content(client, auth_headers):
    resp = client.post("/posts", json={**POST_PAYLOAD, "content": ""}, headers=auth_headers)
    assert resp.status_code == 422


def test_create_post_no_platforms(client, auth_headers):
    resp = client.post("/posts", json={**POST_PAYLOAD, "platforms": []}, headers=auth_headers)
    assert resp.status_code == 422


def test_create_post_invalid_platform(client, auth_headers):
    resp = client.post(
        "/posts",
        json={**POST_PAYLOAD, "platforms": ["snapchat"]},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_create_scheduled_post(client, auth_headers):
    resp = client.post(
        "/posts",
        json={**POST_PAYLOAD, "status": "scheduled", "scheduled_at": future_dt()},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == "scheduled"


def test_post_ownership_enforced(client, registered_user, auth_headers):
    """User B cannot access user A's post."""
    post_id = client.post("/posts", json=POST_PAYLOAD, headers=auth_headers).json()["id"]

    # Register user B
    resp = client.post(
        "/auth/register",
        json={"email": "b@example.com", "password": "password123", "display_name": "B"},
    )
    token_b = resp.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    resp = client.get(f"/posts/{post_id}", headers=headers_b)
    assert resp.status_code == 403


def test_unauthenticated_post_access(client):
    resp = client.get("/posts")
    assert resp.status_code in (401, 403)
