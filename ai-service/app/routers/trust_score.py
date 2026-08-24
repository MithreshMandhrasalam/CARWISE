# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 9: Buyer Assessment Trust API Router
# Exposes POST /api/v1/trust/analyze
# ═══════════════════════════════════════════════════════════════

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.trust_score_service import (
    TrustScoreEngine,
    FullAssessmentTrustReport,
)

router = APIRouter()


class TrustAnalysisRequest(BaseModel):
    inspectionId: Optional[str] = None
    submittedImages: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of submitted image objects with viewType, qualityStatus, qualityScore",
    )
    evidenceAssessment: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Phase 8 evidence assessment report containing normalized findings and zones",
    )


@router.post("/analyze", response_model=FullAssessmentTrustReport)
async def analyze_trust(request: TrustAnalysisRequest):
    """
    Computes Evidence Completeness Index, Evidence Reliability Score,
    Model Confidence Aggregation, and the Buyer Assessment Trust Score V1.
    """
    try:
        report = TrustScoreEngine.evaluate_trust(
            submitted_images=request.submittedImages,
            evidence_assessment=request.evidenceAssessment,
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trust score evaluation failed: {str(e)}")
