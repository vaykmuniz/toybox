from dataclasses import dataclass

import asyncpg

from toybox_api.config import Settings, get_settings


@dataclass(frozen=True)
class ProfileToyRecord:
    id: str
    media_path: str | None
    object_key: str | None
    description: str
    tries: int
    cost_per_try: int
    caught: bool
    is_absolute_url: bool = False


@dataclass(frozen=True)
class ProfileRecord:
    id: str
    name: str
    handle: str
    avatar_url: str | None
    toys: list[ProfileToyRecord]


class ProfileNotFoundError(Exception):
    pass


class ProfileRepository:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    async def get_profile(self, user_id: str) -> ProfileRecord:
        connection = await asyncpg.connect(self.settings.database_url)
        try:
            user_row = await connection.fetchrow(
                """
                select id, username, name, avatar_url
                from users
                where id = $1
                """,
                user_id,
            )

            if user_row is None:
                raise ProfileNotFoundError

            toys = await self._list_uploaded_toys(connection, user_id)
        finally:
            await connection.close()

        return ProfileRecord(
            id=user_row["id"],
            name=user_row["name"],
            handle=f"@{user_row['username']}",
            avatar_url=user_row["avatar_url"],
            toys=toys,
        )

    async def update_avatar_url(self, user_id: str, avatar_url: str) -> ProfileRecord:
        connection = await asyncpg.connect(self.settings.database_url)
        try:
            result = await connection.execute(
                """
                update users
                set avatar_url = $2
                where id = $1
                """,
                user_id,
                avatar_url,
            )

            if result == "UPDATE 0":
                raise ProfileNotFoundError

            return await self._get_profile(connection, user_id)
        finally:
            await connection.close()

    async def _get_profile(
        self,
        connection: asyncpg.Connection,
        user_id: str,
    ) -> ProfileRecord:
        user_row = await connection.fetchrow(
            """
            select id, username, name, avatar_url
            from users
            where id = $1
            """,
            user_id,
        )

        if user_row is None:
            raise ProfileNotFoundError

        toys = await self._list_uploaded_toys(connection, user_id)

        return ProfileRecord(
            id=user_row["id"],
            name=user_row["name"],
            handle=f"@{user_row['username']}",
            avatar_url=user_row["avatar_url"],
            toys=toys,
        )

    async def list_uploaded_toys(self, user_id: str) -> list[ProfileToyRecord]:
        try:
            connection = await asyncpg.connect(self.settings.database_url)
        except (OSError, asyncpg.PostgresError):
            return []

        try:
            rows = await connection.fetch(
                """
                select id, description, image_url, object_key, tries, cost_per_try, caught
                from toy
                where user_id = $1
                order by created_at desc
                """,
                user_id,
            )
        except asyncpg.PostgresError:
            return []
        finally:
            await connection.close()

        return self._toy_records(rows)

    async def _list_uploaded_toys(
        self,
        connection: asyncpg.Connection,
        user_id: str,
    ) -> list[ProfileToyRecord]:
        rows = await connection.fetch(
            """
            select id, description, image_url, object_key, tries, cost_per_try, caught
            from toy
            where user_id = $1
            order by created_at desc
            """,
            user_id,
        )

        return self._toy_records(rows)

    def _toy_records(self, rows) -> list[ProfileToyRecord]:
        return [
            ProfileToyRecord(
                id=str(row["id"]),
                media_path=row["image_url"],
                object_key=row["object_key"],
                description=row["description"],
                tries=row["tries"],
                cost_per_try=row["cost_per_try"],
                caught=row["caught"],
                is_absolute_url=True,
            )
            for row in rows
        ]
