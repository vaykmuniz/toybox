from pydantic import BaseModel


class ProfileStats(BaseModel):
    posts: int
    followers: int
    following: int


class ProfileBadge(BaseModel):
    description: str
    text: str


class ProfileToy(BaseModel):
    id: str
    media_url: str
    caption: str | None = None


class GetProfile(BaseModel):
    id: str
    name: str
    handle: str
    avatar_url: str
    bio: str
    stats: ProfileStats
    badges: list[ProfileBadge]
    toys: list[ProfileToy]
