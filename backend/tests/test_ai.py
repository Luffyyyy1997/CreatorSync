"""Tests for /ai routes — mocks OpenAI so no real API calls are made."""
import pytest
from unittest.mock import patch, MagicMock
import services.ai_service as ai_service_module


def make_mock_response(content: str):
    mock = MagicMock()
    mock.choices[0].message.content = content
    return mock


def test_generate_ideas(client, auth_headers):
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = make_mock_response(
        '["Idea 1", "Idea 2", "Idea 3", "Idea 4", "Idea 5"]'
    )
    with patch.object(ai_service_module, "_get_client", return_value=mock_client):
        resp = client.post(
            "/ai/ideas",
            json={"topic": "fitness tips", "platform": "instagram"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "ideas" in data
    assert len(data["ideas"]) == 5


def test_generate_caption(client, auth_headers):
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = make_mock_response(
        "Here is your amazing caption! Follow for more."
    )
    with patch.object(ai_service_module, "_get_client", return_value=mock_client):
        resp = client.post(
            "/ai/caption",
            json={"topic": "morning routine", "platform": "twitter"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    assert "caption" in resp.json()


def test_generate_hashtags(client, auth_headers):
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = make_mock_response(
        '["fitness", "wellness", "health", "motivation", "workout"]'
    )
    with patch.object(ai_service_module, "_get_client", return_value=mock_client):
        resp = client.post(
            "/ai/hashtags",
            json={"topic": "fitness", "platform": "instagram"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    assert "hashtags" in resp.json()


def test_ai_empty_topic(client, auth_headers):
    resp = client.post(
        "/ai/ideas",
        json={"topic": "", "platform": "twitter"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_ai_unauthenticated(client):
    resp = client.post("/ai/ideas", json={"topic": "test"})
    assert resp.status_code in (401, 403)
