from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: str = "http://localhost:5173"
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "opportunity-finder/1.0"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
