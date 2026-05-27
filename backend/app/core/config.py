from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "sqlite:///./resume_screener.db"
    secret_key: str = "dev-secret-key-change-in-production"
    access_token_expire_minutes: int = 1440

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    upload_dir: str = "uploads"
    max_upload_size_mb: int = 10

    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = ""
    mail_server: str = "smtp.gmail.com"
    mail_port: int = 587

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()