from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    api_name: str = "Toybox API"
    database_url: str = "postgresql://toybox:toybox@localhost:5432/toybox"
    api_public_url: str = "http://localhost:8000"
    resend_api_key: str = ""
    resend_from_email: str = "onboarding@resend.dev"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
