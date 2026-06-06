from fastapi.testclient import TestClient

from toybox_api.main import app


def test_feed_returns_mock_items() -> None:
    client = TestClient(app)

    response = client.get("/feed")

    assert response.status_code == 200
    payload = response.json()
    assert [item["id"] for item in payload["items"]] == ["feed-1", "feed-2", "feed-3"]


def test_feed_returns_current_mock_metadata() -> None:
    client = TestClient(app)

    response = client.get("/feed")

    item = response.json()["items"][0]
    assert item["author"]["name"] == "Gabriel"
    assert item["author"]["handle"] == "@gabriel"
    assert item["caption"] == "Newest pull found a spot on the shelf."
    assert item["location"] == "Sao Paulo, BR"
    assert item["posted_at"] == "2026-06-06T12:00:00.000Z"
    assert "stats" not in item


def test_feed_returns_absolute_static_image_urls() -> None:
    client = TestClient(app)

    response = client.get("/feed")

    item = response.json()["items"][0]
    assert item["media_url"] == "http://testserver/static/mocks/toy-1.png"
    assert item["author"]["avatar_url"] == "http://testserver/static/mocks/avatar.png"


def test_feed_static_image_url_serves_asset() -> None:
    client = TestClient(app)

    response = client.get("/feed")
    media_url = response.json()["items"][0]["media_url"]
    static_response = client.get(media_url)

    assert static_response.status_code == 200
    assert static_response.headers["content-type"] == "image/png"
