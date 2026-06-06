from pathlib import Path
from urllib.parse import urlparse

import httpx

from toybox_api.main import app

StaticDirectory = Path(__file__).parents[1] / "src" / "toybox_api" / "static"


def api_client() -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://testserver")


async def test_feed_returns_mock_items() -> None:
    async with api_client() as client:
        response = await client.get("/feed")

    assert response.status_code == 200
    payload = response.json()
    assert [item["id"] for item in payload["items"]] == ["feed-1", "feed-2", "feed-3"]


async def test_feed_returns_current_mock_metadata() -> None:
    async with api_client() as client:
        response = await client.get("/feed")

    item = response.json()["items"][0]
    assert item["author"]["name"] == "Gabriel"
    assert item["author"]["handle"] == "@gabriel"
    assert item["caption"] == "Newest pull found a spot on the shelf."
    assert item["location"] == "Sao Paulo, BR"
    assert item["posted_at"] == "2026-06-06T12:00:00.000Z"
    assert "stats" not in item


async def test_feed_returns_absolute_static_image_urls() -> None:
    async with api_client() as client:
        response = await client.get("/feed")

    item = response.json()["items"][0]
    assert item["media_url"] == "http://testserver/static/mocks/toy-1.png"
    assert item["author"]["avatar_url"] == "http://testserver/static/mocks/avatar.png"


async def test_feed_static_image_url_points_to_asset() -> None:
    async with api_client() as client:
        response = await client.get("/feed")
        media_url = response.json()["items"][0]["media_url"]

    asset_path = StaticDirectory / urlparse(media_url).path.removeprefix("/static/")
    assert asset_path.is_file()
    assert asset_path.suffix == ".png"
