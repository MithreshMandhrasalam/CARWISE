# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 8: Evidence Reasoning & Deterministic Damage Assessment
# Converts YOLO11s detections into structured, explainable vehicle evidence
# Pure deterministic reasoning — independent of ML frameworks
# ═══════════════════════════════════════════════════════════════

import uuid
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field

# ── 1. Canonical 8-Zone Vehicle Taxonomy ─────────────────────────────────────────
CANONICAL_ZONES = [
    "FRONT",
    "FRONT_LEFT",
    "FRONT_RIGHT",
    "REAR",
    "REAR_LEFT",
    "REAR_RIGHT",
    "LEFT_SIDE",
    "RIGHT_SIDE",
]

# ── 2. Config-Driven Damage Class Base Priority Weights ─────────────────────────
DAMAGE_CLASS_PRIORITY: Dict[str, int] = {
    "glass_shatter": 5,
    "tire_flat": 5,
    "lamp_broken": 4,
    "crack": 4,
    "dent": 2,
    "scratch": 1,
}

# ── 3. Adjacent View Mapping for Cross-View Reasoning ───────────────────────────
ADJACENT_VIEWS = {
    "FRONT": ["FRONT_LEFT", "FRONT_RIGHT", "LEFT", "RIGHT"],
    "FRONT_LEFT": ["FRONT", "LEFT", "LEFT_SIDE"],
    "FRONT_RIGHT": ["FRONT", "RIGHT", "RIGHT_SIDE"],
    "REAR": ["REAR_LEFT", "REAR_RIGHT", "LEFT", "RIGHT"],
    "REAR_LEFT": ["REAR", "LEFT", "LEFT_SIDE"],
    "REAR_RIGHT": ["REAR", "RIGHT", "RIGHT_SIDE"],
    "LEFT": ["FRONT_LEFT", "REAR_LEFT", "FRONT", "REAR"],
    "RIGHT": ["FRONT_RIGHT", "REAR_RIGHT", "FRONT", "REAR"],
    "LEFT_SIDE": ["FRONT_LEFT", "REAR_LEFT", "FRONT", "REAR"],
    "RIGHT_SIDE": ["FRONT_RIGHT", "REAR_RIGHT", "FRONT", "REAR"],
}

# ── 4. Condition Score Deductions Configuration ──────────────────────────────────
SEVERITY_DEDUCTIONS = {
    "MINOR": 5,
    "MODERATE": 15,
    "SEVERE": 30,
}


# ═══════════════════════════════════════════════════════════════════════════════
# Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class BoundingBoxCoord(BaseModel):
    xMin: float
    yMin: float
    xMax: float
    yMax: float


class NormalizedEvidence(BaseModel):
    evidenceId: str = Field(default_factory=lambda: f"ev-{uuid.uuid4().hex[:8]}")
    imageId: Optional[str] = None
    viewType: str
    zone: str
    damageClass: str
    modelConfidence: float
    confidenceBand: str
    bbox: BoundingBoxCoord
    bboxAreaRatio: float
    severity: str
    severityBasis: List[str]
    mappingConfidence: str
    mappingBasis: str
    requiresPhysicalVerification: bool = True
    isDuplicateEvidence: bool = False
    duplicateOf: Optional[str] = None
    qualityWarning: bool = False


class ZoneAggregation(BaseModel):
    zone: str
    findingCount: int
    highestSeverity: str
    evidencePriority: int
    findings: List[NormalizedEvidence]


class CrossViewObservation(BaseModel):
    observationId: str = Field(default_factory=lambda: f"cvo-{uuid.uuid4().hex[:8]}")
    type: str
    severity: str
    zones: List[str]
    evidenceIds: List[str]
    statement: str
    requiresPhysicalVerification: bool = True


class DeductionItem(BaseModel):
    reason: str
    zone: str
    severity: str
    points: int


class ConditionScoreResult(BaseModel):
    score: int
    formulaVersion: str = "CONDITION_V1"
    baseScore: int = 100
    deductions: List[DeductionItem]
    explanation: str
    limitations: List[str]


class EvidenceCompletenessResult(BaseModel):
    coverageScore: float
    mandatoryViewsComplete: bool
    usableImageCount: int
    submittedViews: List[str]
    blindspots: List[str]
    warnings: List[str]


class TrustScoreContract(BaseModel):
    trustScore: Optional[float] = None
    status: str = "PENDING_TRUST_MODEL"
    reason: str = "Trust scoring requires evidence completeness, model confidence, and price validation."


class EvidenceAssessmentReport(BaseModel):
    version: str = "EVIDENCE_V1"
    totalEvidenceCount: int
    uniqueFindingCount: int
    findings: List[NormalizedEvidence]
    zones: List[ZoneAggregation]
    crossViewObservations: List[CrossViewObservation]
    conditionScore: ConditionScoreResult
    evidenceCompleteness: EvidenceCompletenessResult
    trustScore: TrustScoreContract
    limitations: List[str]


# ═══════════════════════════════════════════════════════════════════════════════
# Core Reasoning Engines
# ═══════════════════════════════════════════════════════════════════════════════

class BoundingBoxValidator:
    """Validates and computes normalized area ratios for bounding boxes."""

    @staticmethod
    def validate_and_compute_area(bbox: Dict[str, float]) -> Tuple[bool, Optional[float], Optional[str]]:
        x_min = bbox.get("xMin", -1.0)
        y_min = bbox.get("yMin", -1.0)
        x_max = bbox.get("xMax", -1.0)
        y_max = bbox.get("yMax", -1.0)

        # Check coordinate bounds
        if x_min < 0.0 or y_min < 0.0 or x_max > 1.0 or y_max > 1.0:
            return False, None, "Coordinates out of normalized [0.0, 1.0] range"

        if x_min >= x_max:
            return False, None, f"Invalid horizontal dimensions: xMin ({x_min}) >= xMax ({x_max})"

        if y_min >= y_max:
            return False, None, f"Invalid vertical dimensions: yMin ({y_min}) >= yMax ({y_max})"

        width = x_max - x_min
        height = y_max - y_min
        area_ratio = width * height

        if area_ratio <= 0.0:
            return False, None, "Zero or negative bounding box area"

        return True, round(area_ratio, 6), None

    @staticmethod
    def compute_iou(boxA: BoundingBoxCoord, boxB: BoundingBoxCoord) -> float:
        """Computes 2D Intersection-over-Union between two normalized bounding boxes."""
        xA = max(boxA.xMin, boxB.xMin)
        yA = max(boxA.yMin, boxB.yMin)
        xB = min(boxA.xMax, boxB.xMax)
        yB = min(boxA.yMax, boxB.yMax)

        inter_width = max(0.0, xB - xA)
        inter_height = max(0.0, yB - yA)
        inter_area = inter_width * inter_height

        boxA_area = (boxA.xMax - boxA.xMin) * (boxA.yMax - boxA.yMin)
        boxB_area = (boxB.xMax - boxB.xMin) * (boxB.yMax - boxB.yMin)

        union_area = boxA_area + boxB_area - inter_area
        if union_area <= 0.0:
            return 0.0

        return round(inter_area / union_area, 4)


class VehicleZoneMapper:
    """
    Deterministic logical vehicle-zone association based on perspective angle and bbox position.
    Does NOT claim exact 3D spatial reconstruction.
    """

    @staticmethod
    def map_to_zone(view_type: str, bbox: BoundingBoxCoord, damage_class: str) -> Dict[str, Any]:
        vt = (view_type or "UNKNOWN").upper()
        x_center = (bbox.xMin + bbox.xMax) / 2.0

        # Mapping heuristics based on viewpoint perspective and horizontal subdivision
        if vt == "FRONT":
            if x_center < 0.35:
                zone = "FRONT_LEFT"
                basis = "FRONT view, left third of image plane"
                mapping_conf = "MEDIUM"
            elif x_center > 0.65:
                zone = "FRONT_RIGHT"
                basis = "FRONT view, right third of image plane"
                mapping_conf = "MEDIUM"
            else:
                zone = "FRONT"
                basis = "FRONT view central perspective"
                mapping_conf = "HIGH"
        elif vt in ["FRONT_LEFT", "FRONT_LEFT_45"]:
            zone = "FRONT_LEFT"
            basis = "FRONT_LEFT angled perspective"
            mapping_conf = "HIGH"
        elif vt in ["FRONT_RIGHT", "FRONT_RIGHT_45"]:
            zone = "FRONT_RIGHT"
            basis = "FRONT_RIGHT angled perspective"
            mapping_conf = "HIGH"
        elif vt == "REAR":
            if x_center < 0.35:
                zone = "REAR_LEFT"
                basis = "REAR view, left third of image plane"
                mapping_conf = "MEDIUM"
            elif x_center > 0.65:
                zone = "REAR_RIGHT"
                basis = "REAR view, right third of image plane"
                mapping_conf = "MEDIUM"
            else:
                zone = "REAR"
                basis = "REAR view central perspective"
                mapping_conf = "HIGH"
        elif vt in ["REAR_LEFT", "REAR_LEFT_45"]:
            zone = "REAR_LEFT"
            basis = "REAR_LEFT angled perspective"
            mapping_conf = "HIGH"
        elif vt in ["REAR_RIGHT", "REAR_RIGHT_45"]:
            zone = "REAR_RIGHT"
            basis = "REAR_RIGHT angled perspective"
            mapping_conf = "HIGH"
        elif vt in ["LEFT", "LEFT_SIDE"]:
            if x_center < 0.30:
                zone = "FRONT_LEFT"
                basis = "LEFT view anterior section"
                mapping_conf = "MEDIUM"
            elif x_center > 0.70:
                zone = "REAR_LEFT"
                basis = "LEFT view posterior section"
                mapping_conf = "MEDIUM"
            else:
                zone = "LEFT_SIDE"
                basis = "LEFT_SIDE flank profile"
                mapping_conf = "HIGH"
        elif vt in ["RIGHT", "RIGHT_SIDE"]:
            if x_center < 0.30:
                zone = "FRONT_RIGHT"
                basis = "RIGHT view anterior section"
                mapping_conf = "MEDIUM"
            elif x_center > 0.70:
                zone = "REAR_RIGHT"
                basis = "RIGHT view posterior section"
                mapping_conf = "MEDIUM"
            else:
                zone = "RIGHT_SIDE"
                basis = "RIGHT_SIDE flank profile"
                mapping_conf = "HIGH"
        else:
            zone = "FRONT"
            basis = "Fallback default zone for unclassified view"
            mapping_conf = "LOW"

        return {
            "zone": zone,
            "mappingConfidence": mapping_conf,
            "basis": f"Logical vehicle-zone association based on {basis}",
            "requiresVerification": True,
        }


class DamageSeverityEngine:
    """
    Deterministic rule-based severity determination.
    Severity is NEVER directly predicted by neural network classification.
    """

    @staticmethod
    def calculate_severity(damage_class: str, area_ratio: float, zone: str) -> Dict[str, Any]:
        basis = [f"damage_class={damage_class}", f"bbox_area_ratio={area_ratio:.4f}"]

        # 1. Critical Component Failure -> SEVERE
        if damage_class in ["glass_shatter", "tire_flat"]:
            basis.append("structural_component_failure_class")
            return {
                "severity": "SEVERE",
                "basis": basis,
                "method": "DETERMINISTIC_RULE_V1",
                "requiresPhysicalVerification": True,
            }

        # 2. Very large visible damage area (alpha >= 0.10) -> SEVERE
        if area_ratio >= 0.10:
            basis.append("large_area_damage_coverage_ratio_gte_0.10")
            return {
                "severity": "SEVERE",
                "basis": basis,
                "method": "DETERMINISTIC_RULE_V1",
                "requiresPhysicalVerification": True,
            }

        # 3. Structural Fractures / Lamp Broken -> MODERATE
        if damage_class in ["crack", "lamp_broken"]:
            basis.append("fracture_or_lighting_assembly_defect")
            return {
                "severity": "MODERATE",
                "basis": basis,
                "method": "DETERMINISTIC_RULE_V1",
                "requiresPhysicalVerification": True,
            }

        # 4. Moderate Dents & Scratches (0.03 <= alpha < 0.10) -> MODERATE
        if area_ratio >= 0.03:
            basis.append("moderate_surface_area_span_0.03_to_0.10")
            return {
                "severity": "MODERATE",
                "basis": basis,
                "method": "DETERMINISTIC_RULE_V1",
                "requiresPhysicalVerification": True,
            }

        # 5. Minor superficial scratches and dents (alpha < 0.03) -> MINOR
        basis.append("superficial_flaw_area_ratio_lt_0.03")
        return {
            "severity": "MINOR",
            "basis": basis,
            "method": "DETERMINISTIC_RULE_V1",
            "requiresPhysicalVerification": True,
        }


class CrossViewEvidenceService:
    """
    Identifies repeated or contiguous damage patterns across adjacent camera viewpoints.
    Employs strictly cautious evidence language.
    """

    @staticmethod
    def analyze_cross_view_patterns(findings: List[NormalizedEvidence]) -> List[CrossViewObservation]:
        observations: List[CrossViewObservation] = []
        usable_findings = [f for f in findings if not f.isDuplicateEvidence]

        # Group findings by zone
        zone_map: Dict[str, List[NormalizedEvidence]] = {}
        for f in usable_findings:
            zone_map.setdefault(f.zone, []).append(f)

        # Check for multi-view observations within the same or adjacent zones
        for zone, items in zone_map.items():
            distinct_views = set(it.viewType for it in items)
            if len(distinct_views) >= 2:
                ev_ids = [it.evidenceId for it in items]
                classes = list(set(it.damageClass for it in items))
                highest_sev = "MODERATE"
                if any(it.severity == "SEVERE" for it in items):
                    highest_sev = "SEVERE"

                observations.append(
                    CrossViewObservation(
                        type="POSSIBLE_REPEATED_DAMAGE_PATTERN",
                        severity=highest_sev,
                        zones=[zone],
                        evidenceIds=ev_ids,
                        statement=(
                            f"Possible repeated visible {', '.join(classes)} pattern observed across "
                            f"{len(distinct_views)} perspective views ({', '.join(distinct_views)}) in zone {zone} — "
                            f"requires hands-on physical verification."
                        ),
                        requiresPhysicalVerification=True,
                    )
                )

        return observations


class ConditionScoreEngine:
    """
    Computes deterministic Vehicle Condition Score V1 (0-100).
    Evaluates observable cosmetic and structural surface integrity only.
    """

    @staticmethod
    def calculate_condition_score(findings: List[NormalizedEvidence]) -> ConditionScoreResult:
        base_score = 100
        deductions: List[DeductionItem] = []
        usable_findings = [f for f in findings if not f.isDuplicateEvidence]

        # Deduct per unique finding, capped per zone to prevent excessive multi-counting
        zone_deductions: Dict[str, int] = {}
        max_zone_deduction = 40  # A single zone cannot deduct more than 40 points alone

        for f in usable_findings:
            pts = SEVERITY_DEDUCTIONS.get(f.severity, 5)
            current_zone_pts = zone_deductions.get(f.zone, 0)

            if current_zone_pts + pts <= max_zone_deduction:
                applied_pts = pts
                zone_deductions[f.zone] = current_zone_pts + pts
            else:
                applied_pts = max(0, max_zone_deduction - current_zone_pts)
                zone_deductions[f.zone] = max_zone_deduction

            if applied_pts > 0:
                deductions.append(
                    DeductionItem(
                        reason=f"{f.severity} {f.damageClass.replace('_', ' ')} localized in {f.zone}",
                        zone=f.zone,
                        severity=f.severity,
                        points=applied_pts,
                    )
                )

        total_deduction = sum(d.points for d in deductions)
        final_score = max(0, min(100, base_score - total_deduction))

        explanation = (
            f"Condition score {final_score}/100 computed deterministically from {len(usable_findings)} "
            f"observable physical damage findings across vehicle panels."
        )

        limitations = [
            "Score reflects visible 2D cosmetic and surface damage evidence only.",
            "Photographs cannot establish internal mechanical condition, engine health, or transmission integrity.",
            "Chassis alignment and sub-surface rust cannot be evaluated from standard standing-height photos.",
            "Hands-on mechanical pre-purchase inspection is strongly recommended before purchasing.",
        ]

        return ConditionScoreResult(
            score=final_score,
            formulaVersion="CONDITION_V1",
            baseScore=base_score,
            deductions=deductions,
            explanation=explanation,
            limitations=limitations,
        )


class EvidenceAssessmentService:
    """
    Orchestrates end-to-end evidence normalization, deduplication, zone aggregation,
    cross-view reasoning, and condition scoring.
    """

    @classmethod
    def evaluate_inspection_evidence(
        cls,
        raw_damage_results: List[Dict[str, Any]],
        submitted_views: Optional[List[str]] = None,
    ) -> EvidenceAssessmentReport:
        normalized_findings: List[NormalizedEvidence] = []
        submitted = submitted_views or []

        # ── 1. Evidence Normalization & Validation ─────────────────────────────
        for res in raw_damage_results:
            view_type = res.get("viewType", "UNKNOWN")
            image_id = res.get("imageId")
            status = res.get("status", "COMPLETE")
            iqa_meta = res.get("iqa", {})
            quality_warning = iqa_meta.get("qualityWarning", False)

            # Skip blocked images
            if status == "BLOCKED_BY_IQA":
                continue

            for raw_det in res.get("detections", []):
                raw_bbox = raw_det.get("bbox", {})
                valid, area_ratio, err = BoundingBoxValidator.validate_and_compute_area(raw_bbox)
                if not valid or area_ratio is None:
                    # Skip corrupt bounding box
                    continue

                bbox_coord = BoundingBoxCoord(
                    xMin=raw_bbox["xMin"],
                    yMin=raw_bbox["yMin"],
                    xMax=raw_bbox["xMax"],
                    yMax=raw_bbox["yMax"],
                )

                damage_cls = raw_det.get("className", "unknown")
                confidence = float(raw_det.get("confidence", 0.0))
                band = raw_det.get("confidenceBand", "POTENTIAL")

                # Map Zone
                zone_info = VehicleZoneMapper.map_to_zone(view_type, bbox_coord, damage_cls)

                # Determine Severity
                sev_info = DamageSeverityEngine.calculate_severity(damage_cls, area_ratio, zone_info["zone"])

                normalized_findings.append(
                    NormalizedEvidence(
                        imageId=image_id,
                        viewType=view_type,
                        zone=zone_info["zone"],
                        damageClass=damage_cls,
                        modelConfidence=confidence,
                        confidenceBand=band,
                        bbox=bbox_coord,
                        bboxAreaRatio=area_ratio,
                        severity=sev_info["severity"],
                        severityBasis=sev_info["basis"],
                        mappingConfidence=zone_info["mappingConfidence"],
                        mappingBasis=zone_info["basis"],
                        requiresPhysicalVerification=True,
                        isDuplicateEvidence=False,
                        duplicateOf=None,
                        qualityWarning=quality_warning or raw_det.get("qualityWarning", False),
                    )
                )

        # ── 2. Deduplication (Same-Evidence Protection) ─────────────────────────
        for i in range(len(normalized_findings)):
            for j in range(i + 1, len(normalized_findings)):
                evA = normalized_findings[i]
                evB = normalized_findings[j]

                if evA.isDuplicateEvidence or evB.isDuplicateEvidence:
                    continue

                # Same damage class in same zone or adjacent views
                if evA.damageClass == evB.damageClass and (evA.zone == evB.zone or evB.viewType in ADJACENT_VIEWS.get(evA.viewType, [])):
                    iou = BoundingBoxValidator.compute_iou(evA.bbox, evB.bbox)
                    if iou >= 0.70 or (evA.imageId == evB.imageId and iou >= 0.60):
                        # Flag evB as duplicate of evA
                        evB.isDuplicateEvidence = True
                        evB.duplicateOf = evA.evidenceId

        # ── 3. Zone Aggregation ────────────────────────────────────────────────
        zone_aggregations: List[ZoneAggregation] = []
        for zone in CANONICAL_ZONES:
            zone_items = [f for f in normalized_findings if f.zone == zone and not f.isDuplicateEvidence]
            if zone_items:
                # Calculate priority burden
                priority_sum = sum(DAMAGE_CLASS_PRIORITY.get(it.damageClass, 1) for it in zone_items)
                highest_sev = "MINOR"
                if any(it.severity == "SEVERE" for it in zone_items):
                    highest_sev = "SEVERE"
                elif any(it.severity == "MODERATE" for it in zone_items):
                    highest_sev = "MODERATE"

                zone_aggregations.append(
                    ZoneAggregation(
                        zone=zone,
                        findingCount=len(zone_items),
                        highestSeverity=highest_sev,
                        evidencePriority=priority_sum,
                        findings=zone_items,
                    )
                )

        # ── 4. Cross-View Reasoning ────────────────────────────────────────────
        cross_view_obs = CrossViewEvidenceService.analyze_cross_view_patterns(normalized_findings)

        # ── 5. Condition Score Calculation ─────────────────────────────────────
        cond_score = ConditionScoreEngine.calculate_condition_score(normalized_findings)

        # ── 6. Evidence Completeness Assessment ────────────────────────────────
        mandatory_views = {"FRONT", "REAR", "LEFT", "RIGHT"}
        submitted_set = set(submitted) if submitted else set(r.get("viewType", "") for r in raw_damage_results if r.get("viewType"))
        mandatory_complete = mandatory_views.issubset(submitted_set)
        
        blindspots = []
        for mv in mandatory_views:
            if mv not in submitted_set:
                blindspots.append(f"MANDATORY_{mv}")

        warnings = []
        if not mandatory_complete:
            warnings.append(f"Missing {len(blindspots)} mandatory perspective view(s): {', '.join(blindspots)}")

        coverage_score = round(min(1.0, len(submitted_set) / 8.0), 2)
        usable_img_count = len([r for r in raw_damage_results if r.get("status") != "BLOCKED_BY_IQA"])

        completeness_res = EvidenceCompletenessResult(
            coverageScore=coverage_score,
            mandatoryViewsComplete=mandatory_complete,
            usableImageCount=usable_img_count,
            submittedViews=list(submitted_set),
            blindspots=blindspots,
            warnings=warnings,
        )

        # ── 7. Overall Limitations ─────────────────────────────────────────────
        limitations = [
            "All findings represent observable 2D photographic evidence and require hands-on physical verification.",
            "Vehicle-zone mappings represent logical associations based on camera perspective, not exact 3D coordinates.",
            "Severity classifications are computed via deterministic rules (DETERMINISTIC_RULE_V1) and are not machine-learned ranks.",
            "Trust score is pending full integration of regional price valuation models.",
        ]

        unique_count = len([f for f in normalized_findings if not f.isDuplicateEvidence])

        return EvidenceAssessmentReport(
            version="EVIDENCE_V1",
            totalEvidenceCount=len(normalized_findings),
            uniqueFindingCount=unique_count,
            findings=normalized_findings,
            zones=zone_aggregations,
            crossViewObservations=cross_view_obs,
            conditionScore=cond_score,
            evidenceCompleteness=completeness_res,
            trustScore=TrustScoreContract(),
            limitations=limitations,
        )
