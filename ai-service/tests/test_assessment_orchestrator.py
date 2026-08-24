# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 12: Assessment Orchestrator Unit & Integration Tests
# Validates End-to-End Execution, Version Integrity, Timings, & API
# ═══════════════════════════════════════════════════════════════

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.assessment_orchestrator import AssessmentOrchestrator

client = TestClient(app)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def standard_clean_vehicle_payload():
    return {
        "vehicleInfo": {
            "make": "Hyundai",
            "model": "Creta",
            "year": 2023,
            "mileageKm": 28000,
            "askingPrice": 1150000,
            "fuelType": "diesel",
            "transmission": "automatic",
        },
        "images": [
            {"imageId": "img-01", "viewType": "FRONT", "qualityStatus": "PASS"},
            {"imageId": "img-02", "viewType": "REAR", "qualityStatus": "PASS"},
            {"imageId": "img-03", "viewType": "LEFT", "qualityStatus": "PASS"},
            {"imageId": "img-04", "viewType": "RIGHT", "qualityStatus": "PASS"},
        ],
        "damageDetections": [
            {"imageId": "img-01", "viewType": "FRONT", "detections": []},
            {"imageId": "img-02", "viewType": "REAR", "detections": []},
            {"imageId": "img-03", "viewType": "LEFT", "detections": []},
            {"imageId": "img-04", "viewType": "RIGHT", "detections": []},
        ],
    }


@pytest.fixture
def damaged_vehicle_payload():
    return {
        "vehicleInfo": {
            "make": "Maruti",
            "model": "Swift",
            "year": 2021,
            "mileageKm": 52000,
            "askingPrice": 480000,
        },
        "images": [
            {"imageId": "img-s1", "viewType": "FRONT", "qualityStatus": "PASS"},
            {"imageId": "img-s2", "viewType": "REAR", "qualityStatus": "PASS"},
            {"imageId": "img-s3", "viewType": "LEFT", "qualityStatus": "PASS"},
            {"imageId": "img-s4", "viewType": "RIGHT", "qualityStatus": "PASS"},
        ],
        "damageDetections": [
            {
                "imageId": "img-s1",
                "viewType": "FRONT",
                "detections": [
                    {
                        "className": "dent",
                        "classId": 1,
                        "confidence": 0.88,
                        "confidenceBand": "HIGH_CONFIDENCE",
                        "bbox": {"xMin": 0.2, "yMin": 0.3, "xMax": 0.4, "yMax": 0.5},
                    }
                ],
            },
            {
                "imageId": "img-s3",
                "viewType": "LEFT",
                "detections": [
                    {
                        "className": "scratch",
                        "classId": 0,
                        "confidence": 0.82,
                        "confidenceBand": "HIGH_CONFIDENCE",
                        "bbox": {"xMin": 0.1, "yMin": 0.2, "xMax": 0.3, "yMax": 0.35},
                    }
                ],
            },
        ],
    }


# ── 1. End-to-End Orchestrator Execution Tests ─────────────────────────────────

def test_clean_vehicle_orchestration(standard_clean_vehicle_payload):
    report = AssessmentOrchestrator.orchestrate_assessment(
        inspection_id="insp-clean-01",
        vehicle_info=standard_clean_vehicle_payload["vehicleInfo"],
        images=standard_clean_vehicle_payload["images"],
        damage_detections=standard_clean_vehicle_payload["damageDetections"],
    )

    assert report.assessmentVersion == "CARWISE_ASSESSMENT_V1"
    assert report.inspectionId == "insp-clean-01"
    assert report.overallStatus in ["COMPLETED", "LIMITED_ASSESSMENT"]
    assert report.conditionScore["score"] == 100
    assert report.buyerTrustScore["trustScore"] >= 80
    assert report.repairCostAssessment["totalEstimatedRange"]["median"] == 0
    assert report.priceValuation["fairMarketValueRange"]["midpoint"] > 0
    assert report.evidenceCompleteness["mandatoryViewsComplete"] is True


def test_damaged_vehicle_orchestration(damaged_vehicle_payload):
    report = AssessmentOrchestrator.orchestrate_assessment(
        inspection_id="insp-dmg-01",
        vehicle_info=damaged_vehicle_payload["vehicleInfo"],
        images=damaged_vehicle_payload["images"],
        damage_detections=damaged_vehicle_payload["damageDetections"],
    )

    assert report.assessmentVersion == "CARWISE_ASSESSMENT_V1"
    assert report.conditionScore["score"] < 100
    assert report.repairCostAssessment["totalEstimatedRange"]["median"] > 0
    assert len(report.repairCostAssessment["itemizedRepairs"]) >= 2
    assert report.priceValuation["status"] in ["FAIRLY_PRICED", "BELOW_FAIR_RANGE", "ABOVE_FAIR_RANGE"]


def test_empty_inspection_insufficient_evidence():
    report = AssessmentOrchestrator.orchestrate_assessment(
        inspection_id="insp-empty-01",
        vehicle_info={"make": "Tata", "model": "Nexon", "year": 2022},
        images=[],
        damage_detections=[],
    )

    assert report.overallStatus == "INSUFFICIENT_EVIDENCE"
    assert report.executiveVerdict["verdictCode"] == "INSUFFICIENT_EVIDENCE"
    assert report.buyerTrustScore["trustScore"] is None
    assert report.priceValuation["fairMarketValueRange"]["midpoint"] is None


def test_missing_mandatory_view_caps_and_blindspots():
    images = [
        {"imageId": "img-01", "viewType": "FRONT", "qualityStatus": "PASS"},
        {"imageId": "img-02", "viewType": "REAR", "qualityStatus": "PASS"},
        {"imageId": "img-03", "viewType": "LEFT", "qualityStatus": "PASS"},
        # RIGHT view missing
    ]
    report = AssessmentOrchestrator.orchestrate_assessment(
        inspection_id="insp-missing-01",
        vehicle_info={"make": "Toyota", "model": "Fortuner", "year": 2022, "askingPrice": 2800000},
        images=images,
        damage_detections=[],
    )

    assert report.overallStatus in ["LIMITED_ASSESSMENT", "COMPLETED"]
    assert report.buyerTrustScore["trustScore"] <= 75
    assert any(b["viewType"] == "RIGHT" for b in report.blindspots)


def test_iqa_failure_tracking():
    images = [
        {"imageId": "img-01", "viewType": "FRONT", "qualityStatus": "PASS"},
        {"imageId": "img-02", "viewType": "REAR", "qualityStatus": "FAIL"},
        {"imageId": "img-03", "viewType": "LEFT", "qualityStatus": "WARN"},
        {"imageId": "img-04", "viewType": "RIGHT", "qualityStatus": "PASS"},
    ]
    report = AssessmentOrchestrator.orchestrate_assessment(
        inspection_id="insp-iqa-01",
        vehicle_info={"make": "Honda", "model": "City", "year": 2023},
        images=images,
        damage_detections=[],
    )

    assert report.iqaSummary["failCount"] == 1
    assert report.iqaSummary["warnCount"] == 1
    assert report.iqaSummary["allPassed"] is False


def test_component_versions_integrity(standard_clean_vehicle_payload):
    report = AssessmentOrchestrator.orchestrate_assessment(
        vehicle_info=standard_clean_vehicle_payload["vehicleInfo"],
        images=standard_clean_vehicle_payload["images"],
        damage_detections=standard_clean_vehicle_payload["damageDetections"],
    )

    assert report.componentVersions.iqa == "IQA_V1"
    assert report.componentVersions.cvDetector == "CV_BASELINE_V1"
    assert report.componentVersions.evidenceReasoning == "EVIDENCE_V1"
    assert report.componentVersions.conditionScore == "CONDITION_V1"
    assert report.componentVersions.trustScore == "TRUST_V1"
    assert report.componentVersions.repairCost == "REPAIR_V1"
    assert report.componentVersions.marketValuation == "VALUATION_V1"


def test_execution_timings_recorded(standard_clean_vehicle_payload):
    report = AssessmentOrchestrator.orchestrate_assessment(
        vehicle_info=standard_clean_vehicle_payload["vehicleInfo"],
        images=standard_clean_vehicle_payload["images"],
        damage_detections=standard_clean_vehicle_payload["damageDetections"],
    )

    assert report.timings.totalOrchestrationTimeMs >= 0.0
    assert report.timings.evidenceReasoningTimeMs >= 0.0
    assert report.timings.trustScoringTimeMs >= 0.0
    assert report.timings.repairCostTimeMs >= 0.0
    assert report.timings.valuationTimeMs >= 0.0


def test_global_disclaimers_present(standard_clean_vehicle_payload):
    report = AssessmentOrchestrator.orchestrate_assessment(
        vehicle_info=standard_clean_vehicle_payload["vehicleInfo"],
        images=standard_clean_vehicle_payload["images"],
    )

    assert len(report.limitations) >= 3
    assert any("physical verification" in lim.lower() for lim in report.limitations)
    assert any("structural chassis" in lim.lower() for lim in report.limitations)


def test_deterministic_orchestration_repeatability(damaged_vehicle_payload):
    rep1 = AssessmentOrchestrator.orchestrate_assessment(
        vehicle_info=damaged_vehicle_payload["vehicleInfo"],
        images=damaged_vehicle_payload["images"],
        damage_detections=damaged_vehicle_payload["damageDetections"],
    )
    rep2 = AssessmentOrchestrator.orchestrate_assessment(
        vehicle_info=damaged_vehicle_payload["vehicleInfo"],
        images=damaged_vehicle_payload["images"],
        damage_detections=damaged_vehicle_payload["damageDetections"],
    )

    assert rep1.conditionScore["score"] == rep2.conditionScore["score"]
    assert rep1.buyerTrustScore["trustScore"] == rep2.buyerTrustScore["trustScore"]
    assert rep1.repairCostAssessment["totalEstimatedRange"]["median"] == rep2.repairCostAssessment["totalEstimatedRange"]["median"]
    assert rep1.priceValuation["fairMarketValueRange"]["midpoint"] == rep2.priceValuation["fairMarketValueRange"]["midpoint"]


# ── 2. FastAPI Endpoint Tests ─────────────────────────────────────────────────

def test_fastapi_orchestrate_endpoint(standard_clean_vehicle_payload):
    payload = {
        "inspectionId": "fastapi-orch-01",
        "vehicleInfo": standard_clean_vehicle_payload["vehicleInfo"],
        "images": standard_clean_vehicle_payload["images"],
        "damageDetections": standard_clean_vehicle_payload["damageDetections"],
        "regionTier": "METRO_TIER_1",
    }

    response = client.post("/api/v1/assessment/orchestrate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["assessmentVersion"] == "CARWISE_ASSESSMENT_V1"
    assert data["inspectionId"] == "fastapi-orch-01"
    assert data["overallStatus"] in ["COMPLETED", "LIMITED_ASSESSMENT"]
    assert data["timings"]["totalOrchestrationTimeMs"] >= 0


def test_fastapi_evaluate_alias_endpoint(damaged_vehicle_payload):
    payload = {
        "inspectionId": "fastapi-eval-01",
        "vehicleInfo": damaged_vehicle_payload["vehicleInfo"],
        "images": damaged_vehicle_payload["images"],
        "damageDetections": damaged_vehicle_payload["damageDetections"],
    }

    response = client.post("/api/v1/assessment/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["assessmentVersion"] == "CARWISE_ASSESSMENT_V1"
    assert data["priceValuation"]["status"] in ["FAIRLY_PRICED", "BELOW_FAIR_RANGE", "ABOVE_FAIR_RANGE"]
