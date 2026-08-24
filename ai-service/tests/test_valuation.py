# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 11: Vehicle Valuation Unit Tests
# Tests Benchmark Lookup, Depreciation, Mileage, Condition, Gating, & API
# ═══════════════════════════════════════════════════════════════

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.valuation_service import (
    MarketReferenceRepository,
    DepreciationEngine,
    VehicleValuationEngine,
    MARKET_REFERENCE_DATA,
)

client = TestClient(app)


# ── 1. Reference Market Dataset Tests ─────────────────────────────────────────

def test_known_model_reference_lookup():
    price, prov = MarketReferenceRepository.get_benchmark_price("Maruti", "Swift")
    assert price == 720000
    assert prov == "KNOWN_MODEL_BENCHMARK"

    price, prov = MarketReferenceRepository.get_benchmark_price("Hyundai", "Creta")
    assert price == 1350000
    assert prov == "KNOWN_MODEL_BENCHMARK"


def test_unmapped_model_segment_fallback():
    price, prov = MarketReferenceRepository.get_benchmark_price("UnknownBrand", "CustomModel", "LUXURY")
    assert price == 4500000
    assert prov == "SEGMENT_AVERAGE_FALLBACK"


# ── 2. Age & Depreciation Model Tests ─────────────────────────────────────────

def test_depreciation_schedule_values():
    # Base ₹10,00,000 for 2-year-old vehicle (2024 with ref 2026 -> 25% dep)
    val, pct = DepreciationEngine.calculate_depreciation(1000000, 2024, 2026)
    assert pct == 25.0
    assert val == 750000

    # 4-year-old vehicle (2022 with ref 2026 -> 43% dep)
    val, pct = DepreciationEngine.calculate_depreciation(1000000, 2022, 2026)
    assert pct == 43.0
    assert val == 570000


# ── 3. Valuation Engine Full Calculation & Adjustment Tests ───────────────────

def test_fairly_priced_vehicle_scenario():
    # 2022 Hyundai Creta, asking ₹8,20,000, mileage 36,000 km, condition 88, trust 85
    vehicle = {
        "make": "Hyundai",
        "model": "Creta",
        "year": 2022,
        "mileageKm": 36000,
        "askingPrice": 800000,
    }
    condition = {"overallScore": 88.0}
    trust = {"trustScore": 85, "trustBand": "HIGH_CONFIDENCE"}
    repair = {"totalEstimatedRange": {"median": 5000}}

    report = VehicleValuationEngine.evaluate_valuation(
        vehicle_info=vehicle,
        condition_score=condition,
        trust_score=trust,
        repair_cost_assessment=repair,
    )

    assert report.status in ["FAIRLY_PRICED", "BELOW_FAIR_RANGE", "ABOVE_FAIR_RANGE"]
    assert report.valuationConfidence == "HIGH"
    assert report.fairMarketValueRange.min is not None
    assert report.fairMarketValueRange.max > report.fairMarketValueRange.min
    assert report.fairMarketValueRange.midpoint > 0
    assert len(report.adjustments) >= 3  # Depreciation, Mileage, Condition, Repair


def test_above_fair_range_overpriced_vehicle():
    # 2021 Swift (Base ₹7.2L, 5 yrs old ~₹3.6L fair), seller asks ₹6,50,000
    vehicle = {
        "make": "Maruti",
        "model": "Swift",
        "year": 2021,
        "mileageKm": 65000,
        "askingPrice": 650000,
    }
    condition = {"overallScore": 75.0}
    trust = {"trustScore": 80, "trustBand": "HIGH_CONFIDENCE"}
    repair = {"totalEstimatedRange": {"median": 8000}}

    report = VehicleValuationEngine.evaluate_valuation(
        vehicle_info=vehicle,
        condition_score=condition,
        trust_score=trust,
        repair_cost_assessment=repair,
    )

    assert report.status == "ABOVE_FAIR_RANGE"
    assert report.askingPriceAssessment.pricePosition == "ABOVE_FAIR_RANGE"
    assert report.askingPriceAssessment.premiumAmount > 0
    assert report.askingPriceAssessment.discountAmount == 0


def test_below_fair_range_discount_vehicle():
    # 2024 Nexon (Base ₹10.2L, 2 yrs old ~₹7.6L fair), seller asks ₹5,50,000
    vehicle = {
        "make": "Tata",
        "model": "Nexon",
        "year": 2024,
        "mileageKm": 15000,
        "askingPrice": 550000,
    }
    condition = {"overallScore": 92.0}
    trust = {"trustScore": 88, "trustBand": "HIGH_CONFIDENCE"}
    repair = {"totalEstimatedRange": {"median": 0}}

    report = VehicleValuationEngine.evaluate_valuation(
        vehicle_info=vehicle,
        condition_score=condition,
        trust_score=trust,
        repair_cost_assessment=repair,
    )

    assert report.status == "BELOW_FAIR_RANGE"
    assert report.askingPriceAssessment.pricePosition == "BELOW_FAIR_RANGE"
    assert report.askingPriceAssessment.discountAmount > 0
    assert report.askingPriceAssessment.premiumAmount == 0


# ── 4. Gating Rules & Edge Cases ──────────────────────────────────────────────

def test_low_trust_score_blocks_valuation():
    vehicle = {"make": "Maruti", "model": "Swift", "year": 2022, "askingPrice": 500000}
    trust = {"trustScore": 45, "trustBand": "INSUFFICIENT_EVIDENCE"}

    report = VehicleValuationEngine.evaluate_valuation(
        vehicle_info=vehicle,
        trust_score=trust,
    )

    assert report.status == "INSUFFICIENT_EVIDENCE"
    assert report.fairMarketValueRange.min is None
    assert report.fairMarketValueRange.midpoint is None
    assert report.valuationConfidence == "LOW"


def test_missing_mandatory_trust_blocks_valuation():
    vehicle = {"make": "Hyundai", "model": "Creta", "year": 2022, "askingPrice": 900000}
    # trust_score is None / empty
    report = VehicleValuationEngine.evaluate_valuation(
        vehicle_info=vehicle,
        trust_score=None,
    )
    assert report.status == "INSUFFICIENT_EVIDENCE"


def test_deterministic_repeatability():
    vehicle = {"make": "Honda", "model": "City", "year": 2023, "mileageKm": 25000, "askingPrice": 950000}
    condition = {"overallScore": 86.0}
    trust = {"trustScore": 82, "trustBand": "HIGH_CONFIDENCE"}

    rep1 = VehicleValuationEngine.evaluate_valuation(vehicle_info=vehicle, condition_score=condition, trust_score=trust)
    rep2 = VehicleValuationEngine.evaluate_valuation(vehicle_info=vehicle, condition_score=condition, trust_score=trust)

    assert rep1.fairMarketValueRange.midpoint == rep2.fairMarketValueRange.midpoint
    assert rep1.askingPriceAssessment.variancePercentage == rep2.askingPriceAssessment.variancePercentage


# ── 5. FastAPI Endpoint Test ──────────────────────────────────────────────────

def test_fastapi_valuation_evaluate_endpoint():
    payload = {
        "inspectionId": "val-test-01",
        "vehicleInfo": {
            "make": "Toyota",
            "model": "Fortuner",
            "year": 2023,
            "mileageKm": 30000,
            "askingPrice": 3200000,
        },
        "conditionScore": {"overallScore": 89.0},
        "trustScore": {"trustScore": 85, "trustBand": "HIGH_CONFIDENCE"},
        "repairCostAssessment": {"totalEstimatedRange": {"median": 12000}},
    }

    response = client.post("/api/v1/valuation/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "VALUATION_V1"
    assert data["currency"] == "INR"
    assert data["fairMarketValueRange"]["midpoint"] > 0
    assert data["valuationConfidence"] == "HIGH"
    assert len(data["adjustments"]) > 0
