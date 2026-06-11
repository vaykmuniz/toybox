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
from toybox_api.controllers import toys
from toybox_api.main import app
from toybox_api.repositories.toys import ToyRecord
from toybox_api.services.toys import ToyService

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


class FakeToyRepository:
    async def create_toy(
        self,
        user_id: str,
        name: str,
        image_url: str,
        object_key: str,
        tries: int,
    ) -> ToyRecord:
        return ToyRecord(
            id=UUID("11111111-1111-1111-1111-111111111111"),
            user_id=user_id,
            name=name,
            image_url=image_url,
            object_key=object_key,
            tries=tries,
            created_at=datetime(2026, 6, 7, 12, 0, tzinfo=UTC),
        )


class FakeToyService:
    async def create_upload_url(self, file_name: str, content_type: str):
        return {
            "upload_url": f"https://uploads.example.com/{file_name}?signature=test",
            "object_url": f"https://cdn.example.com/toys/{file_name}",
            "object_key": f"toys/{file_name}",
        }

    async def create_toy(
        self,
        user_id: str,
        name: str,
        image_url: str,
        object_key: str,
        tries: int,
    ):
        assert user_id == "user-1"
        return {
            "id": "11111111-1111-1111-1111-111111111111",
            "name": name,
            "media_url": image_url,
            "object_key": object_key,
            "tries": tries,
            "created_at": "2026-06-07T12:00:00+00:00",
        }


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


async def test_toy_upload_url_returns_presigned_metadata(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(toys, "service", FakeToyService())

    async with api_client() as client:
        response = await client.post(
            "/toys/upload-url",
            json={"file_name": "robot.png", "content_type": "image/png"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["upload_url"] == "https://uploads.example.com/robot.png?signature=test"
    assert payload["object_url"] == "https://cdn.example.com/toys/robot.png"
    assert payload["object_key"] == "toys/robot.png"


async def test_create_toy_returns_saved_toy(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(toys, "service", FakeToyService())

    async with api_client() as client:
        response = await client.post(
            "/toys",
            headers={"Authorization": f"Bearer {encode_test_jwt()}"},
            json={
                "name": "Desk robot",
                "image_url": "https://cdn.example.com/toys/robot.png",
                "object_key": "toys/robot.png",
                "tries": 7,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload == {
        "id": "11111111-1111-1111-1111-111111111111",
        "name": "Desk robot",
        "media_url": "https://cdn.example.com/toys/robot.png",
        "object_key": "toys/robot.png",
        "tries": 7,
        "created_at": "2026-06-07T12:00:00+00:00",
    }


async def test_create_toy_requires_bearer_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(toys, "service", FakeToyService())

    async with api_client() as client:
        response = await client.post(
            "/toys",
            json={
                "name": "Desk robot",
                "image_url": "https://cdn.example.com/toys/robot.png",
                "object_key": "toys/robot.png",
                "tries": 7,
            },
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Missing bearer token."}


async def test_create_toy_service_persists_record() -> None:
    service = ToyService(
        settings=Settings(),
        repository=FakeToyRepository(),
    )

    toy = await service.create_toy(
        user_id="user-1",
        name="  Desk robot  ",
        image_url="https://cdn.example.com/toys/robot.png",
        object_key="toys/robot.png",
        tries=7,
    )

    assert toy.id == "11111111-1111-1111-1111-111111111111"
    assert toy.name == "Desk robot"
    assert toy.media_url == "https://cdn.example.com/toys/robot.png"
    assert toy.object_key == "toys/robot.png"
    assert toy.tries == 7


async def test_upload_url_uses_boto3_put_object_presign(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_s3_client = FakeS3Client()
    boto3_client_calls = []

    def fake_boto3_client(*args, **kwargs):
        boto3_client_calls.append({"args": args, "kwargs": kwargs})
        return fake_s3_client

    monkeypatch.setattr("toybox_api.services.toys.boto3.client", fake_boto3_client)

    service = ToyService(
        settings=Settings(
            aws_access_key_id="access-key",
            aws_secret_access_key="secret-key",
            aws_region="us-east-1",
            aws_bucket_name="toybox-bucket",
            s3_public_base_url="https://cdn.example.com",
        ),
        repository=FakeToyRepository(),
    )

    upload_target = await service.create_upload_url(
        file_name="robot toy.png",
        content_type="image/png",
    )

    assert upload_target.upload_url.startswith("https://uploads.example.com/toys/")
    assert upload_target.object_url == f"https://cdn.example.com/{upload_target.object_key}"
    assert fake_s3_client.calls == [
        {
            "operation": "put_object",
            "params": {
                "Bucket": "toybox-bucket",
                "Key": upload_target.object_key,
                "ContentType": "image/png",
            },
            "expires_in": 300,
        }
    ]
    assert boto3_client_calls == [
        {
            "args": ("s3",),
            "kwargs": {
                "aws_access_key_id": "access-key",
                "aws_secret_access_key": "secret-key",
                "region_name": "us-east-1",
                "endpoint_url": None,
            },
        }
    ]


async def test_upload_url_normalizes_jpg_content_type(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_s3_client = FakeS3Client()

    monkeypatch.setattr(
        "toybox_api.services.toys.boto3.client",
        lambda *args, **kwargs: fake_s3_client,
    )

    service = ToyService(
        settings=Settings(
            aws_access_key_id="access-key",
            aws_secret_access_key="secret-key",
            aws_region="us-east-1",
            aws_bucket_name="toybox-bucket",
        ),
        repository=FakeToyRepository(),
    )

    await service.create_upload_url(file_name="robot.jpg", content_type="image/jpg")

    assert fake_s3_client.calls[0]["params"]["ContentType"] == "image/jpeg"


async def test_upload_url_rejects_unsupported_content_type() -> None:
    service = ToyService(
        settings=Settings(
            aws_access_key_id="access-key",
            aws_secret_access_key="secret-key",
            aws_region="us-east-1",
            aws_bucket_name="toybox-bucket",
        ),
        repository=FakeToyRepository(),
    )

    with pytest.raises(HTTPException) as error:
        await service.create_upload_url(file_name="robot.heic", content_type="image/heic")

    assert error.value.status_code == 400
    assert error.value.detail == "Toy image uploads must be JPEG, PNG, or WebP."


async def test_upload_url_reports_missing_s3_config() -> None:
    service = ToyService(
        settings=Settings(
            aws_access_key_id=None,
            aws_secret_access_key=None,
            aws_region=None,
            aws_bucket_name=None,
        ),
        repository=FakeToyRepository(),
    )

    with pytest.raises(HTTPException) as error:
        await service.create_upload_url(file_name="robot.png", content_type="image/png")

    assert error.value.status_code == 500
    assert "Missing S3 configuration" in error.value.detail
    assert "AWS_BUCKET_NAME" in error.value.detail
