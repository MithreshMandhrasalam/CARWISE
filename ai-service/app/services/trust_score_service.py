# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 9: Evidence Completeness & Buyer Assessment Trust Engine
# Deterministic Buyer Decision-Support Layer
# ═══════════════════════════════════════════════════════════════

from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field


# ── Centralized Configuration ───────────────────────────────────────────────────
TRUST_V1_CONFIG = {
    "mandatoryWeight": 0.70,
    "optionalWeight": 0.30,
    "mandatoryViews": ["FRONT", "REAR", "LEFT", "RIGHT"],
    "optionalViews": [
        "FRONT_LEFT",
        "FRONT_RIGHT",
        "REAR_LEFT",
        "REAR_RIGHT",
        "INTERIOR",
        "DASHBOARD",
        "ENGINE_BAY",
        "TYRES",
    ],
    "reliabilityWeights": {
        "evidenceCompleteness": 0.35,
        "iqaReliability": 0.25,
        "modelConfidence": 0.25,
        "crossViewConsistency": 0.15,
    },
    "trustCaps": {
        "oneMandatoryMissing": 69,
        "twoOrMoreMandatoryMissing": 49,
        "multipleIqaFailures": 59,
    },
    "trustBands": {
        "HIGH_CONFIDENCE": 80,
        "MODERATE_CONFIDENCE": 65,
        "PROCEED_WITH_CAUTION": 50,
    },
}


# ── Schemas ─────────────────────────────────────────────────────────────────────

class ViewQualityRecord(BaseModel):
    viewType: str
    submitted: bool
    usable: bool
    iqaStatus: str  # PASS, WARN, FAIL, NOT_SUBMITTED
    qualityScore: float  # 0 to 100
    isDuplicate: bool = False
    coverageContribution: float  # 0.0 to 1.0
    reason: Optional[str] = None


class BlindspotItem(BaseModel):
    type: str  # MISSING_MANDATORY_VIEW, MISSING_OPTIONAL_VIEW, IQA_FAIL_VIEW, DUPLICATE_VIEW, LOW_QUALITY_VIEW
    viewType: str
    severity: str  # HIGH, MEDIUM, LOW
    message: str


class TrustScoreComponents(BaseModel):
    evidenceCompleteness: float  # 0.0 to 1.0
    iqaReliability: float  # 0.0 to 1.0
    modelConfidence: float  # 0.0 to 1.0
    crossViewConsistency: float  # 0.0 to 1.0


class TrustScoreReport(BaseModel):
    trustScore: Optional[int] = None
    trustBand: str  # HIGH_CONFIDENCE, MODERATE_CONFIDENCE, PROCEED_WITH_CAUTION, INSUFFICIENT_EVIDENCE
    status: str  # READY_FOR_ASSESSMENT, LIMITED_ASSESSMENT, INSUFFICIENT_EVIDENCE, PROCESSING, FAILED
    formulaVersion: str = "TRUST_V1"
    components: TrustScoreComponents
    rawReliabilityScore: float
    capsApplied: List[str]
    explanation: str
    limitations: List[str]


class EvidenceCompletenessReport(BaseModel):
    mandatoryCoverage: float  # 0.0 to 1.0
    optionalCoverage: float  # 0.0 to 1.0
    mandatoryDisclosureRatio: float  # e.g. 4/4 = 1.0
    overallDisclosureRatio: float  # e.g. 8/12 = 0.67
    coverageScore: float  # 0.0 to 1.0 (0.7*mand + 0.3*opt)
    usableImageCount: int
    submittedImageCount: int
    mandatoryViewsComplete: bool
    viewQuality: List[ViewQualityRecord]
    blindspots: List[BlindspotItem]


class FullAssessmentTrustReport(BaseModel):
    version: str = "TRUST_V1"
    assessmentStatus: str
    evidenceCompleteness: EvidenceCompletenessReport
    trustScore: TrustScoreReport
    conditionScoreStatus: Optional[str] = "CALCULATED"
    modelConfidenceStatus: str
    limitations: List[str]


# ═══════════════════════════════════════════════════════════════════════════════
# Engine Implementations
# ═══════════════════════════════════════════════════════════════════════════════

class EvidenceCompletenessEngine:
    """Calculates granular perspective coverage and identifies usability."""

    @staticmethod
    def evaluate_completeness(
        submitted_images: List[Dict[str, Any]],
        damage_detections: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[EvidenceCompletenessReport, List[BlindspotItem]]:
        mandatory_views = TRUST_V1_CONFIG["mandatoryViews"]
        optional_views = TRUST_V1_CONFIG["optionalViews"]
        all_expected_views = mandatory_views + optional_views

        view_records: List[ViewQualityRecord] = []
        blindspots: List[BlindspotItem] = []

        submitted_map: Dict[str, Dict[str, Any]] = {}
        for img in submitted_images:
            vt = (img.get("viewType") or "UNKNOWN").upper()
            submitted_map[vt] = img

        usable_mandatory = 0
        usable_optional = 0
        usable_total = 0
        iqa_fail_count = 0

        for vt in all_expected_views:
            is_mand = vt in mandatory_views
            if vt in submitted_map:
                img_data = submitted_map[vt]
                iqa_status = img_data.get("qualityStatus") or img_data.get("iqaStatus") or "PASS"
                iqa_score = float(img_data.get("qualityScore", 85.0))
                is_dup = bool(img_data.get("isDuplicate", False))

                if iqa_status == "FAIL":
                    usable = False
                    contrib = 0.0
                    iqa_fail_count += 1
                    reason = "Unusable due to failed Image Quality Assessment (blur, exposure, or corruption)"
                    blindspots.append(
                        BlindspotItem(
                            type="IQA_FAIL_VIEW",
                            viewType=vt,
                            severity="HIGH" if is_mand else "MEDIUM",
                            message=f"{vt} photograph failed quality checks and cannot be used for damage evaluation.",
                        )
                    )
                elif is_dup:
                    usable = False
                    contrib = 0.0
                    reason = "Duplicate perspective provides no independent evidence"
                    blindspots.append(
                        BlindspotItem(
                            type="DUPLICATE_VIEW",
                            viewType=vt,
                            severity="MEDIUM" if is_mand else "LOW",
                            message=f"{vt} is a duplicate photograph and does not contribute to perspective coverage.",
                        )
                    )
                else:
                    usable = True
                    usable_total += 1
                    # Quality contribution factor
                    if iqa_status == "WARN":
                        contrib = 0.70
                        reason = "Usable with quality warning (sub-optimal sharpness/contrast)"
                        blindspots.append(
                            BlindspotItem(
                                type="LOW_QUALITY_VIEW",
                                viewType=vt,
                                severity="LOW",
                                message=f"{vt} has sub-optimal sharpness or contrast.",
                            )
                        )
                    else:
                        contrib = 1.0
                        reason = "Fully usable with optimal image quality"

                    if is_mand:
                        usable_mandatory += 1
                    else:
                        usable_optional += 1

                view_records.append(
                    ViewQualityRecord(
                        viewType=vt,
                        submitted=True,
                        usable=usable,
                        iqaStatus=iqa_status,
                        qualityScore=iqa_score,
                        isDuplicate=is_dup,
                        coverageContribution=contrib,
                        reason=reason,
                    )
                )
            else:
                # Missing view
                view_records.append(
                    ViewQualityRecord(
                        viewType=vt,
                        submitted=False,
                        usable=False,
                        iqaStatus="NOT_SUBMITTED",
                        qualityScore=0.0,
                        isDuplicate=False,
                        coverageContribution=0.0,
                        reason="Photograph not provided",
                    )
                )
                blindspots.append(
                    BlindspotItem(
                        type="MISSING_MANDATORY_VIEW" if is_mand else "MISSING_OPTIONAL_VIEW",
                        viewType=vt,
                        severity="HIGH" if is_mand else "LOW",
                        message=(
                            f"{vt} perspective is missing. Flaws on this section cannot be evaluated visually."
                            if is_mand
                            else f"Optional {vt} perspective was not provided."
                        ),
                    )
                )

        c_mandatory = usable_mandatory / 4.0
        c_optional = usable_optional / 8.0
        c_evidence = round(
            min(1.0, max(0.0, TRUST_V1_CONFIG["mandatoryWeight"] * c_mandatory + TRUST_V1_CONFIG["optionalWeight"] * c_optional)),
            4,
        )

        mandatory_complete = usable_mandatory == 4

        completeness_report = EvidenceCompletenessReport(
            mandatoryCoverage=round(c_mandatory, 4),
            optionalCoverage=round(c_optional, 4),
            mandatoryDisclosureRatio=round(usable_mandatory / 4.0, 4),
            overallDisclosureRatio=round(usable_total / 12.0, 4),
            coverageScore=c_evidence,
            usableImageCount=usable_total,
            submittedImageCount=len(submitted_images),
            mandatoryViewsComplete=mandatory_complete,
            viewQuality=view_records,
            blindspots=blindspots,
        )

        return completeness_report, blindspots


class ModelConfidenceEngine:
    """Aggregates CV detection confidence and handles zero-detection distinction."""

    @staticmethod
    def aggregate_confidence(
        findings: List[Dict[str, Any]],
        usable_image_count: int,
        iqa_avg_score: float,
    ) -> Tuple[float, str]:
        usable_findings = [f for f in findings if not f.get("isDuplicateEvidence", False)]

        if not usable_findings:
            if usable_image_count >= 4 and iqa_avg_score >= 70.0:
                # Clean vehicle with high quality evidence
                return 0.90, "NO_VISIBLE_DAMAGE_DETECTED"
            elif usable_image_count > 0:
                # Sub-optimal evidence with no detections
                return 0.55, "UNABLE_TO_ESTABLISH_ABSENCE_DUE_TO_COVERAGE"
            else:
                return 0.0, "NO_USABLE_EVIDENCE"

        weighted_conf_sum = 0.0
        total_weight = 0.0

        for f in usable_findings:
            band = f.get("confidenceBand", "POTENTIAL")
            conf = float(f.get("modelConfidence", 0.5))

            if band == "HIGH_CONFIDENCE":
                weight = 1.0
            elif band == "POTENTIAL":
                weight = 0.5
            else:
                continue  # Suppressed

            weighted_conf_sum += weight * conf
            total_weight += weight

        if total_weight <= 0.0:
            return 0.50, "NO_NON_SUPPRESSED_DETECTIONS"

        c_model = round(weighted_conf_sum / total_weight, 4)
        return min(1.0, max(0.0, c_model)), "CONFIDENCE_AGGREGATED"


class CrossViewConsistencyEngine:
    """Evaluates multi-perspective coherence and corroboration."""

    @staticmethod
    def compute_consistency(
        cross_view_observations: List[Dict[str, Any]],
        findings: List[Dict[str, Any]],
        usable_image_count: int,
    ) -> float:
        if usable_image_count <= 0:
            return 0.0
        if usable_image_count == 1:
            return 0.50  # Single view cannot have multi-view corroboration

        usable_findings = [f for f in findings if not f.get("isDuplicateEvidence", False)]

        if not usable_findings:
            # Clean multi-view vehicle
            return 0.90 if usable_image_count >= 4 else 0.75

        # Check corroboration
        if len(cross_view_observations) > 0:
            # Multi-angle corroboration observed
            return 0.95
        elif len(usable_findings) == 1:
            # Isolated single finding across multi-views
            return 0.80
        else:
            # Multiple findings in disparate zones without contradiction
            return 0.85


class EvidenceReliabilityEngine:
    """Calculates overall evidence reliability R_evidence."""

    @staticmethod
    def calculate_reliability(
        c_evidence: float,
        r_iqa: float,
        c_model: float,
        cross_view_consistency: float,
    ) -> float:
        weights = TRUST_V1_CONFIG["reliabilityWeights"]
        r_evidence = (
            weights["evidenceCompleteness"] * c_evidence
            + weights["iqaReliability"] * r_iqa
            + weights["modelConfidence"] * c_model
            + weights["crossViewConsistency"] * cross_view_consistency
        )
        return round(min(1.0, max(0.0, r_evidence)), 4)


class TrustBandEngine:
    """Assigns explainable trust confidence bands."""

    @staticmethod
    def get_band(score: Optional[int], usable_images: int, mandatory_complete: bool) -> str:
        if score is None or usable_images == 0:
            return "INSUFFICIENT_EVIDENCE"

        bands = TRUST_V1_CONFIG["trustBands"]
        if score >= bands["HIGH_CONFIDENCE"] and mandatory_complete:
            return "HIGH_CONFIDENCE"
        elif score >= bands["MODERATE_CONFIDENCE"]:
            return "MODERATE_CONFIDENCE"
        elif score >= bands["PROCEED_WITH_CAUTION"]:
            return "PROCEED_WITH_CAUTION"
        else:
            return "INSUFFICIENT_EVIDENCE"


class TrustScoreEngine:
    """
    Main Orchestrator for Phase 9 Buyer Assessment Trust Scoring.
    """

    @classmethod
    def evaluate_trust(
        cls,
        submitted_images: List[Dict[str, Any]],
        evidence_assessment: Optional[Dict[str, Any]] = None,
    ) -> FullAssessmentTrustReport:
        evidence_dict = evidence_assessment or {}
        findings = evidence_dict.get("findings", [])
        cross_view_obs = evidence_dict.get("crossViewObservations", [])

        # ── 1. Completeness & Blindspots ───────────────────────────────────────
        completeness_rep, blindspots = EvidenceCompletenessEngine.evaluate_completeness(
            submitted_images=submitted_images,
            damage_detections=findings,
        )

        usable_count = completeness_rep.usableImageCount
        missing_mandatory_count = 4 - int(completeness_rep.mandatoryCoverage * 4)

        # ── 2. Empty / Insufficient Evidence Case ──────────────────────────────
        if usable_count == 0 or len(submitted_images) == 0:
            trust_rep = TrustScoreReport(
                trustScore=None,
                trustBand="INSUFFICIENT_EVIDENCE",
                status="INSUFFICIENT_EVIDENCE",
                formulaVersion="TRUST_V1",
                components=TrustScoreComponents(
                    evidenceCompleteness=0.0,
                    iqaReliability=0.0,
                    modelConfidence=0.0,
                    crossViewConsistency=0.0,
                ),
                rawReliabilityScore=0.0,
                capsApplied=["NO_USABLE_EVIDENCE"],
                explanation="No usable photographic evidence was submitted to construct an assessment.",
                limitations=[
                    "Cannot establish condition or trust without valid vehicle photographs.",
                    "On-site mechanical physical inspection is mandatory.",
                ],
            )
            return FullAssessmentTrustReport(
                version="TRUST_V1",
                assessmentStatus="INSUFFICIENT_EVIDENCE",
                evidenceCompleteness=completeness_rep,
                trustScore=trust_rep,
                conditionScoreStatus="INSUFFICIENT_EVIDENCE",
                modelConfidenceStatus="NO_USABLE_EVIDENCE",
                limitations=trust_rep.limitations,
            )

        # ── 3. IQA Reliability Factor (R_iqa) ──────────────────────────────────
        usable_records = [r for r in completeness_rep.viewQuality if r.submitted]
        iqa_weights = {"PASS": 1.0, "WARN": 0.70, "FAIL": 0.0}
        total_iqa_score = sum(iqa_weights.get(r.iqaStatus, 0.0) for r in usable_records)
        r_iqa = round(total_iqa_score / max(1, len(usable_records)), 4)
        avg_iqa_val = sum(r.qualityScore for r in usable_records) / max(1, len(usable_records))
        iqa_fail_count = sum(1 for r in usable_records if r.iqaStatus == "FAIL")

        # ── 4. Model Confidence (C_model) ──────────────────────────────────────
        c_model, model_status = ModelConfidenceEngine.aggregate_confidence(
            findings=findings,
            usable_image_count=usable_count,
            iqa_avg_score=avg_iqa_val,
        )

        # ── 5. Cross-View Consistency ──────────────────────────────────────────
        cross_consistency = CrossViewConsistencyEngine.compute_consistency(
            cross_view_observations=cross_view_obs,
            findings=findings,
            usable_image_count=usable_count,
        )

        # ── 6. Evidence Reliability (R_evidence) ───────────────────────────────
        r_evidence = EvidenceReliabilityEngine.calculate_reliability(
            c_evidence=completeness_rep.coverageScore,
            r_iqa=r_iqa,
            c_model=c_model,
            cross_view_consistency=cross_consistency,
        )

        # ── 7. Trust Score & Mandatory Gating Caps ─────────────────────────────
        raw_trust = round(r_evidence * 100)
        final_trust = raw_trust
        caps_applied: List[str] = []

        caps_config = TRUST_V1_CONFIG["trustCaps"]

        if missing_mandatory_count >= 2:
            caps_applied.append(f"GATED_MAX_{caps_config['twoOrMoreMandatoryMissing']}_DUE_TO_2+_MISSING_MANDATORY_VIEWS")
            final_trust = min(final_trust, caps_config["twoOrMoreMandatoryMissing"])
        elif missing_mandatory_count == 1:
            caps_applied.append(f"GATED_MAX_{caps_config['oneMandatoryMissing']}_DUE_TO_MISSING_MANDATORY_VIEW")
            final_trust = min(final_trust, caps_config["oneMandatoryMissing"])

        if iqa_fail_count >= 2:
            caps_applied.append(f"GATED_MAX_{caps_config['multipleIqaFailures']}_DUE_TO_MULTIPLE_IQA_FAILURES")
            final_trust = min(final_trust, caps_config["multipleIqaFailures"])

        final_trust = max(0, min(100, final_trust))

        # ── 8. Trust Band & Status ─────────────────────────────────────────────
        band = TrustBandEngine.get_band(
            score=final_trust,
            usable_images=usable_count,
            mandatory_complete=completeness_rep.mandatoryViewsComplete,
        )

        if missing_mandatory_count >= 2 or usable_count < 3:
            assessment_status = "INSUFFICIENT_EVIDENCE"
        elif missing_mandatory_count == 1:
            assessment_status = "LIMITED_ASSESSMENT"
        else:
            assessment_status = "READY_FOR_ASSESSMENT"

        # ── 9. Explainability & Academic Disclaimers ───────────────────────────
        explanation_parts = [
            f"Buyer assessment trust score {final_trust}/100 ({band.replace('_', ' ')}) derived from "
            f"{usable_count} usable photographs with {round(completeness_rep.coverageScore * 100)}% evidence coverage "
            f"and {round(r_iqa * 100)}% image quality reliability."
        ]
        if caps_applied:
            explanation_parts.append(f"Confidence score is gated by evidence safety caps: {', '.join(caps_applied)}.")

        limitations = [
            "Trust score measures confidence in assessment completeness and quality, NOT vehicle mechanical roadworthiness.",
            "Photographs cannot certify sub-surface chassis alignment, engine health, gearbox condition, or accident history.",
            "High confidence in photographic evidence does not replace a comprehensive hands-on mechanic inspection.",
        ]

        trust_rep = TrustScoreReport(
            trustScore=final_trust,
            trustBand=band,
            status=assessment_status,
            formulaVersion="TRUST_V1",
            components=TrustScoreComponents(
                evidenceCompleteness=completeness_rep.coverageScore,
                iqaReliability=r_iqa,
                modelConfidence=c_model,
                crossViewConsistency=cross_consistency,
            ),
            rawReliabilityScore=r_evidence,
            capsApplied=caps_applied,
            explanation=" ".join(explanation_parts),
            limitations=limitations,
        )

        return FullAssessmentTrustReport(
            version="TRUST_V1",
            assessmentStatus=assessment_status,
            evidenceCompleteness=completeness_rep,
            trustScore=trust_rep,
            conditionScoreStatus="CALCULATED",
            modelConfidenceStatus=model_status,
            limitations=limitations,
        )
