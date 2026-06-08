from pydantic import BaseModel, Field


class CreateToyUploadUrl(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=255)


class ToyUploadUrl(BaseModel):
    upload_url: str
    object_url: str
    object_key: str


class CreateToy(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    image_url: str = Field(min_length=1)
    object_key: str = Field(min_length=1)
    tries: int = Field(ge=1)


class Toy(BaseModel):
    id: str
    name: str
    media_url: str
    object_key: str
    tries: int
    created_at: str
