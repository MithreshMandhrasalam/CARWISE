# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 12: Assessment Orchestrator Router
# Exposes POST /api/v1/assessment/orchestrate
# ═══════════════════════════════════════════════════════════════

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.assessment_orchestrator import (
    AssessmentOrchestrator,
    ConsolidatedBuyerAssessment,
)

router = APIRouter()


class AssessmentOrchestrationRequest(BaseModel):
    inspectionId: Optional[str] = None
    vehicleInfo: Optional[Dict[str, Any]] = Field(default_factory=dict)
    images: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    damageDetections: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    regionTier: Optional[str] = "TIER_2"


@router.post("/orchestrate", response_model=ConsolidatedBuyerAssessment)
@router.post("/evaluate", response_model=ConsolidatedBuyerAssessment)
async def orchestrate_full_assessment(request: AssessmentOrchestrationRequest):
    """
    Executes the entire end-to-end analytical assessment pipeline in strict sequence:
    IQA -> CV Detections -> Evidence Reasoning -> Trust Scoring -> Repair Cost -> Fair-Market Valuation.
    """
    try:
        report = AssessmentOrchestrator.orchestrate_assessment(
            inspection_id=request.inspectionId,
            vehicle_info=request.vehicleInfo,
            images=request.images,
            damage_detections=request.damageDetections,
            region_tier=request.regionTier or "TIER_2",
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment orchestration failed: {str(e)}")
