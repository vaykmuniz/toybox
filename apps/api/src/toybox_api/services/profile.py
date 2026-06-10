from fastapi import HTTPException, status
from fastapi.requests import Request

from toybox_api.models.profile import (
    GetProfile,
    ProfileToy,
)
from toybox_api.repositories.profile import ProfileNotFoundError, ProfileRecord, ProfileRepository
from toybox_api.services.authentication import AuthenticatedUser


class ProfileService:
    def __init__(self, repository: ProfileRepository | None = None) -> None:
        self.repository = repository or ProfileRepository()

    async def get_profile(self, request: Request, user: AuthenticatedUser) -> GetProfile:
        try:
            profile = await self.repository.get_profile(user.id)
        except ProfileNotFoundError as error:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found.",
            ) from error

        return self._profile_response(request, profile)

    def _static_url(self, request: Request, path: str) -> str:
        return str(request.url_for("static", path=path))

    def _profile_response(self, request: Request, profile: ProfileRecord) -> GetProfile:
        return GetProfile(
            id=profile.id,
            name=profile.name,
            handle=profile.handle,
            avatar_url=self._static_url(request, profile.avatar_path),
            toys=[
                ProfileToy(
                    id=toy.id,
                    media_url=toy.media_path
                    if toy.is_absolute_url
                    else self._static_url(request, toy.media_path),
                    caption=toy.caption,
                )
                for toy in profile.toys
            ],
        )
