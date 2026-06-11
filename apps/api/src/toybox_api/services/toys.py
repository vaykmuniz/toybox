from pathlib import PurePath
from uuid import uuid4

import boto3
from fastapi import HTTPException

from toybox_api.config import Settings, get_settings
from toybox_api.models.toys import Toy, ToyUploadUrl
from toybox_api.repositories.toys import ToyRecord, ToyRepository

AllowedUploadContentTypes = {"image/jpeg", "image/png", "image/webp"}


class ToyService:
    def __init__(
        self,
        settings: Settings | None = None,
        repository: ToyRepository | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.repository = repository or ToyRepository(self.settings)

    async def create_upload_url(self, file_name: str, content_type: str) -> ToyUploadUrl:
        self._validate_s3_settings()
        clean_content_type = self._content_type(content_type)

        object_key = self._object_key(file_name)
        upload_url = self._s3_client().generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self.settings.aws_bucket_name,
                "Key": object_key,
                "ContentType": clean_content_type,
            },
            ExpiresIn=300,
        )

        return ToyUploadUrl(
            upload_url=upload_url,
            object_url=self._object_url(object_key),
            object_key=object_key,
        )

    async def create_toy(
        self,
        user_id: str,
        name: str,
        image_url: str,
        object_key: str,
        tries: int,
    ) -> Toy:
        record = await self.repository.create_toy(
            user_id=user_id,
            name=name.strip(),
            image_url=image_url,
            object_key=object_key,
            tries=tries,
        )
        return self._toy_response(record)

    def _validate_s3_settings(self) -> None:
        missing = [
            name
            for name, value in [
                ("AWS_ACCESS_KEY_ID", self.settings.aws_access_key_id),
                ("AWS_SECRET_ACCESS_KEY", self.settings.aws_secret_access_key),
                ("AWS_REGION", self.settings.aws_region),
                ("AWS_BUCKET_NAME", self.settings.aws_bucket_name),
            ]
            if not value
        ]

        if missing:
            raise HTTPException(
                status_code=500,
                detail=f"Missing S3 configuration: {', '.join(missing)}",
            )

    def _content_type(self, content_type: str) -> str:
        clean_content_type = content_type.strip().lower()

        if clean_content_type == "image/jpg":
            clean_content_type = "image/jpeg"

        if clean_content_type not in AllowedUploadContentTypes:
            raise HTTPException(
                status_code=400,
                detail="Toy image uploads must be JPEG, PNG, or WebP.",
            )

        return clean_content_type

    def _s3_client(self):
        return boto3.client(
            "s3",
            aws_access_key_id=self.settings.aws_access_key_id,
            aws_secret_access_key=self.settings.aws_secret_access_key,
            region_name=self.settings.aws_region,
            endpoint_url=self.settings.s3_endpoint_url or None,
        )

    def _object_key(self, file_name: str) -> str:
        clean_name = PurePath(file_name).name.strip().replace(" ", "-")

        if not clean_name:
            clean_name = "toy"

        return f"toys/{uuid4()}-{clean_name}"

    def _object_url(self, object_key: str) -> str:
        if self.settings.s3_public_base_url:
            return f"{self.settings.s3_public_base_url.rstrip('/')}/{object_key}"

        return (
            f"https://{self.settings.aws_bucket_name}.s3."
            f"{self.settings.aws_region}.amazonaws.com/{object_key}"
        )

    def _toy_response(self, record: ToyRecord) -> Toy:
        return Toy(
            id=str(record.id),
            name=record.name,
            media_url=record.image_url,
            object_key=record.object_key,
            tries=record.tries,
            created_at=record.created_at.isoformat(),
        )
