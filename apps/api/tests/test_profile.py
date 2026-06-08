from pathlib import Path
from urllib.parse import urlparse

import httpx

from toybox_api.main import app
from toybox_api.repositories import profile as profile_repository
from toybox_api.repositories.profile import ProfileRepository

StaticDirectory = Path(__file__).parents[1] / "src" / "toybox_api" / "static"


def api_client() -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://testserver")


async def test_profile_returns_mock_profile() -> None:
    async with api_client() as client:
        response = await client.get("/profile")

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == "1"
    assert payload["name"] == "Gabriel"
    assert payload["handle"] == "@gabriel"
    assert payload["bio"] == "Toy collector, daily discoveries, and tiny worlds from Toybox."


async def test_profile_returns_current_mock_metadata() -> None:
    async with api_client() as client:
        response = await client.get("/profile")

    payload = response.json()
    assert payload["stats"] == {"posts": 9, "followers": 1248, "following": 312}
    assert payload["badges"] == [
        {"description": "Pega um bixo por dia", "text": "FIRE"},
        {"description": "Perfil em destaque", "text": "STAR"},
        {"description": "Colecao crescendo", "text": "RARE"},
    ]
    assert [toy["id"] for toy in payload["toys"]] == [
        "toy-1",
        "toy-2",
        "toy-3",
        "toy-4",
        "toy-5",
        "toy-6",
        "toy-7",
        "toy-8",
        "toy-9",
    ]
    assert payload["toys"][0]["caption"] == "Newest catch"


async def test_profile_returns_absolute_static_image_urls() -> None:
    async with api_client() as client:
        response = await client.get("/profile")

    payload = response.json()
    assert payload["avatar_url"] == "http://testserver/static/mocks/avatar.png"
    assert payload["toys"][0]["media_url"] == "http://testserver/static/mocks/toy-1.png"
    assert payload["toys"][8]["media_url"] == "http://testserver/static/mocks/toy-9.png"


async def test_profile_static_image_url_points_to_asset() -> None:
    async with api_client() as client:
        response = await client.get("/profile")
        media_url = response.json()["toys"][1]["media_url"]

    asset_path = StaticDirectory / urlparse(media_url).path.removeprefix("/static/")
    assert asset_path.is_file()
    assert asset_path.suffix == ".png"


async def test_profile_uploaded_toy_name_is_returned_as_caption(monkeypatch) -> None:
    class FakeConnection:
        async def fetch(self, query):
            return [
                {
                    "id": "11111111-1111-1111-1111-111111111111",
                    "name": "Desk robot",
                    "image_url": "https://cdn.example.com/toys/robot.jpg",
                }
            ]

        async def close(self):
            pass

    async def fake_connect(database_url):
        return FakeConnection()

    monkeypatch.setattr(profile_repository.asyncpg, "connect", fake_connect)

    toys = await ProfileRepository().list_uploaded_toys()

    assert toys[0].caption == "Desk robot"
    assert toys[0].media_path == "https://cdn.example.com/toys/robot.jpg"
    assert toys[0].is_absolute_url is True
