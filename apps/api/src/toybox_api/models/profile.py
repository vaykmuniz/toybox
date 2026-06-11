from pydantic import BaseModel
from pydantic import Field


class CreateAvatarUploadUrl(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=255)


class AvatarUploadUrl(BaseModel):
    upload_url: str
    object_url: str
    object_key: str


class UpdateAvatar(BaseModel):
    object_key: str = Field(min_length=1)


class ProfileToy(BaseModel):
    id: str
    media_url: str
    caption: str | None = None


class GetProfile(BaseModel):
    id: str
    name: str
    handle: str
    avatar_url: str | None
    toys: list[ProfileToy]
