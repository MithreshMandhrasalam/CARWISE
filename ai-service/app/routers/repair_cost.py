# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 10: Repair Cost Estimation API Router
# Exposes POST /api/v1/repair/estimate
# ═══════════════════════════════════════════════════════════════

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.repair_cost_service import (
    RepairCostEstimationEngine,
    RepairCostAssessmentReport,
)

router = APIRouter()


class RepairCostEstimateRequest(BaseModel):
    inspectionId: Optional[str] = None
    evidenceAssessment: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Phase 8 evidence assessment report containing normalized findings and zones",
    )
    vehicleInfo: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Vehicle specifications including make, model, year, and bodyType",
    )
    regionTier: Optional[str] = Field(
        default="TIER_2",
        description="Regional labor tier: TIER_1_METRO, TIER_2, or TIER_3_RURAL",
    )


@router.post("/estimate", response_model=RepairCostAssessmentReport)
async def estimate_repair_cost(request: RepairCostEstimateRequest):
    """
    Computes itemized and aggregated repair cost ranges (INR) based on normalized
    damage findings, vehicle segment, regional labor rates, and panel complexity.
    """
    try:
        report = RepairCostEstimationEngine.estimate_repair_cost(
            evidence_assessment=request.evidenceAssessment,
            vehicle_info=request.vehicleInfo,
            region_tier=request.regionTier or "TIER_2",
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Repair cost estimation failed: {str(e)}")
