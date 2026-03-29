from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    S3_ENDPOINT: str = ""
    S3_BUCKET: str = "taxmind-uploads"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"
    RAZORPAY_KEY: str = ""
    RAZORPAY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""
    GST_API_BASE: str = ""
    GST_APP_KEY: str = ""
    TALLY_URL: str = "http://localhost:9000"
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@taxmind.in"

    class Config:
        env_file = ".env"

settings = Settings()
