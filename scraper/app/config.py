import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    database_url: str = Field(default="", alias="DATABASE_URL")
    cluster_similarity_threshold: float = Field(0.30, alias="CLUSTER_SIMILARITY_THRESHOLD")
    cluster_time_window_days: int = Field(7, alias="CLUSTER_TIME_WINDOW_DAYS")
    request_timeout: int = Field(30, alias="REQUEST_TIMEOUT")
    user_agent: str = Field("NewsPulse/1.0", alias="USER_AGENT")
    log_level: str = Field("INFO", alias="LOG_LEVEL")

    # Fallback individual DB properties (provided by Render)
    db_host: str = Field(default="", alias="DB_HOST")
    db_port: str = Field(default="", alias="DB_PORT")
    db_name: str = Field(default="", alias="DB_NAME")
    db_user: str = Field(default="", alias="DB_USER")
    db_password: str = Field(default="", alias="DB_PASSWORD")

    @field_validator("database_url", mode="before")
    @classmethod
    def build_database_url(cls, v: str, info) -> str:
        if v:
            return v
        # Construct from individual properties if provided
        data = info.data
        host = data.get("db_host") or os.getenv("DB_HOST", "")
        port = data.get("db_port") or os.getenv("DB_PORT", "")
        name = data.get("db_name") or os.getenv("DB_NAME", "")
        user = data.get("db_user") or os.getenv("DB_USER", "")
        password = data.get("db_password") or os.getenv("DB_PASSWORD", "")
        if host and port and name and user and password:
            return f"postgresql://{user}:{password}@{host}:{port}/{name}"
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()