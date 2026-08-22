"""
Price Service — delegates to mock or real XGBoost model.
"""
from app.config import settings
from app.ml.mock.mock_price import estimate_price_mock


def estimate_price(vehicle_info: dict) -> dict:
    if settings.ai_service_use_mock:
        return estimate_price_mock(vehicle_info)

    from app.ml.price_model import estimate_price_real  # noqa: PLC0415
    return estimate_price_real(vehicle_info)
