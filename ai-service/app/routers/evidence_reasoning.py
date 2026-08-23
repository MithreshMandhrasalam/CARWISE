# ═══════════════════════════════════════════════════════════════
# CARWISE — Evidence Reasoning API Router (Phase 8)
# Exposes POST /api/v1/evidence/analyze
# ═══════════════════════════════════════════════════════════════

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.evidence_reasoning_service import (
    EvidenceAssessmentService,
    EvidenceAssessmentReport,
)

router = APIRouter()


class EvidenceAnalysisRequest(BaseModel):
    inspectionId: Optional[str] = None
    damageResults: List[Dict[str, Any]] = Field(default_factory=list, description="Raw damage detection results from BaseDamageDetector")
    submittedViews: Optional[List[str]] = Field(default_factory=list, description="List of all submitted vehicle perspective views")


@router.post("/analyze", response_model=EvidenceAssessmentReport)
async def analyze_evidence(request: EvidenceAnalysisRequest):
    """
    Transforms raw computer vision damage detections into normalized, zone-mapped,
    and deterministically evaluated vehicle evidence with condition scoring.
    """
    try:
        report = EvidenceAssessmentService.evaluate_inspection_evidence(
            raw_damage_results=request.damageResults,
            submitted_views=request.submittedViews,
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evidence reasoning analysis failed: {str(e)}")
