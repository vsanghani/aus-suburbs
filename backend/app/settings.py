from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Process environment only. A local .env file is loaded by the Makefile, not here."""

    model_config = SettingsConfigDict(extra="ignore")

    app_env: str = "development"
    app_version: str = "0.1.0"
    database_url: str | None = None
    redis_url: str | None = None
    cors_origins: str = "http://localhost:5173,http://localhost:4173,http://localhost:8080"
    contracts_dir: str | None = None
    log_level: str = "info"

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
