import base64
import binascii
import hashlib
import hmac
import json
from datetime import UTC, datetime
from typing import Any


def encode_jwt(
    *,
    payload: dict[str, Any],
    secret_key: str,
    algorithm: str,
) -> str:
    if algorithm != "HS256":
        raise ValueError("Only HS256 JWT signing is supported.")

    header = {"alg": algorithm, "typ": "JWT"}
    signing_input = ".".join(
        [
            _base64url_json(header),
            _base64url_json(_normalize_payload(payload)),
        ]
    )
    signature = hmac.new(
        secret_key.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    return f"{signing_input}.{_base64url_encode(signature)}"


def decode_jwt(
    *,
    token: str,
    secret_key: str,
    algorithm: str,
) -> dict[str, Any]:
    if algorithm != "HS256":
        raise ValueError("Only HS256 JWT signing is supported.")

    try:
        header_text, payload_text, signature_text = token.split(".", 2)
        header = _base64url_json_decode(header_text)
        payload = _base64url_json_decode(payload_text)
        signature = _base64url_decode(signature_text)
    except (ValueError, json.JSONDecodeError, binascii.Error):
        raise ValueError("Invalid JWT.") from None

    if header.get("alg") != algorithm or header.get("typ") != "JWT":
        raise ValueError("Invalid JWT header.")

    signing_input = f"{header_text}.{payload_text}"
    expected_signature = hmac.new(
        secret_key.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    if not hmac.compare_digest(signature, expected_signature):
        raise ValueError("Invalid JWT signature.")

    expires_at = payload.get("exp")
    if not isinstance(expires_at, int | float) or expires_at <= datetime.now(UTC).timestamp():
        raise ValueError("Expired JWT.")

    return payload


def _normalize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    normalized: dict[str, Any] = {}

    for key, value in payload.items():
        if isinstance(value, datetime):
            normalized[key] = int(_as_utc(value).timestamp())
        else:
            normalized[key] = value

    return normalized


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def _base64url_json(value: dict[str, Any]) -> str:
    serialized = json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")

    return _base64url_encode(serialized)


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _base64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(f"{value}{'=' * (-len(value) % 4)}")


def _base64url_json_decode(value: str) -> dict[str, Any]:
    decoded = json.loads(_base64url_decode(value))

    if not isinstance(decoded, dict):
        raise ValueError("Invalid JWT JSON.")

    return decoded
