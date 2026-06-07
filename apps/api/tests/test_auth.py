from datetime import datetime, timedelta

import httpx
import pytest
from fastapi import HTTPException

from toybox_api.controllers import auth as auth_controller
from toybox_api.main import app
from toybox_api.models.auth import LoginRequest, RegisterRequest, VerifyRegisterRequest
from toybox_api.repositories.auth import (
    AccountUserRecord,
    CreatedUserRecord,
    DuplicateUserError,
    PendingUserRecord,
    UserConflictRecord,
)
from toybox_api.services.auth import AuthService
from toybox_api.services.email import EmailDeliveryError

FixedNow = datetime(2026, 6, 7, 12, 0, 0)


class FakeAuthRepository:
    def __init__(self, events: list[str] | None = None) -> None:
        self.users: dict[str, PendingUserRecord] = {}
        self.password_hashes: dict[str, str] = {}
        self.next_conflicts = UserConflictRecord(email=False, username=False)
        self.cleared_user_ids: list[str] = []
        self.events = events if events is not None else []

    async def find_user_conflicts(self, email: str, username: str) -> UserConflictRecord:
        return UserConflictRecord(
            email=self.next_conflicts.email
            or any(user.email == email for user in self.users.values()),
            username=self.next_conflicts.username or username in self.users,
        )

    async def create_pending_user(
        self,
        *,
        email: str,
        username: str,
        name: str,
        password_hash: str,
        token: str,
        token_expires_at: datetime,
        after_create,
    ) -> CreatedUserRecord:
        conflicts = await self.find_user_conflicts(email, username)

        if conflicts.email or conflicts.username:
            raise DuplicateUserError(conflicts)

        self.events.append("insert")
        user = PendingUserRecord(
            id=f"user-{len(self.users) + 1}",
            email=email,
            username=username,
            name=name,
            is_valid=False,
            token=token,
            token_expires_at=token_expires_at,
        )

        created_user = CreatedUserRecord(
            id=user.id,
            email=user.email,
            username=user.username,
            name=user.name,
            is_valid=user.is_valid,
            token=token,
            token_expires_at=token_expires_at,
        )

        self.users[username] = user
        self.password_hashes[username] = password_hash

        try:
            after_create(created_user)
        except Exception:
            self.users.pop(username, None)
            self.password_hashes.pop(username, None)
            raise

        return created_user

    async def get_user_by_username(self, username: str) -> PendingUserRecord | None:
        return self.users.get(username)

    async def clear_registration_token(self, user_id: str) -> None:
        self.cleared_user_ids.append(user_id)
        for username, user in self.users.items():
            if user.id == user_id:
                self.users[username] = PendingUserRecord(
                    id=user.id,
                    email=user.email,
                    username=user.username,
                    name=user.name,
                    is_valid=True,
                    token=None,
                    token_expires_at=None,
                )
                return

    async def get_account_by_username(self, username: str) -> AccountUserRecord | None:
        user = self.users.get(username)

        if user is None:
            return None

        return AccountUserRecord(
            id=user.id,
            email=user.email,
            username=user.username,
            name=user.name,
            password_hash=self.password_hashes[username],
            is_valid=user.is_valid,
        )


class FakeEmailService:
    def __init__(self, events: list[str] | None = None, should_fail: bool = False) -> None:
        self.events = events if events is not None else []
        self.should_fail = should_fail
        self.sent: list[dict[str, str]] = []

    def send_registration_email(self, *, email: str, username: str, token: str) -> None:
        self.events.append("email")

        if self.should_fail:
            raise EmailDeliveryError("Failed to send verification email.")

        self.sent.append({"email": email, "username": username, "token": token})


def create_service(
    repository: FakeAuthRepository,
    email_service: FakeEmailService | None = None,
) -> AuthService:
    service = AuthService(
        repository=repository,
        email_service=email_service or FakeEmailService(),
    )
    service._now = lambda: FixedNow
    return service


def api_client() -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://testserver")


async def test_register_creates_pending_user_with_token() -> None:
    events: list[str] = []
    repository = FakeAuthRepository(events)
    email_service = FakeEmailService(events)
    service = create_service(repository, email_service)

    response = await service.register(
        RegisterRequest(
            email="USER@example.com",
            username="collector",
            name="Toy Collector",
            password="secret",
        )
    )

    assert response.id == "user-1"
    assert response.email == "user@example.com"
    assert response.username == "collector"
    assert response.name == "Toy Collector"
    assert response.token_expires_at == FixedNow + timedelta(hours=1)
    assert events == ["insert", "email"]
    assert email_service.sent == [
        {
            "email": "user@example.com",
            "username": "collector",
            "token": repository.users["collector"].token,
        }
    ]
    assert repository.users["collector"].is_valid is False
    assert repository.users["collector"].token
    assert repository.password_hashes["collector"].startswith("pbkdf2_sha256$")
    assert "secret" not in repository.password_hashes["collector"]


async def test_register_rejects_duplicate_email() -> None:
    repository = FakeAuthRepository()
    email_service = FakeEmailService()
    repository.next_conflicts = UserConflictRecord(email=True, username=False)
    service = create_service(repository, email_service)

    with pytest.raises(HTTPException) as exc_info:
        await service.register(
            RegisterRequest(
                email="used@example.com",
                username="collector",
                name="Toy Collector",
                password="secret",
            )
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "Email is already used."
    assert repository.users == {}
    assert email_service.sent == []


async def test_register_rejects_duplicate_username() -> None:
    repository = FakeAuthRepository()
    email_service = FakeEmailService()
    repository.next_conflicts = UserConflictRecord(email=False, username=True)
    service = create_service(repository, email_service)

    with pytest.raises(HTTPException) as exc_info:
        await service.register(
            RegisterRequest(
                email="new@example.com",
                username="collector",
                name="Toy Collector",
                password="secret",
            )
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "Username is already used."
    assert repository.users == {}
    assert email_service.sent == []


async def test_register_rolls_back_pending_user_when_email_fails() -> None:
    events: list[str] = []
    repository = FakeAuthRepository(events)
    service = create_service(repository, FakeEmailService(events, should_fail=True))

    with pytest.raises(HTTPException) as exc_info:
        await service.register(
            RegisterRequest(
                email="user@example.com",
                username="collector",
                name="Toy Collector",
                password="secret",
            )
        )

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "Failed to send verification email."
    assert events == ["insert", "email"]
    assert repository.users == {}
    assert repository.password_hashes == {}


async def test_verify_register_clears_matching_registration_token() -> None:
    repository = FakeAuthRepository()
    service = create_service(repository)
    await service.register(
        RegisterRequest(
            email="user@example.com",
            username="collector",
            name="Toy Collector",
            password="secret",
        )
    )
    token = repository.users["collector"].token

    response = await service.verify_register(
        VerifyRegisterRequest(username="collector", token=token)
    )

    assert response.id == "user-1"
    assert response.username == "collector"
    assert response.verified is True
    assert repository.cleared_user_ids == ["user-1"]
    assert repository.users["collector"].is_valid is True
    assert repository.users["collector"].token is None
    assert repository.users["collector"].token_expires_at is None


async def test_verify_register_rejects_wrong_token() -> None:
    repository = FakeAuthRepository()
    service = create_service(repository)
    await service.register(
        RegisterRequest(
            email="user@example.com",
            username="collector",
            name="Toy Collector",
            password="secret",
        )
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.verify_register(VerifyRegisterRequest(username="collector", token="wrong"))

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Invalid or expired registration token."
    assert repository.cleared_user_ids == []


async def test_verify_register_rejects_expired_token() -> None:
    repository = FakeAuthRepository()
    service = create_service(repository)
    await service.register(
        RegisterRequest(
            email="user@example.com",
            username="collector",
            name="Toy Collector",
            password="secret",
        )
    )
    token = repository.users["collector"].token
    service._now = lambda: FixedNow + timedelta(hours=1, seconds=1)

    with pytest.raises(HTTPException) as exc_info:
        await service.verify_register(VerifyRegisterRequest(username="collector", token=token))

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Invalid or expired registration token."
    assert repository.cleared_user_ids == []


async def test_login_returns_valid_account() -> None:
    repository = FakeAuthRepository()
    service = create_service(repository)
    await service.register(
        RegisterRequest(
            email="user@example.com",
            username="collector",
            name="Toy Collector",
            password="secret",
        )
    )
    token = repository.users["collector"].token
    await service.verify_register(VerifyRegisterRequest(username="collector", token=token))

    response = await service.login(LoginRequest(username="collector", password="secret"))

    assert response.id == "user-1"
    assert response.email == "user@example.com"
    assert response.username == "collector"
    assert response.name == "Toy Collector"


async def test_login_rejects_pending_account() -> None:
    repository = FakeAuthRepository()
    service = create_service(repository)
    await service.register(
        RegisterRequest(
            email="user@example.com",
            username="collector",
            name="Toy Collector",
            password="secret",
        )
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.login(LoginRequest(username="collector", password="secret"))

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Account is not verified."


async def test_login_rejects_wrong_password() -> None:
    repository = FakeAuthRepository()
    service = create_service(repository)
    await service.register(
        RegisterRequest(
            email="user@example.com",
            username="collector",
            name="Toy Collector",
            password="secret",
        )
    )
    token = repository.users["collector"].token
    await service.verify_register(VerifyRegisterRequest(username="collector", token=token))

    with pytest.raises(HTTPException) as exc_info:
        await service.login(LoginRequest(username="collector", password="wrong"))

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid username or password."


async def test_register_endpoint_returns_created_pending_user(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    repository = FakeAuthRepository()
    monkeypatch.setattr(auth_controller, "service", create_service(repository))

    async with api_client() as client:
        response = await client.post(
            "/register",
            json={
                "email": "user@example.com",
                "username": "collector",
                "name": "Toy Collector",
                "password": "secret",
            },
        )

    assert response.status_code == 201
    payload = response.json()
    assert payload["id"] == "user-1"
    assert payload["email"] == "user@example.com"
    assert payload["username"] == "collector"
    assert payload["name"] == "Toy Collector"
    assert "token" not in payload
    assert payload["token_expires_at"] == "2026-06-07T13:00:00"


async def test_login_endpoint_returns_valid_account(monkeypatch: pytest.MonkeyPatch) -> None:
    repository = FakeAuthRepository()
    service = create_service(repository)
    await service.register(
        RegisterRequest(
            email="user@example.com",
            username="collector",
            name="Toy Collector",
            password="secret",
        )
    )
    token = repository.users["collector"].token
    await service.verify_register(VerifyRegisterRequest(username="collector", token=token))
    monkeypatch.setattr(auth_controller, "service", service)

    async with api_client() as client:
        response = await client.post(
            "/login",
            json={
                "username": "collector",
                "password": "secret",
            },
        )

    assert response.status_code == 200
    assert response.json() == {
        "id": "user-1",
        "email": "user@example.com",
        "username": "collector",
        "name": "Toy Collector",
    }


async def test_verify_register_link_endpoint_verifies_account(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    repository = FakeAuthRepository()
    service = create_service(repository)
    await service.register(
        RegisterRequest(
            email="user@example.com",
            username="collector",
            name="Toy Collector",
            password="secret",
        )
    )
    token = repository.users["collector"].token
    monkeypatch.setattr(auth_controller, "service", service)

    async with api_client() as client:
        response = await client.get(
            "/register/verify",
            params={"username": "collector", "token": token},
        )

    assert response.status_code == 200
    assert response.json() == {"id": "user-1", "username": "collector", "verified": True}
    assert repository.users["collector"].is_valid is True
