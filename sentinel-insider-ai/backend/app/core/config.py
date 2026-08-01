from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sentinel Insider AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "SUPER_SECRET_KEY_FOR_HACKATHON"  # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "sentinel_db"
    REDIS_URI: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"

settings = Settings()
