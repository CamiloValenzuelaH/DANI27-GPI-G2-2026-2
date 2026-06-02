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
    encryption_key: str
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    two_factor_issuer: str = "Dani27001"
    two_factor_setup_expire_minutes: int = 10
    two_factor_challenge_expire_minutes: int = 10
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_phone: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_use_tls: bool = True

    # Database
    database_url: str

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000"]
    
    # AI
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_validation_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-2"
    gemini_embedding_dimensions: int = 1536
    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek-chat"
    deepseek_base_url: str = "https://api.deepseek.com"

    # Validation queue / realtime state
    redis_url: str = "redis://redis:6379/0"
    validation_jobs_dir: str = "/shared/validation_jobs"
    iso_chunks_table: str = "iso_27001_chunks"
    validation_stream_poll_seconds: float = 1.0

    # Google
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""

    # Microsoft
    microsoft_client_id: str = ""
    microsoft_client_secret: str = ""
    microsoft_client_secret: str = ""
    microsoft_tenant_id: str = "common"
    microsoft_redirect_uri: str = ""

    # GitHub
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = ""

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()