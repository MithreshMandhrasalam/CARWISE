from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from app.services.score_service import compute_condition_score
from app.services.assessment_service import generate_final_assessment

router = APIRouter()


class VehicleInfoIn(BaseModel):
    make: str
    model: str
    year: int
    fuelType: str
    transmission: str
    mileageKm: int
    askingPrice: float
    location: Optional[str] = ""
    variant: Optional[str] = ""


class ScoreRequest(BaseModel):
    vehicleInfo: VehicleInfoIn
    damageResult: dict


class AssessmentRequest(BaseModel):
    vehicleInfo: VehicleInfoIn
    damageResult: dict
    priceResult: dict
    scoreResult: dict


@router.post("/compute")
async def compute_score(request: ScoreRequest):
    """Compute the explainable 0-100 condition score."""
    result = compute_condition_score(
        request.vehicleInfo.dict(),
        request.damageResult,
        {},  # price result not needed for scoring — pass empty
    )
    return result


@router.post("/assessment/generate")
async def generate_assessment(request: AssessmentRequest):
    """Generate the final trust assessment and inspection checklist."""
    result = generate_final_assessment(
        request.vehicleInfo.dict(),
        request.damageResult,
        request.priceResult,
        request.scoreResult,
    )
    return result
