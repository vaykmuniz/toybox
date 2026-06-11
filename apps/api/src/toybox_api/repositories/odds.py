from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

import asyncpg

from toybox_api.config import Settings, get_settings


@dataclass(frozen=True)
class RecentCatchOwnerRecord:
    id: str
    name: str | None
    username: str
    avatar_url: str | None


@dataclass(frozen=True)
class RecentCatchRecord:
    id: UUID
    name: str
    object_key: str
    tries: int
    created_at: datetime
    owner: RecentCatchOwnerRecord


class OddsRepository:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    async def list_recent_catches(self) -> list[RecentCatchRecord]:
        connection = await asyncpg.connect(self.settings.database_url)
        try:
            rows = await connection.fetch(
                """
                select
                    toy.id,
                    toy.name,
                    toy.object_key,
                    toy.tries,
                    toy.created_at,
                    users.id as owner_id,
                    users.name as owner_name,
                    users.username as owner_username,
                    users.avatar_url as owner_avatar_url
                from toy
                join users on users.id = toy.user_id
                where toy.created_at >= current_timestamp - interval '1 hour'
                order by toy.created_at desc
                """
            )
        finally:
            await connection.close()

        return [
            RecentCatchRecord(
                id=row["id"],
                name=row["name"],
                object_key=row["object_key"],
                tries=row["tries"],
                created_at=row["created_at"],
                owner=RecentCatchOwnerRecord(
                    id=row["owner_id"],
                    name=row["owner_name"],
                    username=row["owner_username"],
                    avatar_url=row["owner_avatar_url"],
                ),
            )
            for row in rows
        ]
