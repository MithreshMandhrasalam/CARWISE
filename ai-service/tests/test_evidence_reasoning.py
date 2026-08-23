# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 8: Evidence Reasoning Automated Unit Tests
# Tests BBox Validation, Zone Mapping, Severity Engine,
# Cross-View Reasoning, Deduplication, Condition Score, & API
# ═══════════════════════════════════════════════════════════════

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.evidence_reasoning_service import (
    BoundingBoxValidator,
    BoundingBoxCoord,
    VehicleZoneMapper,
    DamageSeverityEngine,
    CrossViewEvidenceService,
    ConditionScoreEngine,
    EvidenceAssessmentService,
    DAMAGE_CLASS_PRIORITY,
    CANONICAL_ZONES,
)

client = TestClient(app)


# ── 1. Bounding Box Validation & Area Tests ────────────────────────────────────

def test_valid_bbox_area_calculation():
    bbox = {"xMin": 0.10, "yMin": 0.20, "xMax": 0.40, "yMax": 0.50}
    valid, area, err = BoundingBoxValidator.validate_and_compute_area(bbox)
    assert valid is True
    assert area == pytest.approx(0.09, rel=1e-3)
    assert err is None


def test_invalid_bbox_rejections():
    # Negative coordinates
    v1, _, err1 = BoundingBoxValidator.validate_and_compute_area({"xMin": -0.1, "yMin": 0.0, "xMax": 0.5, "yMax": 0.5})
    assert v1 is False

    # Out of bounds (> 1.0)
    v2, _, err2 = BoundingBoxValidator.validate_and_compute_area({"xMin": 0.1, "yMin": 0.0, "xMax": 1.2, "yMax": 0.5})
    assert v2 is False

    # Inverted horizontal (xMin >= xMax)
    v3, _, err3 = BoundingBoxValidator.validate_and_compute_area({"xMin": 0.6, "yMin": 0.1, "xMax": 0.4, "yMax": 0.5})
    assert v3 is False

    # Inverted vertical (yMin >= yMax)
    v4, _, err4 = BoundingBoxValidator.validate_and_compute_area({"xMin": 0.1, "yMin": 0.8, "xMax": 0.4, "yMax": 0.2})
    assert v4 is False

    # Zero area
    v5, _, err5 = BoundingBoxValidator.validate_and_compute_area({"xMin": 0.2, "yMin": 0.3, "xMax": 0.2, "yMax": 0.5})
    assert v5 is False


def test_iou_calculation():
    boxA = BoundingBoxCoord(xMin=0.0, yMin=0.0, xMax=0.5, yMax=0.5)
    boxB = BoundingBoxCoord(xMin=0.0, yMin=0.0, xMax=0.5, yMax=0.5)
    assert BoundingBoxValidator.compute_iou(boxA, boxB) == 1.0

    boxC = BoundingBoxCoord(xMin=0.5, yMin=0.5, xMax=1.0, yMax=1.0)
    assert BoundingBoxValidator.compute_iou(boxA, boxC) == 0.0

    boxD = BoundingBoxCoord(xMin=0.25, yMin=0.0, xMax=0.75, yMax=0.5)
    iou = BoundingBoxValidator.compute_iou(boxA, boxD)
    assert 0.30 <= iou <= 0.40


# ── 2. Severity Engine Tests ──────────────────────────────────────────────────

def test_minor_severity():
    # Small scratch / dent (area < 0.03)
    res1 = DamageSeverityEngine.calculate_severity("scratch", 0.015, "FRONT")
    assert res1["severity"] == "MINOR"
    assert "superficial_flaw_area_ratio_lt_0.03" in res1["basis"]

    res2 = DamageSeverityEngine.calculate_severity("dent", 0.025, "LEFT_SIDE")
    assert res2["severity"] == "MINOR"


def test_moderate_severity():
    # Crack or Lamp broken
    res1 = DamageSeverityEngine.calculate_severity("crack", 0.02, "FRONT")
    assert res1["severity"] == "MODERATE"

    res2 = DamageSeverityEngine.calculate_severity("lamp_broken", 0.01, "FRONT_RIGHT")
    assert res2["severity"] == "MODERATE"

    # Moderate dent/scratch with area >= 0.03 and < 0.10
    res3 = DamageSeverityEngine.calculate_severity("dent", 0.055, "FRONT")
    assert res3["severity"] == "MODERATE"


def test_severe_severity():
    # Glass shatter or flat tire
    res1 = DamageSeverityEngine.calculate_severity("glass_shatter", 0.02, "FRONT")
    assert res1["severity"] == "SEVERE"

    res2 = DamageSeverityEngine.calculate_severity("tire_flat", 0.04, "FRONT_LEFT")
    assert res2["severity"] == "SEVERE"

    # Very large damage area >= 0.10
    res3 = DamageSeverityEngine.calculate_severity("dent", 0.12, "REAR")
    assert res3["severity"] == "SEVERE"
    assert "large_area_damage_coverage_ratio_gte_0.10" in res3["basis"]


def test_damage_class_priority_weights():
    assert DAMAGE_CLASS_PRIORITY["glass_shatter"] == 5
    assert DAMAGE_CLASS_PRIORITY["tire_flat"] == 5
    assert DAMAGE_CLASS_PRIORITY["lamp_broken"] == 4
    assert DAMAGE_CLASS_PRIORITY["crack"] == 4
    assert DAMAGE_CLASS_PRIORITY["dent"] == 2
    assert DAMAGE_CLASS_PRIORITY["scratch"] == 1


# ── 3. Vehicle Zone Mapping Tests ─────────────────────────────────────────────

def test_zone_mapping_canonical_coverage():
    box_center = BoundingBoxCoord(xMin=0.4, yMin=0.4, xMax=0.6, yMax=0.6)
    box_left = BoundingBoxCoord(xMin=0.1, yMin=0.4, xMax=0.25, yMax=0.6)
    box_right = BoundingBoxCoord(xMin=0.75, yMin=0.4, xMax=0.9, yMax=0.6)

    m1 = VehicleZoneMapper.map_to_zone("FRONT", box_center, "scratch")
    assert m1["zone"] == "FRONT"

    m2 = VehicleZoneMapper.map_to_zone("FRONT", box_left, "scratch")
    assert m2["zone"] == "FRONT_LEFT"

    m3 = VehicleZoneMapper.map_to_zone("FRONT", box_right, "scratch")
    assert m3["zone"] == "FRONT_RIGHT"

    m4 = VehicleZoneMapper.map_to_zone("REAR", box_center, "dent")
    assert m4["zone"] == "REAR"

    m5 = VehicleZoneMapper.map_to_zone("LEFT", box_center, "dent")
    assert m5["zone"] == "LEFT_SIDE"

    m6 = VehicleZoneMapper.map_to_zone("RIGHT", box_center, "dent")
    assert m6["zone"] == "RIGHT_SIDE"


# ── 4. Cross-View Reasoning & Deduplication Tests ─────────────────────────────

def test_duplicate_evidence_detection():
    raw_results = [
        {
            "imageId": "img-01",
            "viewType": "FRONT",
            "status": "COMPLETE",
            "detections": [
                {
                    "className": "scratch",
                    "confidence": 0.85,
                    "confidenceBand": "HIGH_CONFIDENCE",
                    "bbox": {"xMin": 0.40, "yMin": 0.40, "xMax": 0.60, "yMax": 0.60},
                },
                {
                    # Duplicate near identical box in same view
                    "className": "scratch",
                    "confidence": 0.82,
                    "confidenceBand": "HIGH_CONFIDENCE",
                    "bbox": {"xMin": 0.41, "yMin": 0.40, "xMax": 0.61, "yMax": 0.60},
                },
            ],
        }
    ]

    report = EvidenceAssessmentService.evaluate_inspection_evidence(raw_results)
    assert report.totalEvidenceCount == 2
    assert report.uniqueFindingCount == 1

    dup = [f for f in report.findings if f.isDuplicateEvidence]
    assert len(dup) == 1
    assert dup[0].duplicateOf is not None


def test_cross_view_observation_generation():
    raw_results = [
        {
            "imageId": "img-front",
            "viewType": "FRONT",
            "status": "COMPLETE",
            "detections": [
                {
                    "className": "dent",
                    "confidence": 0.80,
                    "confidenceBand": "HIGH_CONFIDENCE",
                    "bbox": {"xMin": 0.70, "yMin": 0.40, "xMax": 0.85, "yMax": 0.60},  # Maps to FRONT_RIGHT
                }
            ],
        },
        {
            "imageId": "img-front-right",
            "viewType": "FRONT_RIGHT",
            "status": "COMPLETE",
            "detections": [
                {
                    "className": "dent",
                    "confidence": 0.75,
                    "confidenceBand": "HIGH_CONFIDENCE",
                    "bbox": {"xMin": 0.30, "yMin": 0.35, "xMax": 0.50, "yMax": 0.55},  # Maps to FRONT_RIGHT
                }
            ],
        },
    ]

    report = EvidenceAssessmentService.evaluate_inspection_evidence(raw_results)
    assert len(report.crossViewObservations) >= 1
    obs = report.crossViewObservations[0]
    assert obs.type == "POSSIBLE_REPEATED_DAMAGE_PATTERN"
    assert "FRONT_RIGHT" in obs.zones
    assert "hands-on physical verification" in obs.statement
    assert "crashed" not in obs.statement.lower()


# ── 5. Condition Score & Completeness Tests ────────────────────────────────────

def test_clean_inspection_condition_score():
    raw_results = [
        {"viewType": "FRONT", "status": "COMPLETE", "detections": []},
        {"viewType": "REAR", "status": "COMPLETE", "detections": []},
        {"viewType": "LEFT", "status": "COMPLETE", "detections": []},
        {"viewType": "RIGHT", "status": "COMPLETE", "detections": []},
    ]
    report = EvidenceAssessmentService.evaluate_inspection_evidence(raw_results, submitted_views=["FRONT", "REAR", "LEFT", "RIGHT"])
    assert report.conditionScore.score == 100
    assert len(report.conditionScore.deductions) == 0
    assert report.evidenceCompleteness.mandatoryViewsComplete is True
    assert len(report.evidenceCompleteness.blindspots) == 0


def test_damaged_inspection_condition_score_deductions():
    raw_results = [
        {
            "viewType": "FRONT",
            "status": "COMPLETE",
            "detections": [
                {
                    "className": "scratch",
                    "confidence": 0.80,
                    "bbox": {"xMin": 0.40, "yMin": 0.40, "xMax": 0.45, "yMax": 0.45},  # Minor (5 pts)
                },
                {
                    "className": "crack",
                    "confidence": 0.75,
                    "bbox": {"xMin": 0.10, "yMin": 0.20, "xMax": 0.25, "yMax": 0.35},  # Moderate (15 pts)
                },
            ],
        },
        {
            "viewType": "REAR",
            "status": "COMPLETE",
            "detections": [
                {
                    "className": "glass_shatter",
                    "confidence": 0.88,
                    "bbox": {"xMin": 0.30, "yMin": 0.20, "xMax": 0.70, "yMax": 0.50},  # Severe (30 pts)
                }
            ],
        },
    ]

    report = EvidenceAssessmentService.evaluate_inspection_evidence(raw_results)
    # Deductions: 5 (minor scratch in FRONT) + 15 (mod crack in FRONT_LEFT) + 30 (severe glass in REAR) = 50 pts
    assert report.conditionScore.score == 50
    assert len(report.conditionScore.deductions) == 3


def test_iqa_blocked_image_excluded_from_damage():
    raw_results = [
        {
            "imageId": "bad-img",
            "viewType": "FRONT",
            "status": "BLOCKED_BY_IQA",
            "detections": [],
            "iqa": {"qualityStatus": "FAIL"},
        }
    ]
    report = EvidenceAssessmentService.evaluate_inspection_evidence(raw_results)
    assert report.totalEvidenceCount == 0
    assert report.conditionScore.score == 100
    assert report.evidenceCompleteness.usableImageCount == 0


def test_trust_score_contract_placeholder():
    report = EvidenceAssessmentService.evaluate_inspection_evidence([])
    assert report.trustScore.trustScore is None
    assert report.trustScore.status == "PENDING_TRUST_MODEL"
    assert "Trust scoring requires evidence completeness" in report.trustScore.reason


# ── 6. FastAPI Evidence Analyze Endpoint Test ──────────────────────────────────

def test_fastapi_evidence_analyze_api():
    payload = {
        "inspectionId": "test-insp-p8",
        "submittedViews": ["FRONT", "REAR", "LEFT", "RIGHT"],
        "damageResults": [
            {
                "imageId": "img-01",
                "viewType": "FRONT",
                "status": "COMPLETE",
                "detections": [
                    {
                        "className": "scratch",
                        "classId": 0,
                        "confidence": 0.80,
                        "confidenceBand": "HIGH_CONFIDENCE",
                        "bbox": {"xMin": 0.20, "yMin": 0.40, "xMax": 0.30, "yMax": 0.50},
                    }
                ],
            }
        ],
    }

    response = client.post("/api/v1/evidence/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "EVIDENCE_V1"
    assert data["totalEvidenceCount"] == 1
    assert data["conditionScore"]["score"] == 95
    assert len(data["zones"]) == 1
    assert data["zones"][0]["zone"] == "FRONT_LEFT"
