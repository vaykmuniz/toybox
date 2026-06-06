from fastapi import APIRouter

from toybox_api.config import get_settings
from toybox_api.db import check_database

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    settings = get_settings()
    return {"status": "ok", "service": settings.api_name}


@router.get("/health/db")
async def database_health() -> dict[str, str]:
    settings = get_settings()
    healthy = await check_database(settings)
    return {"status": "ok" if healthy else "error"}
