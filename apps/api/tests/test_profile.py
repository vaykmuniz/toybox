import base64
import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta

import httpx
import pytest
from fastapi import HTTPException

from toybox_api.config import Settings, get_settings
from toybox_api.main import app
from toybox_api.repositories import profile as profile_repository
from toybox_api.repositories.profile import ProfileRecord, ProfileRepository
from toybox_api.services.authentication import AuthenticatedUser
from toybox_api.services.profile import ProfileService

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
        get_settings().jwt_secret_key.encode("utf-8"),
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
                "avatar_path": None,
            }

        async def fetch(self, query, user_id):
            assert "from toy" in query
            assert "where user_id = $1" in query
            assert user_id == "user-1"

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
        "avatar_url": None,
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
        async def fetch(self, query, user_id):
            assert "where user_id = $1" in query
            assert user_id == "user-1"
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

    toys = await ProfileRepository().list_uploaded_toys("user-1")

    assert toys[0].caption == "Desk robot"
    assert toys[0].media_path == "https://cdn.example.com/toys/robot.jpg"
    assert toys[0].is_absolute_url is True


async def test_profile_returns_uploaded_avatar_url_from_database(monkeypatch) -> None:
    class FakeConnection:
        async def fetchrow(self, query, user_id):
            assert "from users" in query
            assert user_id == "user-1"

            return {
                "id": "user-1",
                "username": "collector",
                "name": "Toy Collector",
                "avatar_path": "https://cdn.example.com/avatars/user-1/avatar.jpg",
            }

        async def fetch(self, query, user_id):
            return []

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
    assert response.json()["avatar_url"] == "https://cdn.example.com/avatars/user-1/avatar.jpg"


class FakeS3Client:
    def __init__(self) -> None:
        self.calls = []

    def generate_presigned_url(self, operation: str, Params: dict, ExpiresIn: int):
        self.calls.append(
            {
                "operation": operation,
                "params": Params,
                "expires_in": ExpiresIn,
            }
        )
        return f"https://uploads.example.com/{Params['Key']}?signature=test"


async def test_avatar_upload_url_uses_user_scoped_object_key(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_s3_client = FakeS3Client()

    monkeypatch.setattr(
        "toybox_api.services.profile.boto3.client",
        lambda *args, **kwargs: fake_s3_client,
    )

    service = ProfileService(
        settings=Settings(
            aws_access_key_id="access-key",
            aws_secret_access_key="secret-key",
            aws_region="us-east-1",
            aws_bucket_name="toybox-bucket",
            s3_public_base_url="https://cdn.example.com",
        )
    )

    upload_target = await service.create_avatar_upload_url(
        user=AuthenticatedUser(id="user-1"),
        file_name="profile photo.png",
        content_type="image/png",
    )

    assert upload_target.object_key.startswith("avatars/user-1/")
    assert upload_target.object_key.endswith("-profile-photo.png")
    assert upload_target.object_url == f"https://cdn.example.com/{upload_target.object_key}"
    assert fake_s3_client.calls[0]["params"]["Key"] == upload_target.object_key
    assert fake_s3_client.calls[0]["params"]["ContentType"] == "image/png"


async def test_avatar_upload_url_rejects_unsupported_content_type() -> None:
    service = ProfileService(
        settings=Settings(
            aws_access_key_id="access-key",
            aws_secret_access_key="secret-key",
            aws_region="us-east-1",
            aws_bucket_name="toybox-bucket",
        )
    )

    with pytest.raises(HTTPException) as error:
        await service.create_avatar_upload_url(
            user=AuthenticatedUser(id="user-1"),
            file_name="avatar.gif",
            content_type="image/gif",
        )

    assert error.value.status_code == 400
    assert error.value.detail == "Avatar uploads must be JPEG, PNG, or WebP."


async def test_update_avatar_rejects_object_key_for_another_user() -> None:
    service = ProfileService(settings=Settings())

    with pytest.raises(HTTPException) as error:
        await service.update_avatar(
            request=None,
            user=AuthenticatedUser(id="user-1"),
            object_key="avatars/user-2/avatar.png",
        )

    assert error.value.status_code == 400
    assert error.value.detail == "Avatar object key does not belong to the authenticated user."


async def test_update_avatar_persists_public_url() -> None:
    class FakeRequest:
        def url_for(self, name, path):
            return f"http://testserver/static/{path}"

    class FakeRepository:
        def __init__(self) -> None:
            self.calls = []

        async def update_avatar_path(self, user_id: str, avatar_path: str):
            self.calls.append({"user_id": user_id, "avatar_path": avatar_path})
            return ProfileRecord(
                id=user_id,
                name="Toy Collector",
                handle="@collector",
                avatar_path=avatar_path,
                toys=[],
            )

    repository = FakeRepository()
    service = ProfileService(
        settings=Settings(
            aws_region="us-east-1",
            aws_bucket_name="toybox-bucket",
            s3_public_base_url="https://cdn.example.com",
        ),
        repository=repository,
    )

    profile = await service.update_avatar(
        request=FakeRequest(),
        user=AuthenticatedUser(id="user-1"),
        object_key="avatars/user-1/avatar.png",
    )

    assert repository.calls == [
        {
            "user_id": "user-1",
            "avatar_path": "https://cdn.example.com/avatars/user-1/avatar.png",
        }
    ]
    assert profile.avatar_url == "https://cdn.example.com/avatars/user-1/avatar.png"
