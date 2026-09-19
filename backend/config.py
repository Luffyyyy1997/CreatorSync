"""
Application settings loaded from environment variables.
Uses pydantic-settings for automatic .env file loading.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyUrl


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Core security
    SECRET_KEY: str = "dev_secret_change_me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Fernet key for encrypting OAuth tokens at rest
    FERNET_KEY: str = "change_me_generate_a_fernet_key"

    # Database
    DATABASE_URL: str = "sqlite:///./creator_sync.db"

    # OpenAI
    OPENAI_API_KEY: str = ""

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Environment
    ENV: str = "development"

    # Platform OAuth credentials
    TWITTER_CLIENT_ID: str = ""
    TWITTER_CLIENT_SECRET: str = ""

    INSTAGRAM_CLIENT_ID: str = ""
    INSTAGRAM_CLIENT_SECRET: str = ""

    YOUTUBE_CLIENT_ID: str = ""
    YOUTUBE_CLIENT_SECRET: str = ""

    TIKTOK_CLIENT_ID: str = ""
    TIKTOK_CLIENT_SECRET: str = ""


settings = Settings()
