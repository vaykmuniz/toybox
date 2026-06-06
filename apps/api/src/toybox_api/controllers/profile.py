from fastapi import APIRouter
from fastapi.requests import Request

from toybox_api.models.profile import (
    GetProfile,
    ProfileBadge,
    ProfileStats,
    ProfileToy,
)
from toybox_api.repositories.profile import ProfileRecord, ProfileRepository

router = APIRouter()


def static_url(request: Request, path: str) -> str:
    return str(request.url_for("static", path=path))


def profile_response(request: Request, profile: ProfileRecord) -> GetProfile:
    return GetProfile(
        id=profile.id,
        name=profile.name,
        handle=profile.handle,
        avatar_url=static_url(request, profile.avatar_path),
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
                media_url=static_url(request, toy.media_path),
                caption=toy.caption,
            )
            for toy in profile.toys
        ],
    )


@router.get("/profile", response_model=GetProfile)
async def profile(request: Request) -> GetProfile:
    repository = ProfileRepository()
    return profile_response(request, await repository.get_profile())
