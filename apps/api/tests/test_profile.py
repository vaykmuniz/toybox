import base64
import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta

import httpx

from toybox_api.main import app
from toybox_api.repositories import profile as profile_repository
from toybox_api.repositories.profile import ProfileRepository

JwtSecretKey = "toybox-local-development-secret"


def api_client() -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://testserver")


def encode_test_jwt(
    *,
    subject: str = "user-1",
    expires_at: datetime | None = None,
) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": subject,
        "exp": int((expires_at or datetime.now(UTC) + timedelta(hours=1)).timestamp()),
    }
    header_text = base64url_json(header)
    payload_text = base64url_json(payload)
    signing_input = f"{header_text}.{payload_text}"
    signature = hmac.new(
        JwtSecretKey.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    return f"{signing_input}.{base64url(signature)}"


def base64url_json(value: dict[str, object]) -> str:
    return base64url(json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8"))


def base64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


async def test_profile_requires_bearer_token() -> None:
    async with api_client() as client:
        response = await client.get("/profile")

    assert response.status_code == 401
    assert response.json() == {"detail": "Missing bearer token."}


async def test_profile_rejects_invalid_bearer_token() -> None:
    async with api_client() as client:
        response = await client.get(
            "/profile",
            headers={"Authorization": "Bearer invalid.token.value"},
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid bearer token."}


async def test_profile_returns_user_profile_from_database(monkeypatch) -> None:
    class FakeConnection:
        async def fetchrow(self, query, user_id):
            assert "from users" in query
            assert user_id == "user-1"

            return {
                "id": "user-1",
                "username": "collector",
                "name": "Toy Collector",
                "avatar_path": "mocks/avatar.png",
            }

        async def fetch(self, query):
            assert "from toy" in query

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

    async with api_client() as client:
        response = await client.get(
            "/profile",
            headers={"Authorization": f"Bearer {encode_test_jwt()}"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload == {
        "id": "user-1",
        "name": "Toy Collector",
        "handle": "@collector",
        "avatar_url": "http://testserver/static/mocks/avatar.png",
        "toys": [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "media_url": "https://cdn.example.com/toys/robot.jpg",
                "caption": "Desk robot",
            }
        ],
    }
    assert "bio" not in payload
    assert "stats" not in payload
    assert "badges" not in payload


async def test_profile_returns_not_found_when_user_is_missing(monkeypatch) -> None:
    class FakeConnection:
        async def fetchrow(self, query, user_id):
            return None

        async def close(self):
            pass

    async def fake_connect(database_url):
        return FakeConnection()

    monkeypatch.setattr(profile_repository.asyncpg, "connect", fake_connect)

    async with api_client() as client:
        response = await client.get(
            "/profile",
            headers={"Authorization": f"Bearer {encode_test_jwt(subject='missing-user')}"},
        )

    assert response.status_code == 404
    assert response.json() == {"detail": "Profile not found."}


async def test_feed_route_no_longer_exists() -> None:
    async with api_client() as client:
        response = await client.get("/feed")

    assert response.status_code == 404


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
