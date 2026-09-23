from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmritiSetu NER Cloud"
    API_V1_STR: str = "/api/v1"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "smritisetu"
    SQLALCHEMY_DATABASE_URI: str = "sqlite+aiosqlite:///./test.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    TWILIO_API_KEY: str = ""
    MOCK_SMS: bool = True
    MAX_DELTA_PAYLOAD_BYTES: int = 51200
    JWT_SECRET: str = "smritisetu-ner-supersecret-jwt-key-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    @model_validator(mode='after')
    def parse_db_uri(self):
        uri = self.SQLALCHEMY_DATABASE_URI
        if uri.startswith("postgres://"):
            uri = uri.replace("postgres://", "postgresql+asyncpg://", 1)
        elif uri.startswith("postgresql://"):
            uri = uri.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        if "?" in uri:
            base, query = uri.split("?", 1)
            params = [p for p in query.split("&") if not p.startswith("sslmode=")]
            uri = f"{base}?{'&'.join(params)}" if params else base
            
        self.SQLALCHEMY_DATABASE_URI = uri
        return self

settings = Settings()
