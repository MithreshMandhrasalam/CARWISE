# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 11: Fair-Market Valuation API Router
# Exposes POST /api/v1/valuation/evaluate
# ═══════════════════════════════════════════════════════════════

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.valuation_service import (
    VehicleValuationEngine,
    VehicleValuationReport,
)

router = APIRouter()


class ValuationEvaluateRequest(BaseModel):
    inspectionId: Optional[str] = None
    vehicleInfo: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Vehicle specifications including make, model, year, mileageKm, askingPrice",
    )
    conditionScore: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Phase 8 condition score container",
    )
    trustScore: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Phase 9 trust score container",
    )
    repairCostAssessment: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Phase 10 repair cost assessment container",
    )


@router.post("/evaluate", response_model=VehicleValuationReport)
async def evaluate_vehicle_valuation(request: ValuationEvaluateRequest):
    """
    Evaluates fair-market value range (INR) and compares asking price against evidence-adjusted benchmarks.
    """
    try:
        report = VehicleValuationEngine.evaluate_valuation(
            vehicle_info=request.vehicleInfo,
            condition_score=request.conditionScore,
            trust_score=request.trustScore,
            repair_cost_assessment=request.repairCostAssessment,
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vehicle valuation evaluation failed: {str(e)}")
