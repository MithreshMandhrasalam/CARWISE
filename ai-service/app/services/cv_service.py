"""
CV Service — delegates to mock or real damage detection.
The router calls this service; the service handles the mock/real switch.
"""
from app.config import settings
from app.ml.mock.mock_damage import detect_damage_mock


def detect_damage(images: list) -> dict:
    if settings.ai_service_use_mock:
        return detect_damage_mock(images)

    # Real model path — loaded lazily when first needed
    from app.ml.damage_detector import detect_damage_real  # noqa: PLC0415
    return detect_damage_real(images)
