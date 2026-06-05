from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class MigrationSettings(BaseSettings):
    database_url: str = "postgresql://toybox:toybox@localhost:5432/toybox"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> MigrationSettings:
    return MigrationSettings()
