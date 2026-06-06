from typing import Annotated

from fastapi import APIRouter, Depends

from toybox_api.config import Settings, get_settings
from toybox_api.db import check_database

router = APIRouter()
SettingsDependency = Annotated[Settings, Depends(get_settings)]


@router.get("/health")
async def health(settings: SettingsDependency) -> dict[str, str]:
    return {"status": "ok", "service": settings.api_name}


@router.get("/health/db")
async def database_health(settings: SettingsDependency) -> dict[str, str]:
    healthy = await check_database(settings)
    return {"status": "ok" if healthy else "error"}
