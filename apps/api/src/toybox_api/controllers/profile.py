from fastapi import APIRouter
from fastapi.requests import Request

from toybox_api.models.profile import GetProfile
from toybox_api.services.profile import ProfileService

router = APIRouter()
service = ProfileService()


@router.get("/profile", response_model=GetProfile)
async def profile(request: Request) -> GetProfile:
    return await service.get_profile(request)
