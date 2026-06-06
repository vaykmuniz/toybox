from toybox_api.config import get_settings
from toybox_api.db import check_database


class HealthService:
    def get_health(self) -> dict[str, str]:
        settings = get_settings()
        return {"status": "ok", "service": settings.api_name}

    async def get_database_health(self) -> dict[str, str]:
        settings = get_settings()
        healthy = await check_database(settings)
        return {"status": "ok" if healthy else "error"}
