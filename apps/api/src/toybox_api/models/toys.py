from pydantic import BaseModel, Field, model_validator


class CreateToyUploadUrl(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=255)


class ToyUploadUrl(BaseModel):
    upload_url: str
    object_url: str
    object_key: str


class CreateToy(BaseModel):
    description: str = Field(min_length=1, max_length=120)
    image_url: str | None = Field(default=None, min_length=1)
    object_key: str | None = Field(default=None, min_length=1)
    tries: int = Field(ge=1)
    cost_per_try: int = Field(ge=0)
    caught: bool

    @model_validator(mode="after")
    def validate_caught_media(self) -> "CreateToy":
        if self.caught and (self.image_url is None or self.object_key is None):
            raise ValueError("Caught toys require image_url and object_key.")

        return self


class Toy(BaseModel):
    id: str
    description: str
    media_url: str | None
    object_key: str | None
    tries: int
    cost_per_try: int
    caught: bool
    created_at: str
