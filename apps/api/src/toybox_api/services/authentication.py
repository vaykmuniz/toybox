from dataclasses import dataclass

from fastapi import HTTPException, Request, status

from toybox_api.config import get_settings
from toybox_api.services.jwt import decode_jwt


@dataclass(frozen=True)
class AuthenticatedUser:
    id: str


async def get_authenticated_user(request: Request) -> AuthenticatedUser:
    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )

    settings = get_settings()

    try:
        payload = decode_jwt(
            token=token,
            secret_key=settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token.",
        ) from error

    subject = payload.get("sub")

    if not isinstance(subject, str) or not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token.",
        )

    return AuthenticatedUser(id=subject)
