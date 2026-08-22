from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.config import settings
from app.ml.mock.mock_price import estimate_price_mock

router = APIRouter()


class PriceEstimateRequest(BaseModel):
    make: str
    model: str
    variant: Optional[str] = ""
    year: int
    fuelType: str
    transmission: str
    mileageKm: int
    askingPrice: float
    location: Optional[str] = ""


@router.post("/estimate")
async def estimate_price(request: PriceEstimateRequest):
    """
    Estimate market price range for a used vehicle.

    When AI_SERVICE_USE_MOCK=true, uses heuristic mock estimation.
    When AI_SERVICE_USE_MOCK=false, runs the real XGBoost model.
    """
    vehicle_info = request.dict()

    if settings.ai_service_use_mock:
        result = estimate_price_mock(vehicle_info)
    else:
        try:
            from app.ml.price_model import estimate_price_real
            result = estimate_price_real(vehicle_info)
        except ImportError:
            raise HTTPException(
                status_code=503,
                detail="Real price model not available. Set AI_SERVICE_USE_MOCK=true for development.",
            )

    return result
