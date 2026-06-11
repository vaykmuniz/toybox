from fastapi import APIRouter, Depends
from fastapi.requests import Request

from toybox_api.models.profile import AvatarUploadUrl, CreateAvatarUploadUrl, GetProfile, UpdateAvatar
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


@router.post("/profile/avatar/upload-url", response_model=AvatarUploadUrl)
async def avatar_upload_url(
    payload: CreateAvatarUploadUrl,
    user: AuthenticatedUser = AuthenticatedUserDependency,
) -> AvatarUploadUrl:
    return await service.create_avatar_upload_url(
        user=user,
        file_name=payload.file_name,
        content_type=payload.content_type,
    )


@router.put("/profile/avatar", response_model=GetProfile)
async def update_avatar(
    payload: UpdateAvatar,
    request: Request,
    user: AuthenticatedUser = AuthenticatedUserDependency,
) -> GetProfile:
    return await service.update_avatar(request, user, payload.object_key)
