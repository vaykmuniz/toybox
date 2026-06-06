from fastapi import APIRouter

from toybox_api.services.health import HealthService

router = APIRouter()
service = HealthService()


@router.get("/health")
async def health() -> dict[str, str]:
    return service.get_health()


@router.get("/health/db")
async def database_health() -> dict[str, str]:
    return await service.get_database_health()
