import base64
import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta
from uuid import UUID

import httpx
import pytest
from fastapi import HTTPException

from toybox_api.config import Settings, get_settings
from toybox_api.controllers import odds
from toybox_api.main import app
from toybox_api.repositories import odds as odds_repository
from toybox_api.repositories.odds import OddsRepository, RecentCatchOwnerRecord, RecentCatchRecord
from toybox_api.services.odds import OddsService

FixedNow = datetime(2026, 6, 11, 15, 30, 0)


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


class FakeOddsRepository:
    def __init__(self, records: list[RecentCatchRecord]) -> None:
        self.records = records
        self.calls = 0

    async def list_recent_catches(self) -> list[RecentCatchRecord]:
        self.calls += 1
        return self.records


def recent_catch_record(
    *,
    id: str,
    name: str,
    object_key: str,
    tries: int,
    created_at: datetime,
    owner_id: str,
    owner_name: str,
    owner_username: str,
) -> RecentCatchRecord:
    return RecentCatchRecord(
        id=UUID(id),
        name=name,
        object_key=object_key,
        tries=tries,
        created_at=created_at,
        owner=RecentCatchOwnerRecord(
            id=owner_id,
            name=owner_name,
            username=owner_username,
            avatar_url=f"https://cdn.example.com/avatars/{owner_id}.png",
        ),
    )


async def test_recent_catches_requires_bearer_token() -> None:
    async with api_client() as client:
        response = await client.get("/odds/recent-catches")

    assert response.status_code == 401
    assert response.json() == {"detail": "Missing bearer token."}


async def test_recent_catches_returns_all_users_last_hour_catches(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_s3_client = FakeS3Client()
    repository = FakeOddsRepository(
        [
            recent_catch_record(
                id="11111111-1111-1111-1111-111111111111",
                name="Desk robot",
                object_key="toys/robot.png",
                tries=7,
                created_at=FixedNow - timedelta(minutes=5),
                owner_id="user-1",
                owner_name="Toy Collector",
                owner_username="collector",
            ),
            recent_catch_record(
                id="22222222-2222-2222-2222-222222222222",
                name="Shelf dragon",
                object_key="toys/dragon.png",
                tries=3,
                created_at=FixedNow - timedelta(minutes=45),
                owner_id="user-2",
                owner_name="Shelf Curator",
                owner_username="curator",
            ),
        ]
    )
    service = OddsService(
        settings=Settings(
            aws_access_key_id="access-key",
            aws_secret_access_key="secret-key",
            aws_region="us-east-1",
            aws_bucket_name="toybox-bucket",
        ),
        repository=repository,
    )

    monkeypatch.setattr(
        "toybox_api.services.odds.boto3.client",
        lambda *args, **kwargs: fake_s3_client,
    )
    monkeypatch.setattr(odds, "service", service)

    async with api_client() as client:
        response = await client.get(
            "/odds/recent-catches",
            headers={"Authorization": f"Bearer {encode_test_jwt()}"},
        )

    assert response.status_code == 200
    assert repository.calls == 1
    assert response.json() == [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "name": "Desk robot",
            "media_url": "https://uploads.example.com/toys/robot.png?signature=test",
            "tries": 7,
            "created_at": "2026-06-11T15:25:00",
            "owner": {
                "id": "user-1",
                "name": "Toy Collector",
                "handle": "@collector",
                "avatar_url": "https://uploads.example.com/avatars/user-1.png?signature=test",
            },
        },
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "name": "Shelf dragon",
            "media_url": "https://uploads.example.com/toys/dragon.png?signature=test",
            "tries": 3,
            "created_at": "2026-06-11T14:45:00",
            "owner": {
                "id": "user-2",
                "name": "Shelf Curator",
                "handle": "@curator",
                "avatar_url": "https://uploads.example.com/avatars/user-2.png?signature=test",
            },
        },
    ]
    assert fake_s3_client.calls == [
        {
            "operation": "get_object",
            "params": {"Bucket": "toybox-bucket", "Key": "toys/robot.png"},
            "expires_in": 300,
        },
        {
            "operation": "get_object",
            "params": {"Bucket": "toybox-bucket", "Key": "avatars/user-1.png"},
            "expires_in": 300,
        },
        {
            "operation": "get_object",
            "params": {"Bucket": "toybox-bucket", "Key": "toys/dragon.png"},
            "expires_in": 300,
        },
        {
            "operation": "get_object",
            "params": {"Bucket": "toybox-bucket", "Key": "avatars/user-2.png"},
            "expires_in": 300,
        },
    ]


async def test_recent_catches_do_not_require_s3_when_empty() -> None:
    repository = FakeOddsRepository([])
    service = OddsService(settings=Settings(), repository=repository)

    catches = await service.list_recent_catches()

    assert catches == []
    assert repository.calls == 1


async def test_recent_catches_preserve_missing_owner_avatar(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_s3_client = FakeS3Client()
    repository = FakeOddsRepository(
        [
            RecentCatchRecord(
                id=UUID("11111111-1111-1111-1111-111111111111"),
                name="Desk robot",
                object_key="toys/robot.png",
                tries=7,
                created_at=FixedNow - timedelta(minutes=5),
                owner=RecentCatchOwnerRecord(
                    id="user-1",
                    name="Toy Collector",
                    username="collector",
                    avatar_url=None,
                ),
            )
        ]
    )
    service = OddsService(
        settings=Settings(
            aws_access_key_id="access-key",
            aws_secret_access_key="secret-key",
            aws_region="us-east-1",
            aws_bucket_name="toybox-bucket",
        ),
        repository=repository,
    )

    monkeypatch.setattr(
        "toybox_api.services.odds.boto3.client",
        lambda *args, **kwargs: fake_s3_client,
    )

    catches = await service.list_recent_catches()

    assert catches[0].owner.avatar_url is None
    assert fake_s3_client.calls == [
        {
            "operation": "get_object",
            "params": {"Bucket": "toybox-bucket", "Key": "toys/robot.png"},
            "expires_in": 300,
        }
    ]


async def test_recent_catches_fail_when_media_cannot_be_presigned() -> None:
    service = OddsService(
        settings=Settings(
            aws_access_key_id=None,
            aws_secret_access_key=None,
            aws_region=None,
            aws_bucket_name=None,
        ),
        repository=FakeOddsRepository(
            [
                recent_catch_record(
                    id="11111111-1111-1111-1111-111111111111",
                    name="Desk robot",
                    object_key="toys/robot.png",
                    tries=7,
                    created_at=FixedNow - timedelta(minutes=5),
                    owner_id="user-1",
                    owner_name="Toy Collector",
                    owner_username="collector",
                )
            ]
        ),
    )

    with pytest.raises(HTTPException) as error:
        await service.list_recent_catches()

    assert error.value.status_code == 500
    assert "Missing S3 configuration" in error.value.detail
    assert "AWS_BUCKET_NAME" in error.value.detail


async def test_recent_catches_query_joins_all_users_and_filters_by_database_last_hour(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class FakeConnection:
        def __init__(self) -> None:
            self.query = ""
            self.args = ()

        async def fetch(self, query, *args):
            self.query = query
            self.args = args
            return [
                {
                    "id": UUID("11111111-1111-1111-1111-111111111111"),
                    "name": "Desk robot",
                    "object_key": "toys/robot.png",
                    "tries": 7,
                    "created_at": FixedNow - timedelta(minutes=5),
                    "owner_id": "user-1",
                    "owner_name": "Toy Collector",
                    "owner_username": "collector",
                    "owner_avatar_url": None,
                },
                {
                    "id": UUID("22222222-2222-2222-2222-222222222222"),
                    "name": "Shelf dragon",
                    "object_key": "toys/dragon.png",
                    "tries": 3,
                    "created_at": FixedNow - timedelta(minutes=15),
                    "owner_id": "user-2",
                    "owner_name": "Shelf Curator",
                    "owner_username": "curator",
                    "owner_avatar_url": None,
                },
            ]

        async def close(self):
            pass

    connection = FakeConnection()

    async def fake_connect(database_url):
        return connection

    monkeypatch.setattr(odds_repository.asyncpg, "connect", fake_connect)

    catches = await OddsRepository().list_recent_catches()

    normalized_query = " ".join(connection.query.split())
    assert "join users on users.id = toy.user_id" in normalized_query
    assert "toy.created_at >= current_timestamp - interval '1 hour'" in normalized_query
    assert "toy.user_id = $" not in normalized_query
    assert connection.args == ()
    assert [catch.owner.id for catch in catches] == ["user-1", "user-2"]
