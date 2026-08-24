# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 12: End-to-End Assessment Orchestration Engine
# Coordinates IQA, CV Detection, Evidence Reasoning, Trust, Repair, & Valuation
# ═══════════════════════════════════════════════════════════════

import time
import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.services.iqa_service import assess_single_image, assess_batch_images, IQAResult
from app.services.evidence_reasoning_service import EvidenceAssessmentService, EvidenceAssessmentReport
from app.services.trust_score_service import TrustScoreEngine, FullAssessmentTrustReport
from app.services.repair_cost_service import RepairCostEstimationEngine, RepairCostAssessmentReport
from app.services.valuation_service import VehicleValuationEngine, VehicleValuationReport


# ── Schemas ─────────────────────────────────────────────────────────────────────

class PipelineExecutionTiming(BaseModel):
    iqaTimeMs: float = 0.0
    damageDetectionTimeMs: float = 0.0
    evidenceReasoningTimeMs: float = 0.0
    trustScoringTimeMs: float = 0.0
    repairCostTimeMs: float = 0.0
    valuationTimeMs: float = 0.0
    totalOrchestrationTimeMs: float = 0.0


class ComponentVersions(BaseModel):
    iqa: str = "IQA_V1"
    cvDetector: str = "CV_BASELINE_V1"
    evidenceReasoning: str = "EVIDENCE_V1"
    conditionScore: str = "CONDITION_V1"
    trustScore: str = "TRUST_V1"
    repairCost: str = "REPAIR_V1"
    marketValuation: str = "VALUATION_V1"


class ConsolidatedBuyerAssessment(BaseModel):
    assessmentVersion: str = "CARWISE_ASSESSMENT_V1"
    assessmentId: str = Field(default_factory=lambda: f"ass-{uuid.uuid4().hex[:12]}")
    inspectionId: Optional[str] = None
    overallStatus: str  # COMPLETED, LIMITED_ASSESSMENT, INSUFFICIENT_EVIDENCE, FAILED
    componentVersions: ComponentVersions = Field(default_factory=ComponentVersions)
    vehicleInfo: Dict[str, Any]
    iqaSummary: Dict[str, Any]
    damageDetectionsSummary: Dict[str, Any]
    conditionScore: Dict[str, Any]
    evidenceCompleteness: Dict[str, Any]
    blindspots: List[Dict[str, Any]]
    buyerTrustScore: Dict[str, Any]
    repairCostAssessment: Dict[str, Any]
    priceValuation: Dict[str, Any]
    executiveVerdict: Dict[str, Any]
    limitations: List[str]
    timings: PipelineExecutionTiming
    analyzedAt: str = Field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))


# ═══════════════════════════════════════════════════════════════
# Assessment Orchestrator
# ═══════════════════════════════════════════════════════════════

class AssessmentOrchestrator:
    """
    Executes the complete deterministic CARWISE assessment pipeline in strict sequence:
    Image Ingestion -> IQA -> CV Detection -> Evidence Reasoning -> Trust -> Repair -> Valuation.
    """

    @classmethod
    def orchestrate_assessment(
        cls,
        inspection_id: Optional[str] = None,
        vehicle_info: Optional[Dict[str, Any]] = None,
        images: Optional[List[Dict[str, Any]]] = None,
        damage_detections: Optional[List[Dict[str, Any]]] = None,
        region_tier: str = "TIER_2",
    ) -> ConsolidatedBuyerAssessment:
        t_start = time.perf_counter()
        vinfo = vehicle_info or {}
        img_list = images or []
        det_list = damage_detections or []

        timings = PipelineExecutionTiming()

        # ── 1. Image Quality Assessment (IQA) Step ────────────────────────────
        t_iqa_start = time.perf_counter()
        iqa_pass_count = 0
        iqa_warn_count = 0
        iqa_fail_count = 0

        for img in img_list:
            status = img.get("qualityStatus", "PASS")
            if status == "PASS":
                iqa_pass_count += 1
            elif status == "WARN":
                iqa_warn_count += 1
            else:
                iqa_fail_count += 1

        timings.iqaTimeMs = round((time.perf_counter() - t_iqa_start) * 1000, 2)

        iqa_summary = {
            "totalImages": len(img_list),
            "passCount": iqa_pass_count,
            "warnCount": iqa_warn_count,
            "failCount": iqa_fail_count,
            "allPassed": iqa_fail_count == 0 and len(img_list) > 0,
        }

        # ── 2. Computer Vision Damage Detections Summary ──────────────────────
        t_cv_start = time.perf_counter()
        total_detections_count = 0
        valid_perspectives = []

        for d in det_list:
            dets = d.get("detections", [])
            total_detections_count += len(dets)
            if d.get("viewType"):
                valid_perspectives.append(d["viewType"])

        timings.damageDetectionTimeMs = round((time.perf_counter() - t_cv_start) * 1000, 2)

        cv_summary = {
            "perspectivesEvaluated": len(det_list),
            "totalRawDetections": total_detections_count,
            "modelVersion": "YOLO11s-CarDD-v1",
        }

        # ── 3. Evidence Reasoning Step (Phase 8) ──────────────────────────────
        t_ev_start = time.perf_counter()
        submitted_views = [img.get("viewType") for img in img_list if img.get("viewType")]
        evidence_report = EvidenceAssessmentService.evaluate_inspection_evidence(
            raw_damage_results=det_list,
            submitted_views=submitted_views,
        )
        timings.evidenceReasoningTimeMs = round((time.perf_counter() - t_ev_start) * 1000, 2)

        evidence_dict = evidence_report.model_dump()
        condition_score_dict = evidence_dict.get("conditionScore", {})

        # ── 4. Evidence Completeness & Buyer Trust Score Step (Phase 9) ───────
        t_trust_start = time.perf_counter()
        trust_report = TrustScoreEngine.evaluate_trust(
            submitted_images=img_list,
            evidence_assessment=evidence_dict,
        )
        timings.trustScoringTimeMs = round((time.perf_counter() - t_trust_start) * 1000, 2)

        trust_dict = trust_report.model_dump()
        evidence_completeness_dict = trust_dict.get("evidenceCompleteness", {})
        blindspots_list = evidence_completeness_dict.get("blindspots", [])
        buyer_trust_dict = trust_dict.get("trustScore", {})

        # ── 5. Repair Cost Estimation Step (Phase 10) ─────────────────────────
        t_rep_start = time.perf_counter()
        repair_report = RepairCostEstimationEngine.estimate_repair_cost(
            evidence_assessment=evidence_dict,
            vehicle_info=vinfo,
            region_tier=region_tier,
        )
        timings.repairCostTimeMs = round((time.perf_counter() - t_rep_start) * 1000, 2)

        repair_dict = repair_report.model_dump()

        # ── 6. Fair-Market Vehicle Valuation Step (Phase 11) ───────────────────
        t_val_start = time.perf_counter()
        valuation_report = VehicleValuationEngine.evaluate_valuation(
            vehicle_info=vinfo,
            condition_score=condition_score_dict,
            trust_score=buyer_trust_dict,
            repair_cost_assessment=repair_dict,
        )
        timings.valuationTimeMs = round((time.perf_counter() - t_val_start) * 1000, 2)

        valuation_dict = valuation_report.model_dump()

        # ── 7. Overall Assessment Status & Executive Verdict ──────────────────
        raw_trust = buyer_trust_dict.get("trustScore")
        trust_band = buyer_trust_dict.get("trustBand", "INSUFFICIENT_EVIDENCE")

        if len(img_list) == 0 or raw_trust is None or raw_trust < 50:
            overall_status = "INSUFFICIENT_EVIDENCE"
            verdict = {
                "verdictCode": "INSUFFICIENT_EVIDENCE",
                "badgeVariant": "danger",
                "title": "Evidence Insufficient for Purchase Recommendation",
                "recommendation": "Do not proceed with financial commitment based solely on visual records. Upload missing mandatory perspective photos.",
            }
        elif trust_band == "PROCEED_WITH_CAUTION" or buyer_trust_dict.get("capsApplied"):
            overall_status = "LIMITED_ASSESSMENT"
            verdict = {
                "verdictCode": "PROCEED_WITH_CAUTION",
                "badgeVariant": "warning",
                "title": "Proceed with Hands-On Physical Verification",
                "recommendation": "Vehicle visual evidence is partially complete. Review identified cosmetic defects and perspective blindspots before finalizing purchase.",
            }
        else:
            overall_status = "COMPLETED"
            verdict = {
                "verdictCode": "READY_FOR_DECISION",
                "badgeVariant": "success",
                "title": "Assessment Complete — High Evidence Reliability",
                "recommendation": "High confidence photographic audit complete. Fair market range and repair burdens are well-characterized.",
            }

        # ── 8. Global Disclaimers & Non-Claims ─────────────────────────────────
        global_limitations = [
            "Visual evidence requiring physical verification: CARWISE evaluates observable surface flaws and photographic completeness.",
            "Structural chassis alignment, sub-surface corrosion, mechanical powertrain health, and electrical harnesses cannot be diagnosed from photographs.",
            "Vehicle valuation and repair ranges reflect academic market benchmarks in India (2026); actual dealer quotes and RTO transfer costs vary.",
        ]

        timings.totalOrchestrationTimeMs = round((time.perf_counter() - t_start) * 1000, 2)

        return ConsolidatedBuyerAssessment(
            assessmentVersion="CARWISE_ASSESSMENT_V1",
            inspectionId=inspection_id,
            overallStatus=overall_status,
            componentVersions=ComponentVersions(),
            vehicleInfo=vinfo,
            iqaSummary=iqa_summary,
            damageDetectionsSummary=cv_summary,
            conditionScore=condition_score_dict,
            evidenceCompleteness=evidence_completeness_dict,
            blindspots=blindspots_list,
            buyerTrustScore=buyer_trust_dict,
            repairCostAssessment=repair_dict,
            priceValuation=valuation_dict,
            executiveVerdict=verdict,
            limitations=global_limitations,
            timings=timings,
        )
