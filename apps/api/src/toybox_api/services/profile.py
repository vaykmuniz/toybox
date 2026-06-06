from fastapi.requests import Request

from toybox_api.models.profile import (
    GetProfile,
    ProfileBadge,
    ProfileStats,
    ProfileToy,
)
from toybox_api.repositories.profile import ProfileRecord, ProfileRepository


class ProfileService:
    def __init__(self, repository: ProfileRepository | None = None) -> None:
        self.repository = repository or ProfileRepository()

    async def get_profile(self, request: Request) -> GetProfile:
        return self._profile_response(request, await self.repository.get_profile())

    def _static_url(self, request: Request, path: str) -> str:
        return str(request.url_for("static", path=path))

    def _profile_response(self, request: Request, profile: ProfileRecord) -> GetProfile:
        return GetProfile(
            id=profile.id,
            name=profile.name,
            handle=profile.handle,
            avatar_url=self._static_url(request, profile.avatar_path),
            bio=profile.bio,
            stats=ProfileStats(
                posts=profile.stats.posts,
                followers=profile.stats.followers,
                following=profile.stats.following,
            ),
            badges=[
                ProfileBadge(description=badge.description, text=badge.text)
                for badge in profile.badges
            ],
            toys=[
                ProfileToy(
                    id=toy.id,
                    media_url=self._static_url(request, toy.media_path),
                    caption=toy.caption,
                )
                for toy in profile.toys
            ],
        )
