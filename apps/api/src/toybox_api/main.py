from typing import Annotated

from fastapi import Depends, FastAPI

from toybox_api.config import Settings, get_settings
from toybox_api.db import check_database

app = FastAPI(title="Toybox API")
SettingsDependency = Annotated[Settings, Depends(get_settings)]


@app.get("/health")
async def health(settings: SettingsDependency) -> dict[str, str]:
    return {"status": "ok", "service": settings.api_name}


@app.get("/health/db")
async def database_health(settings: SettingsDependency) -> dict[str, str]:
    healthy = await check_database(settings)
    return {"status": "ok" if healthy else "error"}
