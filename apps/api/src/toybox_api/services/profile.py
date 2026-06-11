from pathlib import PurePath
from uuid import uuid4

import boto3
from fastapi import HTTPException, status
from fastapi.requests import Request

from toybox_api.config import Settings, get_settings
from toybox_api.models.profile import (
    AvatarUploadUrl,
    GetProfile,
    ProfileToy,
)
from toybox_api.repositories.profile import ProfileNotFoundError, ProfileRecord, ProfileRepository
from toybox_api.services.authentication import AuthenticatedUser

AllowedAvatarContentTypes = {"image/jpeg", "image/png", "image/webp"}


class ProfileService:
    def __init__(
        self,
        settings: Settings | None = None,
        repository: ProfileRepository | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.repository = repository or ProfileRepository(self.settings)

    async def get_profile(self, request: Request, user: AuthenticatedUser) -> GetProfile:
        try:
            profile = await self.repository.get_profile(user.id)
        except ProfileNotFoundError as error:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found.",
            ) from error

        return self._profile_response(request, profile)

    async def create_avatar_upload_url(
        self,
        user: AuthenticatedUser,
        file_name: str,
        content_type: str,
    ) -> AvatarUploadUrl:
        self._validate_s3_settings()
        clean_content_type = self._content_type(content_type)
        object_key = self._avatar_object_key(user.id, file_name)
        upload_url = self._s3_client().generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self.settings.aws_bucket_name,
                "Key": object_key,
                "ContentType": clean_content_type,
            },
            ExpiresIn=300,
        )

        return AvatarUploadUrl(
            upload_url=upload_url,
            object_url=self._object_url(object_key),
            object_key=object_key,
        )

    async def update_avatar(
        self,
        request: Request,
        user: AuthenticatedUser,
        object_key: str,
    ) -> GetProfile:
        if not object_key.startswith(f"avatars/{user.id}/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Avatar object key does not belong to the authenticated user.",
            )

        try:
            profile = await self.repository.update_avatar_path(
                user_id=user.id,
                avatar_path=self._object_url(object_key),
            )
        except ProfileNotFoundError as error:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found.",
            ) from error

        return self._profile_response(request, profile)

    def _static_url(self, request: Request, path: str) -> str:
        return str(request.url_for("static", path=path))

    def _image_url(self, request: Request, path: str | None) -> str | None:
        if path is None:
            return None

        if path.startswith(("http://", "https://")):
            return path

        return self._static_url(request, path)

    def _profile_response(self, request: Request, profile: ProfileRecord) -> GetProfile:
        return GetProfile(
            id=profile.id,
            name=profile.name,
            handle=profile.handle,
            avatar_url=self._image_url(request, profile.avatar_path),
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

        if clean_content_type not in AllowedAvatarContentTypes:
            raise HTTPException(
                status_code=400,
                detail="Avatar uploads must be JPEG, PNG, or WebP.",
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

    def _avatar_object_key(self, user_id: str, file_name: str) -> str:
        clean_name = PurePath(file_name).name.strip().replace(" ", "-")

        if not clean_name:
            clean_name = "avatar"

        return f"avatars/{user_id}/{uuid4()}-{clean_name}"

    def _object_url(self, object_key: str) -> str:
        if self.settings.s3_public_base_url:
            return f"{self.settings.s3_public_base_url.rstrip('/')}/{object_key}"

        return (
            f"https://{self.settings.aws_bucket_name}.s3."
            f"{self.settings.aws_region}.amazonaws.com/{object_key}"
        )
