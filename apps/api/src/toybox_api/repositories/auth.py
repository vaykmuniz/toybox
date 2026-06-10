from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from uuid import uuid4

import asyncpg

from toybox_api.config import get_settings

DefaultAvatarPath = "mocks/avatar.png"


@dataclass(frozen=True)
class UserConflictRecord:
    email: bool
    username: bool


@dataclass(frozen=True)
class PendingUserRecord:
    id: str
    email: str
    username: str
    name: str
    is_valid: bool
    token: str | None
    token_expires_at: datetime | None


@dataclass(frozen=True)
class CreatedUserRecord:
    id: str
    email: str
    username: str
    name: str
    is_valid: bool
    token: str
    token_expires_at: datetime


@dataclass(frozen=True)
class AccountUserRecord:
    id: str
    email: str
    username: str
    name: str
    password_hash: str
    is_valid: bool


class DuplicateUserError(Exception):
    def __init__(self, conflicts: UserConflictRecord) -> None:
        self.conflicts = conflicts
        super().__init__("User email or username is already used.")


class AuthRepository:
    async def _connect(self) -> asyncpg.Connection:
        return await asyncpg.connect(get_settings().database_url)

    async def find_user_conflicts(self, email: str, username: str) -> UserConflictRecord:
        connection = await self._connect()
        try:
            return await self._find_user_conflicts(connection, email, username)
        finally:
            await connection.close()

    async def create_pending_user(
        self,
        *,
        email: str,
        username: str,
        name: str,
        password_hash: str,
        token: str,
        token_expires_at: datetime,
        after_create: Callable[[CreatedUserRecord], None],
    ) -> CreatedUserRecord:
        connection = await self._connect()
        try:
            async with connection.transaction():
                conflicts = await self._find_user_conflicts(connection, email, username)

                if conflicts.email or conflicts.username:
                    raise DuplicateUserError(conflicts)

                row = await connection.fetchrow(
                    """
                    insert into users (
                        id, email, username, password_hash, name, avatar_path, is_valid, token,
                        token_expires_at
                    )
                    values ($1, $2, $3, $4, $5, $6, false, $7, $8)
                    returning id, email, username, name, is_valid, token, token_expires_at
                    """,
                    str(uuid4()),
                    email,
                    username,
                    password_hash,
                    name,
                    DefaultAvatarPath,
                    token,
                    token_expires_at,
                )
                user = CreatedUserRecord(
                    id=row["id"],
                    email=row["email"],
                    username=row["username"],
                    name=row["name"],
                    is_valid=row["is_valid"],
                    token=row["token"],
                    token_expires_at=row["token_expires_at"],
                )
                after_create(user)
        finally:
            await connection.close()

        return user

    async def get_user_by_username(self, username: str) -> PendingUserRecord | None:
        connection = await self._connect()
        try:
            row = await connection.fetchrow(
                """
                select id, email, username, name, is_valid, token, token_expires_at
                from users
                where username = $1
                """,
                username,
            )
        finally:
            await connection.close()

        if row is None:
            return None

        return PendingUserRecord(
            id=row["id"],
            email=row["email"],
            username=row["username"],
            name=row["name"],
            is_valid=row["is_valid"],
            token=row["token"],
            token_expires_at=row["token_expires_at"],
        )

    async def clear_registration_token(self, user_id: str) -> None:
        connection = await self._connect()
        try:
            await connection.execute(
                """
                update users
                set is_valid = true, token = null, token_expires_at = null
                where id = $1
                """,
                user_id,
            )
        finally:
            await connection.close()

    async def get_account_by_username(self, username: str) -> AccountUserRecord | None:
        connection = await self._connect()
        try:
            row = await connection.fetchrow(
                """
                select id, email, username, name, password_hash, is_valid
                from users
                where username = $1
                """,
                username,
            )
        finally:
            await connection.close()

        if row is None:
            return None

        return AccountUserRecord(
            id=row["id"],
            email=row["email"],
            username=row["username"],
            name=row["name"],
            password_hash=row["password_hash"],
            is_valid=row["is_valid"],
        )

    async def _find_user_conflicts(
        self,
        connection: asyncpg.Connection,
        email: str,
        username: str,
    ) -> UserConflictRecord:
        rows = await connection.fetch(
            """
            select email, username
            from users
            where email = $1 or username = $2
            """,
            email,
            username,
        )

        return UserConflictRecord(
            email=any(row["email"] == email for row in rows),
            username=any(row["username"] == username for row in rows),
        )
