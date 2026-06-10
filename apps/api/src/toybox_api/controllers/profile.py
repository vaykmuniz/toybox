from fastapi import APIRouter, Depends
from fastapi.requests import Request

from toybox_api.models.profile import GetProfile
from toybox_api.services.authentication import AuthenticatedUser, get_authenticated_user
from toybox_api.services.profile import ProfileService

router = APIRouter()
service = ProfileService()
AuthenticatedUserDependency = Depends(get_authenticated_user)


@router.get("/profile", response_model=GetProfile)
async def profile(
    request: Request,
    user: AuthenticatedUser = AuthenticatedUserDependency,
) -> GetProfile:
    return await service.get_profile(request, user)
