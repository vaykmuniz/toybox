from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    api_name: str = "Toybox API"
    database_url: str = "postgresql://toybox:toybox@localhost:5432/toybox"
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_region: str | None = None
    aws_bucket_name: str | None = None
    s3_endpoint_url: str | None = None
    s3_public_base_url: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
