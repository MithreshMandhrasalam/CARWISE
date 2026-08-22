from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_service_use_mock: bool = True
    ai_service_port: int = 8000
    ai_service_host: str = "0.0.0.0"

    damage_model_version: str = "mock-v0.1"
    price_model_version: str = "mock-v0.1"
    score_model_version: str = "rule-v1.0"

    damage_model_weights: str = "app/ml/weights/damage_yolov8.pt"
    price_model_weights: str = "app/ml/weights/price_xgboost.json"

    log_level: str = "info"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
