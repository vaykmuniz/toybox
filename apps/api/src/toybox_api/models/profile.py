from pydantic import BaseModel


class ProfileToy(BaseModel):
    id: str
    media_url: str
    caption: str | None = None


class GetProfile(BaseModel):
    id: str
    name: str
    handle: str
    avatar_url: str
    toys: list[ProfileToy]
