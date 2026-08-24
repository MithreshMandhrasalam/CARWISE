# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 10: Repair Cost Estimation Unit Tests
# Tests Repair Action Mapping, Multipliers, Synergy Discount, & API
# ═══════════════════════════════════════════════════════════════

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.repair_cost_service import (
    RepairActionMapper,
    VehicleSegmentDetector,
    RepairCostEstimationEngine,
    BASE_REPAIR_COSTS,
    SEGMENT_FACTORS,
    REGION_FACTORS,
    ZONE_FACTORS,
)

client = TestClient(app)


# ── 1. Action Mapping Tests ───────────────────────────────────────────────────

def test_scratch_action_mapping():
    assert RepairActionMapper.map_action("scratch", "MINOR") == "RUBBING_COMPOUNDING_OR_SPOT_PAINT"
    assert RepairActionMapper.map_action("scratch", "MODERATE") == "PANEL_TOUCHUP_AND_CLEARCOAT"
    assert RepairActionMapper.map_action("scratch", "SEVERE") == "FULL_PANEL_REPAINT"


def test_dent_action_mapping():
    assert RepairActionMapper.map_action("dent", "MINOR") == "PAINTLESS_DENT_REMOVAL_PDR"
    assert RepairActionMapper.map_action("dent", "MODERATE") == "DENT_PULLING_BODYWORK_AND_PAINT"
    assert RepairActionMapper.map_action("dent", "SEVERE") == "PANEL_REPLACEMENT_OR_MAJOR_BODYWORK"


def test_component_replacement_action_mapping():
    assert RepairActionMapper.map_action("crack", "MODERATE") == "PLASTIC_WELDING_OR_PART_REPLACEMENT"
    assert RepairActionMapper.map_action("lamp_broken", "MODERATE") == "HEADLAMP_OR_TAILLAMP_ASSEMBLY_REPLACEMENT"
    assert RepairActionMapper.map_action("glass_shatter", "SEVERE") == "WINDSHIELD_OR_GLASS_REPLACEMENT"
    assert RepairActionMapper.map_action("tire_flat", "SEVERE") == "TYRE_REPLACEMENT_OR_PUNCTURE_OVERHAUL"


# ── 2. Segment & Region Factor Tests ──────────────────────────────────────────

def test_vehicle_segment_detection():
    assert VehicleSegmentDetector.detect_segment({"make": "Maruti", "model": "Swift"}) == "HATCHBACK"
    assert VehicleSegmentDetector.detect_segment({"make": "Tata", "model": "Nexon"}) == "SEDAN"
    assert VehicleSegmentDetector.detect_segment({"make": "Hyundai", "model": "Creta"}) == "MID_SUV"
    assert VehicleSegmentDetector.detect_segment({"make": "Mahindra", "model": "Scorpio-N"}) == "MID_SUV"
    assert VehicleSegmentDetector.detect_segment({"make": "Toyota", "model": "Fortuner"}) == "LUXURY"
    assert VehicleSegmentDetector.detect_segment({"make": "BMW", "model": "3 Series"}) == "LUXURY"


def test_segment_and_region_multiplier_values():
    assert SEGMENT_FACTORS["HATCHBACK"] == 1.00
    assert SEGMENT_FACTORS["SEDAN"] == 1.25
    assert SEGMENT_FACTORS["MID_SUV"] == 1.60
    assert SEGMENT_FACTORS["LUXURY"] == 2.50

    assert REGION_FACTORS["TIER_1_METRO"] == 1.20
    assert REGION_FACTORS["TIER_2"] == 1.00
    assert REGION_FACTORS["TIER_3_RURAL"] == 0.85


# ── 3. Single Item Cost & Range Tests ─────────────────────────────────────────

def test_single_item_cost_calculation():
    evidence = {
        "findings": [
            {
                "evidenceId": "ev-01",
                "damageClass": "scratch",
                "severity": "MINOR",
                "zone": "FRONT",
                "modelConfidence": 0.80,
                "isDuplicateEvidence": False,
            }
        ]
    }
    # Base: min 500, max 1500. Hatchback (1.0) Tier 2 (1.0) Front (1.0)
    report = RepairCostEstimationEngine.estimate_repair_cost(
        evidence_assessment=evidence,
        vehicle_info={"make": "Maruti", "model": "Alto"},
        region_tier="TIER_2",
    )
    assert report.status == "COMPLETE"
    assert len(report.itemizedRepairs) == 1
    item = report.itemizedRepairs[0]
    assert item.estimatedRange.min == 500
    assert item.estimatedRange.max == 1500
    assert item.estimatedRange.median == 1000
    assert item.confidence == "HIGH"


def test_multiplier_scaling_mid_suv_metro():
    evidence = {
        "findings": [
            {
                "evidenceId": "ev-01",
                "damageClass": "dent",
                "severity": "MODERATE",
                "zone": "LEFT_SIDE",  # Zone factor 1.25
                "modelConfidence": 0.85,
                "isDuplicateEvidence": False,
            }
        ]
    }
    # Base: 3000 to 7500. Mid-SUV (1.60), Tier 1 Metro (1.20), Zone (1.25) -> Mult = 1.60 * 1.20 * 1.25 = 2.40
    # Min = 3000 * 2.40 = 7200, Max = 7500 * 2.40 = 18000
    report = RepairCostEstimationEngine.estimate_repair_cost(
        evidence_assessment=evidence,
        vehicle_info={"make": "Hyundai", "model": "Creta"},
        region_tier="TIER_1_METRO",
    )
    item = report.itemizedRepairs[0]
    assert item.estimatedRange.min == 7200
    assert item.estimatedRange.max == 18000
    assert item.estimatedRange.median == 12600


# ── 4. Synergy Discount & Aggregation Tests ───────────────────────────────────

def test_two_items_synergy_discount_10_percent():
    evidence = {
        "findings": [
            {"damageClass": "scratch", "severity": "MINOR", "zone": "FRONT", "modelConfidence": 0.80},
            {"damageClass": "dent", "severity": "MINOR", "zone": "REAR", "modelConfidence": 0.75},
        ]
    }
    report = RepairCostEstimationEngine.estimate_repair_cost(
        evidence_assessment=evidence,
        vehicle_info={"make": "Maruti", "model": "Swift"},
        region_tier="TIER_2",
    )
    assert report.synergyDiscountApplied.itemsCount == 2
    assert report.synergyDiscountApplied.discountPercentage == 10
    # Scratch (500-1500) + PDR (1000-2500) = Raw (1500 - 4000)
    # With 10% discount: Min = 1350, Max = 3600
    assert report.totalEstimatedRange.min == 1350
    assert report.totalEstimatedRange.max == 3600


def test_three_plus_items_synergy_discount_15_percent():
    evidence = {
        "findings": [
            {"damageClass": "scratch", "severity": "MINOR", "zone": "FRONT", "modelConfidence": 0.80},
            {"damageClass": "dent", "severity": "MINOR", "zone": "REAR", "modelConfidence": 0.75},
            {"damageClass": "crack", "severity": "MODERATE", "zone": "FRONT", "modelConfidence": 0.70},
        ]
    }
    report = RepairCostEstimationEngine.estimate_repair_cost(
        evidence_assessment=evidence,
        vehicle_info={"make": "Tata", "model": "Nexon"},
        region_tier="TIER_2",
    )
    assert report.synergyDiscountApplied.itemsCount == 3
    assert report.synergyDiscountApplied.discountPercentage == 15
    assert report.totalEstimatedRange.min < report.totalEstimatedRange.max


# ── 5. Edge Cases & API Tests ─────────────────────────────────────────────────

def test_clean_vehicle_zero_repair_cost():
    evidence = {"findings": [], "status": "COMPLETE"}
    report = RepairCostEstimationEngine.estimate_repair_cost(evidence_assessment=evidence)
    assert report.status == "NO_DAMAGE_DETECTED"
    assert report.totalEstimatedRange.min == 0
    assert report.totalEstimatedRange.max == 0
    assert report.totalEstimatedRange.median == 0
    assert len(report.itemizedRepairs) == 0


def test_insufficient_evidence_null_cost():
    evidence = {"status": "INSUFFICIENT_EVIDENCE"}
    report = RepairCostEstimationEngine.estimate_repair_cost(evidence_assessment=evidence)
    assert report.status == "INSUFFICIENT_EVIDENCE"
    assert report.totalEstimatedRange.min is None


def test_duplicate_finding_excluded_from_cost():
    evidence = {
        "findings": [
            {"damageClass": "scratch", "severity": "MINOR", "zone": "FRONT", "isDuplicateEvidence": False},
            {"damageClass": "scratch", "severity": "MINOR", "zone": "FRONT", "isDuplicateEvidence": True},
        ]
    }
    report = RepairCostEstimationEngine.estimate_repair_cost(evidence_assessment=evidence)
    assert len(report.itemizedRepairs) == 1


def test_fastapi_repair_estimate_endpoint():
    payload = {
        "inspectionId": "test-insp-repair",
        "vehicleInfo": {"make": "Mahindra", "model": "Thar", "year": 2023},
        "regionTier": "TIER_1_METRO",
        "evidenceAssessment": {
            "findings": [
                {
                    "evidenceId": "ev-01",
                    "damageClass": "dent",
                    "severity": "MODERATE",
                    "zone": "FRONT_RIGHT",
                    "modelConfidence": 0.82,
                }
            ]
        },
    }
    response = client.post("/api/v1/repair/estimate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "REPAIR_V1"
    assert data["currency"] == "INR"
    assert data["totalEstimatedRange"]["min"] > 0
    assert len(data["itemizedRepairs"]) == 1
    assert data["multipliersApplied"]["region"] == "TIER_1_METRO"
