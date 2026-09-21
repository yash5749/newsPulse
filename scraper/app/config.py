import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    database_url: str = Field(..., alias="DATABASE_URL")
    cluster_similarity_threshold: float = Field(0.30, alias="CLUSTER_SIMILARITY_THRESHOLD")
    cluster_time_window_days: int = Field(7, alias="CLUSTER_TIME_WINDOW_DAYS")
    request_timeout: int = Field(30, alias="REQUEST_TIMEOUT")
    user_agent: str = Field("NewsPulse/1.0", alias="USER_AGENT")
    log_level: str = Field("INFO", alias="LOG_LEVEL")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()