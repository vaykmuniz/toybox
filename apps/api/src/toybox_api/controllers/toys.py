from fastapi import APIRouter

from toybox_api.models.toys import CreateToy, CreateToyUploadUrl, Toy, ToyUploadUrl
from toybox_api.services.toys import ToyService

router = APIRouter()
service = ToyService()


@router.post("/toys/upload-url", response_model=ToyUploadUrl)
async def toy_upload_url(payload: CreateToyUploadUrl) -> ToyUploadUrl:
    return await service.create_upload_url(
        file_name=payload.file_name,
        content_type=payload.content_type,
    )


@router.post("/toys", response_model=Toy)
async def create_toy(payload: CreateToy) -> Toy:
    return await service.create_toy(
        name=payload.name,
        image_url=payload.image_url,
        object_key=payload.object_key,
        tries=payload.tries,
    )
