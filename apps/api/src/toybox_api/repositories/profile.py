from dataclasses import dataclass

import asyncpg

from toybox_api.config import Settings, get_settings


@dataclass(frozen=True)
class ProfileToyRecord:
    id: str
    media_path: str
    caption: str | None = None
    is_absolute_url: bool = False


@dataclass(frozen=True)
class ProfileRecord:
    id: str
    name: str
    handle: str
    avatar_path: str
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
                select id, username, name, avatar_path
                from users
                where id = $1
                """,
                user_id,
            )

            if user_row is None:
                raise ProfileNotFoundError

            toys = await self._list_uploaded_toys(connection)
        finally:
            await connection.close()

        return ProfileRecord(
            id=user_row["id"],
            name=user_row["name"],
            handle=f"@{user_row['username']}",
            avatar_path=user_row["avatar_path"],
            toys=toys,
        )

    async def list_uploaded_toys(self) -> list[ProfileToyRecord]:
        try:
            connection = await asyncpg.connect(self.settings.database_url)
        except (OSError, asyncpg.PostgresError):
            return []

        try:
            rows = await connection.fetch(
                """
                select id, name, image_url
                from toy
                order by created_at desc
                """
            )
        except asyncpg.PostgresError:
            return []
        finally:
            await connection.close()

        return self._toy_records(rows)

    async def _list_uploaded_toys(
        self,
        connection: asyncpg.Connection,
    ) -> list[ProfileToyRecord]:
        rows = await connection.fetch(
            """
            select id, name, image_url
            from toy
            order by created_at desc
            """
        )

        return self._toy_records(rows)

    def _toy_records(self, rows) -> list[ProfileToyRecord]:
        return [
            ProfileToyRecord(
                id=str(row["id"]),
                media_path=row["image_url"],
                caption=row["name"],
                is_absolute_url=True,
            )
            for row in rows
        ]
