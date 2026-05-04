from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    app_env: str = "development"
    app_name: str = "Dani27001"
    secret_key: str
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Database
    database_url: str

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000"]
    
    # AI
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()