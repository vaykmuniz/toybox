from fastapi import APIRouter, Depends

from toybox_api.models.odds import RecentCatch
from toybox_api.services.authentication import AuthenticatedUser, get_authenticated_user
from toybox_api.services.odds import OddsService

router = APIRouter()
service = OddsService()
AuthenticatedUserDependency = Depends(get_authenticated_user)


@router.get("/odds/recent-catches", response_model=list[RecentCatch])
async def recent_catches(
    user: AuthenticatedUser = AuthenticatedUserDependency,
) -> list[RecentCatch]:
    _ = user
    return await service.list_recent_catches()
