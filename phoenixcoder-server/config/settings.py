from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OIDC_ISSUER: str = "https://example-oidc.com"
    OIDC_CLIENT_ID: str = "your-client-id"
    OIDC_CLIENT_SECRET: str = "your-client-secret"
    OIDC_REDIRECT_URI: str = "http://localhost:8001/auth/callback"
    JWT_SECRET: str = "your-jwt-secret"
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()