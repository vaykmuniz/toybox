import asyncpg

from toybox_api.config import Settings


async def check_database(settings: Settings) -> bool:
    connection = await asyncpg.connect(settings.database_url)
    try:
        value = await connection.fetchval("select 1")
        return value == 1
    finally:
        await connection.close()
