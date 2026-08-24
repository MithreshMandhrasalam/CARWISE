# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 10: Repair Cost Estimation & Market Valuation Service
# Deterministic, transparent, market-aware repair cost engine (INR)
# ═══════════════════════════════════════════════════════════════

import uuid
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field


# ── 1. Base Cost Configuration Table (Academic Baseline INR for Tier 2 Hatchback) ─
BASE_REPAIR_COSTS: Dict[str, Dict[str, Any]] = {
    "RUBBING_COMPOUNDING_OR_SPOT_PAINT": {
        "min": 500,
        "max": 1500,
        "name": "Rubbing, Compounding & Spot Polish",
        "description": "High-grit abrasive compounding, dual-action machine polishing, or micro-scratch clearcoat touch-up.",
    },
    "PANEL_TOUCHUP_AND_CLEARCOAT": {
        "min": 1500,
        "max": 3500,
        "name": "Spot Sanding & Clearcoat Blending",
        "description": "Localized color-matched basecoat application and wet-on-wet clearcoat panel blending.",
    },
    "FULL_PANEL_REPAINT": {
        "min": 3000,
        "max": 6000,
        "name": "Full Panel Refinishing & Oven Bake",
        "description": "Full panel de-trimming, dual primer coats, OEM color basecoat, and high-solid clearcoat baked in spray booth.",
    },
    "PAINTLESS_DENT_REMOVAL_PDR": {
        "min": 1000,
        "max": 2500,
        "name": "Paintless Dent Removal (PDR)",
        "description": "Precision cold-metal dent extraction preserving the original factory paint finish.",
    },
    "DENT_PULLING_BODYWORK_AND_PAINT": {
        "min": 3000,
        "max": 7500,
        "name": "Dent Pulling Bodywork & Repaint",
        "description": "Stud welder extraction, body filler shaping, primer surfacer, and complete panel refinishing.",
    },
    "PANEL_REPLACEMENT_OR_MAJOR_BODYWORK": {
        "min": 7500,
        "max": 18000,
        "name": "Major Panel Overhaul / Replacement",
        "description": "Severe deformation realignment or complete sheet metal panel replacement with factory spot welding.",
    },
    "PLASTIC_WELDING_OR_PART_REPLACEMENT": {
        "min": 2000,
        "max": 6000,
        "name": "Plastic Welding / Bumper Repair",
        "description": "Thermal plastic welding, structural mesh reinforcement, flexible filler, and fascia refinishing.",
    },
    "HEADLAMP_OR_TAILLAMP_ASSEMBLY_REPLACEMENT": {
        "min": 2500,
        "max": 8500,
        "name": "Lamp Assembly Replacement",
        "description": "OEM/OES sealed lamp assembly unit replacement, electrical harness connection, and beam leveling calibration.",
    },
    "WINDSHIELD_OR_GLASS_REPLACEMENT": {
        "min": 4500,
        "max": 12000,
        "name": "Automotive Glass Replacement",
        "description": "Laminated automotive safety glass replacement with high-modulus polyurethane sealant cure.",
    },
    "TYRE_REPLACEMENT_OR_PUNCTURE_OVERHAUL": {
        "min": 3500,
        "max": 8000,
        "name": "Radial Tyre Replacement & Balancing",
        "description": "New radial tyre fitment, high-speed computerized wheel balancing, and tire valve stem replacement.",
    },
}

# ── 2. Segment & Region Multipliers ─────────────────────────────────────────────
SEGMENT_FACTORS: Dict[str, float] = {
    "HATCHBACK": 1.00,
    "ENTRY": 1.00,
    "SEDAN": 1.25,
    "COMPACT_SUV": 1.25,
    "MID_SUV": 1.60,
    "PREMIUM_SEDAN": 1.60,
    "LUXURY": 2.50,
    "EXECUTIVE": 2.50,
}

REGION_FACTORS: Dict[str, float] = {
    "TIER_1_METRO": 1.20,
    "TIER_2": 1.00,
    "TIER_3_RURAL": 0.85,
}

ZONE_FACTORS: Dict[str, float] = {
    "FRONT": 1.00,
    "REAR": 1.00,
    "FRONT_LEFT": 1.15,
    "FRONT_RIGHT": 1.15,
    "REAR_LEFT": 1.15,
    "REAR_RIGHT": 1.15,
    "LEFT_SIDE": 1.25,
    "RIGHT_SIDE": 1.25,
}


# ── Schemas ─────────────────────────────────────────────────────────────────────

class CostRange(BaseModel):
    min: Optional[int] = None
    max: Optional[int] = None
    median: Optional[int] = None


class ItemizedRepairAction(BaseModel):
    repairId: str = Field(default_factory=lambda: f"rep-{uuid.uuid4().hex[:8]}")
    evidenceId: Optional[str] = None
    zone: str
    damageClass: str
    severity: str
    recommendedAction: str
    actionName: str
    actionDescription: str
    baseRange: CostRange
    estimatedRange: CostRange
    confidence: str  # HIGH, MODERATE, LOW
    requiresPhysicalInspection: bool = True
    qualityWarning: bool = False


class SynergyDiscount(BaseModel):
    itemsCount: int
    discountPercentage: int
    savingsMedian: int


class MultipliersApplied(BaseModel):
    segment: str
    segmentFactor: float
    region: str
    regionFactor: float


class RepairCostAssessmentReport(BaseModel):
    version: str = "REPAIR_V1"
    currency: str = "INR"
    status: str  # COMPLETE, NO_DAMAGE_DETECTED, INSUFFICIENT_EVIDENCE
    totalEstimatedRange: CostRange
    vehicleSegment: str
    regionTier: str
    multipliersApplied: MultipliersApplied
    itemizedRepairs: List[ItemizedRepairAction]
    synergyDiscountApplied: SynergyDiscount
    summary: str
    limitations: List[str]


# ═══════════════════════════════════════════════════════════════════════════════
# Repair Action Mapping & Calculation Engine
# ═══════════════════════════════════════════════════════════════════════════════

class RepairActionMapper:
    """Maps visual damage class and deterministic severity to repair action code."""

    @staticmethod
    def map_action(damage_class: str, severity: str) -> str:
        dc = (damage_class or "").lower()
        sev = (severity or "MINOR").upper()

        if dc == "scratch":
            if sev == "SEVERE":
                return "FULL_PANEL_REPAINT"
            elif sev == "MODERATE":
                return "PANEL_TOUCHUP_AND_CLEARCOAT"
            else:
                return "RUBBING_COMPOUNDING_OR_SPOT_PAINT"

        elif dc == "dent":
            if sev == "SEVERE":
                return "PANEL_REPLACEMENT_OR_MAJOR_BODYWORK"
            elif sev == "MODERATE":
                return "DENT_PULLING_BODYWORK_AND_PAINT"
            else:
                return "PAINTLESS_DENT_REMOVAL_PDR"

        elif dc == "crack":
            return "PLASTIC_WELDING_OR_PART_REPLACEMENT"

        elif dc == "lamp_broken":
            return "HEADLAMP_OR_TAILLAMP_ASSEMBLY_REPLACEMENT"

        elif dc == "glass_shatter":
            return "WINDSHIELD_OR_GLASS_REPLACEMENT"

        elif dc == "tire_flat":
            return "TYRE_REPLACEMENT_OR_PUNCTURE_OVERHAUL"

        else:
            return "RUBBING_COMPOUNDING_OR_SPOT_PAINT"


class VehicleSegmentDetector:
    """Classifies vehicle make and model into market segment for labor/parts scaling."""

    @staticmethod
    def detect_segment(vehicle_info: Optional[Dict[str, Any]]) -> str:
        if not vehicle_info:
            return "HATCHBACK"

        make = str(vehicle_info.get("make", "")).upper()
        model = str(vehicle_info.get("model", "")).upper()
        body_type = str(vehicle_info.get("bodyType", "")).upper()

        # Luxury indicators
        luxury_brands = ["BMW", "MERCEDES", "MERCEDES-BENZ", "AUDI", "JAGUAR", "LAND ROVER", "VOLVO", "PORSCHE", "LEXUS"]
        if any(b in make for b in luxury_brands) or "FORTUNER" in model or "ENDEAVOUR" in model:
            return "LUXURY"

        # Mid SUV / Premium Sedan
        mid_suv_models = ["CRETA", "SELTOS", "CITY", "VERNA", "SCORPIO", "SCORPIO-N", "HARRIER", "SAFARI", "HECTOR", "XUV700", "KUSHAQ", "TAIGUN", "SLAVIA", "VIRTUOUS", "VIRTUS", "INNOVA", "HYCROSS"]
        if any(m in model for m in mid_suv_models):
            return "MID_SUV"

        # Compact SUV / Sedan
        compact_models = ["NEXON", "BREZZA", "VENUE", "SONET", "AMAZE", "DZIRE", "AURA", "PUNCH", "EXTER", "TIGOR", "KIGER", "MAGNITE", "FRONX"]
        if any(m in model for m in compact_models) or body_type in ["SEDAN", "COMPACT_SUV"]:
            return "SEDAN"

        # Default Hatchback / Entry
        return "HATCHBACK"


class RepairCostEstimationEngine:
    """
    Main Orchestrator for Phase 10 Repair Cost Estimation.
    """

    @classmethod
    def estimate_repair_cost(
        cls,
        evidence_assessment: Optional[Dict[str, Any]] = None,
        vehicle_info: Optional[Dict[str, Any]] = None,
        region_tier: str = "TIER_2",
    ) -> RepairCostAssessmentReport:
        evidence_dict = evidence_assessment or {}
        findings = evidence_dict.get("findings", [])
        status = evidence_dict.get("status")

        segment = VehicleSegmentDetector.detect_segment(vehicle_info)
        f_segment = SEGMENT_FACTORS.get(segment, 1.00)
        f_region = REGION_FACTORS.get(region_tier.upper(), 1.00)

        # ── 1. Check for Insufficient Evidence ────────────────────────────────
        if status == "INSUFFICIENT_EVIDENCE":
            return RepairCostAssessmentReport(
                version="REPAIR_V1",
                currency="INR",
                status="INSUFFICIENT_EVIDENCE",
                totalEstimatedRange=CostRange(min=None, max=None, median=None),
                vehicleSegment=segment,
                regionTier=region_tier,
                multipliersApplied=MultipliersApplied(
                    segment=segment,
                    segmentFactor=f_segment,
                    region=region_tier,
                    regionFactor=f_region,
                ),
                itemizedRepairs=[],
                synergyDiscountApplied=SynergyDiscount(itemsCount=0, discountPercentage=0, savingsMedian=0),
                summary="Insufficient photographic evidence to construct a repair cost estimate.",
                limitations=["Repair cost estimation requires valid and complete vehicle perspective images."],
            )

        # ── 2. Check for Clean / Damage-Free Vehicle ──────────────────────────
        usable_findings = [f for f in findings if not f.get("isDuplicateEvidence", False)]

        if len(usable_findings) == 0:
            return RepairCostAssessmentReport(
                version="REPAIR_V1",
                currency="INR",
                status="NO_DAMAGE_DETECTED",
                totalEstimatedRange=CostRange(min=0, max=0, median=0),
                vehicleSegment=segment,
                regionTier=region_tier,
                multipliersApplied=MultipliersApplied(
                    segment=segment,
                    segmentFactor=f_segment,
                    region=region_tier,
                    regionFactor=f_region,
                ),
                itemizedRepairs=[],
                synergyDiscountApplied=SynergyDiscount(itemsCount=0, discountPercentage=0, savingsMedian=0),
                summary="No visible cosmetic or structural defects requiring immediate repair detected from submitted photographs.",
                limitations=[
                    "Estimates reflect visible photographic evidence only.",
                    "Sub-surface mechanical wear and concealed frame defects cannot be estimated visually.",
                ],
            )

        # ── 3. Calculate Itemized Repairs ─────────────────────────────────────
        itemized: List[ItemizedRepairAction] = []
        raw_min_sum = 0
        raw_max_sum = 0

        for f in usable_findings:
            dc = f.get("damageClass", "scratch")
            sev = f.get("severity", "MINOR")
            zone = f.get("zone", "FRONT")
            conf = float(f.get("modelConfidence", 0.70))
            q_warn = bool(f.get("qualityWarning", False))

            action_code = RepairActionMapper.map_action(dc, sev)
            base_spec = BASE_REPAIR_COSTS.get(action_code, BASE_REPAIR_COSTS["RUBBING_COMPOUNDING_OR_SPOT_PAINT"])

            f_zone = ZONE_FACTORS.get(zone, 1.00)
            combined_mult = f_segment * f_region * f_zone

            item_min = int(round(base_spec["min"] * combined_mult))
            item_max = int(round(base_spec["max"] * combined_mult))
            item_median = int(round((item_min + item_max) / 2.0))

            raw_min_sum += item_min
            raw_max_sum += item_max

            # Confidence determination
            if conf >= 0.70 and not q_warn:
                item_confidence = "HIGH"
            elif conf >= 0.50 or q_warn:
                item_confidence = "MODERATE"
            else:
                item_confidence = "LOW"

            itemized.append(
                ItemizedRepairAction(
                    evidenceId=f.get("evidenceId"),
                    zone=zone,
                    damageClass=dc,
                    severity=sev,
                    recommendedAction=action_code,
                    actionName=base_spec["name"],
                    actionDescription=base_spec["description"],
                    baseRange=CostRange(min=base_spec["min"], max=base_spec["max"], median=(base_spec["min"] + base_spec["max"]) // 2),
                    estimatedRange=CostRange(min=item_min, max=item_max, median=item_median),
                    confidence=item_confidence,
                    requiresPhysicalInspection=True,
                    qualityWarning=q_warn,
                )
            )

        # ── 4. Apply Multi-Panel Paint & Bodywork Synergy Discount ─────────────
        items_count = len(itemized)
        if items_count >= 3:
            discount_pct = 15
        elif items_count == 2:
            discount_pct = 10
        else:
            discount_pct = 0

        discount_mult = (100 - discount_pct) / 100.0
        final_min = int(round(raw_min_sum * discount_mult))
        final_max = int(round(raw_max_sum * discount_mult))
        final_median = int(round((final_min + final_max) / 2.0))

        raw_median = (raw_min_sum + raw_max_sum) // 2
        savings_median = raw_median - final_median

        synergy_info = SynergyDiscount(
            itemsCount=items_count,
            discountPercentage=discount_pct,
            savingsMedian=savings_median,
        )

        summary = (
            f"Estimated total repair range: ₹{final_min:,} – ₹{final_max:,} (Median: ₹{final_median:,}) "
            f"across {items_count} localized defect(s) for a {segment.replace('_', ' ')} in {region_tier.replace('_', ' ')}."
        )

        limitations = [
            "Estimates reflect baseline independent multi-brand workshop labor and material rates in India (2026).",
            "Authorized OEM dealership workshop estimates may be 30%–60% higher due to strict genuine part markup and branded labor hourly rates.",
            "Actual repair costs depend on paint blending into adjacent panels, paint metallic/pearl tint formulation, and underlying structural damage discovered upon teardown.",
            "Hands-on bodyshop physical assessment and written estimate is required prior to financial commitment.",
        ]

        return RepairCostAssessmentReport(
            version="REPAIR_V1",
            currency="INR",
            status="COMPLETE",
            totalEstimatedRange=CostRange(min=final_min, max=final_max, median=final_median),
            vehicleSegment=segment,
            regionTier=region_tier,
            multipliersApplied=MultipliersApplied(
                segment=segment,
                segmentFactor=f_segment,
                region=region_tier,
                regionFactor=f_region,
            ),
            itemizedRepairs=itemized,
            synergyDiscountApplied=synergy_info,
            summary=summary,
            limitations=limitations,
        )
