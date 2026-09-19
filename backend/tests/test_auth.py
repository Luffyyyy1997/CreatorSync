"""Tests for /auth routes."""
import pytest


def test_register_success(client):
    resp = client.post(
        "/auth/register",
        json={"email": "new@example.com", "password": "password123", "display_name": "New User"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new@example.com"


def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "password123", "display_name": "User"}
    client.post("/auth/register", json=payload)
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 409


def test_register_short_password(client):
    resp = client.post(
        "/auth/register",
        json={"email": "a@b.com", "password": "short", "display_name": "User"},
    )
    assert resp.status_code == 422


def test_register_invalid_email(client):
    resp = client.post(
        "/auth/register",
        json={"email": "not-an-email", "password": "password123", "display_name": "User"},
    )
    assert resp.status_code == 422


def test_login_success(client, registered_user):
    resp = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client, registered_user):
    resp = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


def test_login_unknown_email(client):
    resp = client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "password123"},
    )
    assert resp.status_code == 401


def test_me_authenticated(client, registered_user, auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


def test_me_unauthenticated(client):
    resp = client.get("/auth/me")
    assert resp.status_code in (401, 403)  # HTTPBearer returns 401 or 403 depending on version
