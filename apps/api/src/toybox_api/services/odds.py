from urllib.parse import urlparse

import boto3
from fastapi import HTTPException

from toybox_api.config import Settings, get_settings
from toybox_api.models.odds import RecentCatch, RecentCatchOwner
from toybox_api.repositories.odds import OddsRepository, RecentCatchRecord

PresignedReadUrlTtlSeconds = 300


class OddsService:
    def __init__(
        self,
        settings: Settings | None = None,
        repository: OddsRepository | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.repository = repository or OddsRepository(self.settings)

    async def list_recent_catches(self) -> list[RecentCatch]:
        records = await self.repository.list_recent_catches()

        if not records:
            return []

        s3_client = None
        needs_s3_client = any(
            record.object_key or self._avatar_object_key_from_url(record.owner.avatar_url)
            for record in records
        )

        if needs_s3_client:
            self._validate_s3_settings()
            s3_client = self._s3_client()

        return [self._recent_catch_response(s3_client, record) for record in records]

    def _recent_catch_response(self, s3_client, record: RecentCatchRecord) -> RecentCatch:
        return RecentCatch(
            id=str(record.id),
            description=record.description,
            media_url=self._media_url(s3_client, record.object_key),
            tries=record.tries,
            cost_per_try=record.cost_per_try,
            caught=record.caught,
            created_at=record.created_at.isoformat(),
            owner=RecentCatchOwner(
                id=record.owner.id,
                name=record.owner.name,
                handle=f"@{record.owner.username}",
                avatar_url=self._avatar_url(s3_client, record.owner.avatar_url),
            ),
        )

    def _media_url(self, s3_client, object_key: str | None) -> str | None:
        if object_key is None:
            return None

        return self._presigned_object_url(s3_client, object_key)

    def _avatar_url(self, s3_client, avatar_url: str | None) -> str | None:
        object_key = self._avatar_object_key_from_url(avatar_url)

        if object_key is None:
            return avatar_url

        return self._presigned_object_url(s3_client, object_key)

    def _avatar_object_key_from_url(self, avatar_url: str | None) -> str | None:
        if avatar_url is None:
            return None

        if avatar_url.startswith("avatars/"):
            return avatar_url

        if not avatar_url.startswith(("http://", "https://")):
            return None

        parsed = urlparse(avatar_url)
        parsed_path = parsed.path.lstrip("/")

        if parsed_path.startswith("avatars/"):
            return parsed_path

        if self.settings.s3_public_base_url:
            public_base = urlparse(self.settings.s3_public_base_url.rstrip("/"))
            public_base_path = public_base.path.strip("/")

            if parsed.netloc == public_base.netloc and public_base_path:
                public_relative_path = parsed_path.removeprefix(f"{public_base_path}/")

                if public_relative_path.startswith("avatars/"):
                    return public_relative_path

        bucket_host = f"{self.settings.aws_bucket_name}.s3.{self.settings.aws_region}.amazonaws.com"

        if parsed.netloc == bucket_host and parsed_path.startswith("avatars/"):
            return parsed_path

        return None

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

    def _s3_client(self):
        return boto3.client(
            "s3",
            aws_access_key_id=self.settings.aws_access_key_id,
            aws_secret_access_key=self.settings.aws_secret_access_key,
            region_name=self.settings.aws_region,
            endpoint_url=self.settings.s3_endpoint_url or None,
        )

    def _presigned_object_url(self, s3_client, object_key: str) -> str:
        return s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": self.settings.aws_bucket_name,
                "Key": object_key,
            },
            ExpiresIn=PresignedReadUrlTtlSeconds,
        )
