# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 9: Trust Score & Completeness Unit Tests
# Tests Evidence Completeness, Reliability, Trust Scoring, Caps, Bands, & API
# ═══════════════════════════════════════════════════════════════

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.trust_score_service import (
    EvidenceCompletenessEngine,
    ModelConfidenceEngine,
    CrossViewConsistencyEngine,
    EvidenceReliabilityEngine,
    TrustBandEngine,
    TrustScoreEngine,
    TRUST_V1_CONFIG,
)

client = TestClient(app)


# ── 1. Completeness & Usability Tests ──────────────────────────────────────────

def test_all_mandatory_views_present():
    images = [
        {"viewType": "FRONT", "qualityStatus": "PASS", "qualityScore": 90},
        {"viewType": "REAR", "qualityStatus": "PASS", "qualityScore": 88},
        {"viewType": "LEFT", "qualityStatus": "PASS", "qualityScore": 92},
        {"viewType": "RIGHT", "qualityStatus": "PASS", "qualityScore": 85},
    ]
    rep, blindspots = EvidenceCompletenessEngine.evaluate_completeness(images)
    assert rep.mandatoryCoverage == 1.0
    assert rep.mandatoryViewsComplete is True
    assert rep.usableImageCount == 4
    assert rep.mandatoryDisclosureRatio == 1.0
    assert rep.coverageScore == pytest.approx(0.70, rel=1e-2)  # 0.7*1.0 + 0.3*0


def test_missing_single_mandatory_view():
    images = [
        {"viewType": "FRONT", "qualityStatus": "PASS"},
        {"viewType": "REAR", "qualityStatus": "PASS"},
        {"viewType": "LEFT", "qualityStatus": "PASS"},
    ]
    rep, blindspots = EvidenceCompletenessEngine.evaluate_completeness(images)
    assert rep.mandatoryCoverage == 0.75
    assert rep.mandatoryViewsComplete is False
    assert any(b.type == "MISSING_MANDATORY_VIEW" and b.viewType == "RIGHT" for b in blindspots)


def test_two_missing_mandatory_views():
    images = [
        {"viewType": "FRONT", "qualityStatus": "PASS"},
        {"viewType": "REAR", "qualityStatus": "PASS"},
    ]
    rep, blindspots = EvidenceCompletenessEngine.evaluate_completeness(images)
    assert rep.mandatoryCoverage == 0.50
    assert rep.mandatoryViewsComplete is False
    mand_blindspots = [b for b in blindspots if b.type == "MISSING_MANDATORY_VIEW"]
    assert len(mand_blindspots) == 2


def test_optional_coverage_calculation():
    images = [
        {"viewType": "FRONT", "qualityStatus": "PASS"},
        {"viewType": "REAR", "qualityStatus": "PASS"},
        {"viewType": "LEFT", "qualityStatus": "PASS"},
        {"viewType": "RIGHT", "qualityStatus": "PASS"},
        {"viewType": "FRONT_LEFT", "qualityStatus": "PASS"},
        {"viewType": "FRONT_RIGHT", "qualityStatus": "PASS"},
        {"viewType": "REAR_LEFT", "qualityStatus": "PASS"},
        {"viewType": "REAR_RIGHT", "qualityStatus": "PASS"},
    ]
    rep, blindspots = EvidenceCompletenessEngine.evaluate_completeness(images)
    assert rep.mandatoryCoverage == 1.0
    assert rep.optionalCoverage == 4.0 / 8.0  # 0.50
    # C_evidence = 0.70 * 1.0 + 0.30 * 0.50 = 0.85
    assert rep.coverageScore == pytest.approx(0.85, rel=1e-2)


def test_iqa_pass_warn_fail_contributions():
    images = [
        {"viewType": "FRONT", "qualityStatus": "PASS"},
        {"viewType": "REAR", "qualityStatus": "WARN"},
        {"viewType": "LEFT", "qualityStatus": "FAIL"},
        {"viewType": "RIGHT", "qualityStatus": "PASS"},
    ]
    rep, blindspots = EvidenceCompletenessEngine.evaluate_completeness(images)
    # 3 submitted usable (FRONT, REAR, RIGHT) - LEFT is unusable
    assert rep.usableImageCount == 3
    assert rep.mandatoryCoverage == 0.75
    assert any(b.type == "IQA_FAIL_VIEW" and b.viewType == "LEFT" for b in blindspots)
    assert any(b.type == "LOW_QUALITY_VIEW" and b.viewType == "REAR" for b in blindspots)


def test_duplicate_image_exclusion_from_coverage():
    images = [
        {"viewType": "FRONT", "qualityStatus": "PASS", "isDuplicate": False},
        {"viewType": "REAR", "qualityStatus": "PASS", "isDuplicate": True},
        {"viewType": "LEFT", "qualityStatus": "PASS", "isDuplicate": False},
        {"viewType": "RIGHT", "qualityStatus": "PASS", "isDuplicate": False},
    ]
    rep, blindspots = EvidenceCompletenessEngine.evaluate_completeness(images)
    assert rep.usableImageCount == 3
    assert any(b.type == "DUPLICATE_VIEW" and b.viewType == "REAR" for b in blindspots)


# ── 2. Model Confidence & Cross-View Tests ────────────────────────────────────

def test_no_cv_detections_clean_vehicle():
    conf, status = ModelConfidenceEngine.aggregate_confidence([], usable_image_count=4, iqa_avg_score=85.0)
    assert conf == 0.90
    assert status == "NO_VISIBLE_DAMAGE_DETECTED"


def test_no_cv_detections_poor_evidence():
    conf, status = ModelConfidenceEngine.aggregate_confidence([], usable_image_count=2, iqa_avg_score=55.0)
    assert conf == 0.55
    assert status == "UNABLE_TO_ESTABLISH_ABSENCE_DUE_TO_COVERAGE"


def test_model_confidence_aggregation_weighted():
    findings = [
        {"confidenceBand": "HIGH_CONFIDENCE", "modelConfidence": 0.80},
        {"confidenceBand": "POTENTIAL", "modelConfidence": 0.50},
    ]
    # Weight: 1.0 * 0.80 + 0.5 * 0.50 = 1.05 / 1.5 = 0.70
    conf, status = ModelConfidenceEngine.aggregate_confidence(findings, usable_image_count=4, iqa_avg_score=80.0)
    assert conf == pytest.approx(0.70, rel=1e-2)
    assert status == "CONFIDENCE_AGGREGATED"


def test_cross_view_consistency_scoring():
    # Corroborated cross-view pattern
    c1 = CrossViewConsistencyEngine.compute_consistency([{"type": "POSSIBLE_REPEATED_DAMAGE_PATTERN"}], [{"damageClass": "dent"}], 4)
    assert c1 == 0.95

    # Single view vehicle
    c2 = CrossViewConsistencyEngine.compute_consistency([], [{"damageClass": "dent"}], 1)
    assert c2 == 0.50

    # Clean multi-view
    c3 = CrossViewConsistencyEngine.compute_consistency([], [], 4)
    assert c3 == 0.90


# ── 3. Reliability & Trust Gating Tests ────────────────────────────────────────

def test_evidence_reliability_formula():
    # R = 0.35*C + 0.25*R_iqa + 0.25*C_model + 0.15*Cross
    r = EvidenceReliabilityEngine.calculate_reliability(
        c_evidence=1.0,
        r_iqa=1.0,
        c_model=1.0,
        cross_view_consistency=1.0,
    )
    assert r == 1.0


def test_trust_score_mandatory_caps_single_missing():
    images = [
        {"viewType": "FRONT", "qualityStatus": "PASS"},
        {"viewType": "REAR", "qualityStatus": "PASS"},
        {"viewType": "LEFT", "qualityStatus": "PASS"},
        # RIGHT is missing -> 1 mandatory missing -> capped at 69
    ]
    report = TrustScoreEngine.evaluate_trust(images)
    assert report.trustScore.trustScore is not None
    assert report.trustScore.trustScore <= 69
    assert any("69" in cap for cap in report.trustScore.capsApplied)
    assert report.assessmentStatus == "LIMITED_ASSESSMENT"


def test_trust_score_mandatory_caps_two_missing():
    images = [
        {"viewType": "FRONT", "qualityStatus": "PASS"},
        {"viewType": "REAR", "qualityStatus": "PASS"},
        # LEFT & RIGHT missing -> 2 mandatory missing -> capped at 49
    ]
    report = TrustScoreEngine.evaluate_trust(images)
    assert report.trustScore.trustScore is not None
    assert report.trustScore.trustScore <= 49
    assert any("49" in cap for cap in report.trustScore.capsApplied)
    assert report.trustScore.trustBand == "INSUFFICIENT_EVIDENCE"
    assert report.assessmentStatus == "INSUFFICIENT_EVIDENCE"


def test_multiple_iqa_failures_trust_cap():
    images = [
        {"viewType": "FRONT", "qualityStatus": "FAIL"},
        {"viewType": "REAR", "qualityStatus": "FAIL"},
        {"viewType": "LEFT", "qualityStatus": "PASS"},
        {"viewType": "RIGHT", "qualityStatus": "PASS"},
    ]
    report = TrustScoreEngine.evaluate_trust(images)
    assert report.trustScore.trustScore <= 59


def test_trust_bands():
    assert TrustBandEngine.get_band(85, 4, True) == "HIGH_CONFIDENCE"
    assert TrustBandEngine.get_band(72, 4, True) == "MODERATE_CONFIDENCE"
    assert TrustBandEngine.get_band(55, 4, False) == "PROCEED_WITH_CAUTION"
    assert TrustBandEngine.get_band(45, 2, False) == "INSUFFICIENT_EVIDENCE"
    assert TrustBandEngine.get_band(None, 0, False) == "INSUFFICIENT_EVIDENCE"


# ── 4. End-to-End Scenarios & Empty Case ──────────────────────────────────────

def test_empty_inspection_trust_handling():
    report = TrustScoreEngine.evaluate_trust([])
    assert report.assessmentStatus == "INSUFFICIENT_EVIDENCE"
    assert report.trustScore.trustScore is None
    assert report.trustScore.trustBand == "INSUFFICIENT_EVIDENCE"
    assert report.conditionScoreStatus == "INSUFFICIENT_EVIDENCE"


def test_scenario_a_strong_evidence():
    images = [
        {"viewType": "FRONT", "qualityStatus": "PASS", "qualityScore": 95},
        {"viewType": "REAR", "qualityStatus": "PASS", "qualityScore": 92},
        {"viewType": "LEFT", "qualityStatus": "PASS", "qualityScore": 94},
        {"viewType": "RIGHT", "qualityStatus": "PASS", "qualityScore": 90},
        {"viewType": "FRONT_LEFT", "qualityStatus": "PASS", "qualityScore": 88},
        {"viewType": "FRONT_RIGHT", "qualityStatus": "PASS", "qualityScore": 89},
        {"viewType": "REAR_LEFT", "qualityStatus": "PASS", "qualityScore": 87},
        {"viewType": "REAR_RIGHT", "qualityStatus": "PASS", "qualityScore": 91},
    ]
    evidence_assessment = {
        "findings": [
            {"className": "scratch", "modelConfidence": 0.82, "confidenceBand": "HIGH_CONFIDENCE"}
        ],
        "crossViewObservations": [],
    }
    report = TrustScoreEngine.evaluate_trust(images, evidence_assessment)
    assert report.assessmentStatus == "READY_FOR_ASSESSMENT"
    assert report.trustScore.trustScore >= 80
    assert report.trustScore.trustBand == "HIGH_CONFIDENCE"
    assert len(report.trustScore.capsApplied) == 0


def test_scenario_d_clean_vehicle_good_evidence():
    images = [
        {"viewType": "FRONT", "qualityStatus": "PASS", "qualityScore": 95},
        {"viewType": "REAR", "qualityStatus": "PASS", "qualityScore": 92},
        {"viewType": "LEFT", "qualityStatus": "PASS", "qualityScore": 94},
        {"viewType": "RIGHT", "qualityStatus": "PASS", "qualityScore": 90},
    ]
    report = TrustScoreEngine.evaluate_trust(images, {"findings": [], "crossViewObservations": []})
    assert report.modelConfidenceStatus == "NO_VISIBLE_DAMAGE_DETECTED"
    assert report.assessmentStatus == "READY_FOR_ASSESSMENT"
    assert report.trustScore.trustBand in ["HIGH_CONFIDENCE", "MODERATE_CONFIDENCE"]


# ── 5. FastAPI Endpoint Test ──────────────────────────────────────────────────

def test_fastapi_trust_analyze_endpoint():
    payload = {
        "inspectionId": "test-insp-trust",
        "submittedImages": [
            {"viewType": "FRONT", "qualityStatus": "PASS", "qualityScore": 90},
            {"viewType": "REAR", "qualityStatus": "PASS", "qualityScore": 85},
            {"viewType": "LEFT", "qualityStatus": "PASS", "qualityScore": 88},
            {"viewType": "RIGHT", "qualityStatus": "PASS", "qualityScore": 92},
        ],
        "evidenceAssessment": {
            "findings": [],
            "crossViewObservations": [],
        },
    }
    response = client.post("/api/v1/trust/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "TRUST_V1"
    assert data["assessmentStatus"] == "READY_FOR_ASSESSMENT"
    assert data["trustScore"]["trustScore"] is not None
    assert data["evidenceCompleteness"]["mandatoryViewsComplete"] is True
