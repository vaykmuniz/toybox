from dataclasses import dataclass
from datetime import datetime
from uuid import UUID, uuid4

import asyncpg

from toybox_api.config import Settings


@dataclass(frozen=True)
class ToyRecord:
    id: UUID
    user_id: str
    name: str
    image_url: str
    object_key: str
    tries: int
    created_at: datetime


class ToyRepository:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def create_toy(
        self,
        user_id: str,
        name: str,
        image_url: str,
        object_key: str,
        tries: int,
    ) -> ToyRecord:
        connection = await asyncpg.connect(self.settings.database_url)
        try:
            row = await connection.fetchrow(
                """
                insert into toy (id, user_id, name, image_url, object_key, tries)
                values ($1, $2, $3, $4, $5, $6)
                returning id, user_id, name, image_url, object_key, tries, created_at
                """,
                uuid4(),
                user_id,
                name,
                image_url,
                object_key,
                tries,
            )
        finally:
            await connection.close()

        return ToyRecord(
            id=row["id"],
            user_id=row["user_id"],
            name=row["name"],
            image_url=row["image_url"],
            object_key=row["object_key"],
            tries=row["tries"],
            created_at=row["created_at"],
        )

    async def list_toys(self) -> list[ToyRecord]:
        connection = await asyncpg.connect(self.settings.database_url)
        try:
            rows = await connection.fetch(
                """
                select id, user_id, name, image_url, object_key, tries, created_at
                from toy
                order by created_at desc
                """
            )
        finally:
            await connection.close()

        return [
            ToyRecord(
                id=row["id"],
                user_id=row["user_id"],
                name=row["name"],
                image_url=row["image_url"],
                object_key=row["object_key"],
                tries=row["tries"],
                created_at=row["created_at"],
            )
            for row in rows
        ]
