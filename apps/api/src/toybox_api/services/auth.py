import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

from asyncpg.exceptions import UniqueViolationError
from fastapi import HTTPException, status

from toybox_api.models.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    VerifyRegisterRequest,
    VerifyRegisterResponse,
)
from toybox_api.repositories.auth import AuthRepository, CreatedUserRecord, DuplicateUserError
from toybox_api.services.email import EmailDeliveryError, ResendEmailService

RegistrationTokenTtl = timedelta(hours=1)
PasswordHashIterations = 600_000


class AuthService:
    def __init__(
        self,
        repository: AuthRepository | None = None,
        email_service: ResendEmailService | None = None,
    ) -> None:
        self.repository = repository or AuthRepository()
        self.email_service = email_service or ResendEmailService()

    async def register(self, payload: RegisterRequest) -> RegisterResponse:
        token = secrets.token_urlsafe(32)
        token_expires_at = self._now() + RegistrationTokenTtl

        try:
            user = await self.repository.create_pending_user(
                email=payload.email,
                username=payload.username,
                name=payload.name,
                password_hash=self._hash_password(payload.password),
                token=token,
                token_expires_at=token_expires_at,
                after_create=self._send_registration_email,
            )
        except DuplicateUserError as error:
            self._raise_duplicate_user_conflict(error)
        except UniqueViolationError as error:
            self._raise_duplicate_user_error(error)
        except EmailDeliveryError as error:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to send verification email.",
            ) from error

        return RegisterResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            name=user.name,
            token_expires_at=user.token_expires_at,
        )

    async def verify_register(self, payload: VerifyRegisterRequest) -> VerifyRegisterResponse:
        user = await self.repository.get_user_by_username(payload.username)

        if user is None or user.token is None or user.token_expires_at is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired registration token.",
            )

        if not hmac.compare_digest(user.token, payload.token):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired registration token.",
            )

        if user.token_expires_at <= self._now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired registration token.",
            )

        await self.repository.clear_registration_token(user.id)

        return VerifyRegisterResponse(id=user.id, username=user.username, verified=True)

    async def login(self, payload: LoginRequest) -> LoginResponse:
        user = await self.repository.get_account_by_username(payload.username)

        if user is None or not self._verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password.",
            )

        if not user.is_valid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is not verified.",
            )

        return LoginResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            name=user.name,
        )

    def _now(self) -> datetime:
        return datetime.now(UTC).replace(tzinfo=None)

    def _hash_password(self, password: str) -> str:
        salt = secrets.token_hex(16)
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            PasswordHashIterations,
        ).hex()

        return f"pbkdf2_sha256${PasswordHashIterations}${salt}${digest}"

    def _verify_password(self, password: str, password_hash: str) -> bool:
        try:
            algorithm, iterations_text, salt, expected_digest = password_hash.split("$", 3)
            iterations = int(iterations_text)
        except ValueError:
            return False

        if algorithm != "pbkdf2_sha256":
            return False

        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        ).hex()

        return hmac.compare_digest(digest, expected_digest)

    def _send_registration_email(self, user: CreatedUserRecord) -> None:
        self.email_service.send_registration_email(
            email=user.email,
            username=user.username,
            token=user.token,
        )

    def _raise_duplicate_user_conflict(self, error: DuplicateUserError) -> None:
        if error.conflicts.email:
            detail = "Email is already used."
        elif error.conflicts.username:
            detail = "Username is already used."
        else:
            detail = "Email or username is already used."

        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from error

    def _raise_duplicate_user_error(self, error: UniqueViolationError) -> None:
        constraint_name = getattr(error, "constraint_name", "")

        if constraint_name == "uq_users_email":
            detail = "Email is already used."
        elif constraint_name == "uq_users_username":
            detail = "Username is already used."
        else:
            detail = "Email or username is already used."

        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from error
