import base64
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
