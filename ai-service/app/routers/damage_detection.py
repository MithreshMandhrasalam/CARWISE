from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.config import settings
from app.ml.mock.mock_damage import detect_damage_mock

router = APIRouter()


class ImageInput(BaseModel):
    angle: str
    url: str


class DamageDetectRequest(BaseModel):
    images: List[ImageInput]


@router.post("/detect")
async def detect_damage(request: DamageDetectRequest):
    """
    Detect visible damage in provided vehicle images.

    When AI_SERVICE_USE_MOCK=true, returns clearly labeled mock data.
    When AI_SERVICE_USE_MOCK=false, runs the real YOLOv8 model.
    """
    if not request.images:
        raise HTTPException(status_code=400, detail="At least one image is required.")

    images = [img.dict() for img in request.images]

    if settings.ai_service_use_mock:
        result = detect_damage_mock(images)
    else:
        try:
            from app.ml.damage_detector import detect_damage_real
            result = detect_damage_real(images)
        except ImportError:
            raise HTTPException(
                status_code=503,
                detail="Real damage model not available. Set AI_SERVICE_USE_MOCK=true for development.",
            )

    return result
