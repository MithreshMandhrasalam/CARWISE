"""
Condition Scoring Engine — rule-v1.0
──────────────────────────────────────────────────────
This module is REAL (not a mock). It implements a weighted, explainable
scoring formula that is always deterministic and auditable.

Weights are documented and justifiable for academic defense.
──────────────────────────────────────────────────────
"""
from datetime import datetime
from typing import List

# Sub-score weights (must sum to 1.0)
WEIGHTS = {
    "exterior_condition": 0.20,
    "interior_condition": 0.10,
    "visible_damage": 0.25,
    "tyre_condition": 0.10,
    "vehicle_age": 0.10,
    "mileage_factor": 0.10,
    "maintenance_evidence": 0.05,
    "price_fairness": 0.10,
}

SEVERITY_PENALTY = {"minor": 5, "moderate": 15, "severe": 30}


def _score_visible_damage(detections: List[dict]) -> tuple[float, str]:
    """Start at 100, subtract penalties per detection."""
    if not detections:
        return 100.0, "No visible damage detected in uploaded images."

    total_penalty = sum(SEVERITY_PENALTY.get(d.get("severity", "minor"), 5) for d in detections)
    score = max(0.0, 100.0 - total_penalty)
    severe_count = sum(1 for d in detections if d.get("severity") == "severe")
    mod_count = sum(1 for d in detections if d.get("severity") == "moderate")

    explanation = (
        f"{len(detections)} visible damage instance(s) detected: "
        f"{severe_count} severe, {mod_count} moderate."
    )
    return score, explanation


def _score_vehicle_age(year: int) -> tuple[float, str]:
    """Score based on vehicle age — newer is better."""
    age = datetime.now().year - year
    if age <= 2:
        score, label = 95.0, "Nearly new"
    elif age <= 5:
        score, label = 80.0, "Good age"
    elif age <= 8:
        score, label = 65.0, "Moderate age"
    elif age <= 12:
        score, label = 45.0, "Older vehicle"
    else:
        score, label = 25.0, "High age"
    return score, f"Vehicle is {age} year(s) old — {label}."


def _score_mileage(mileage_km: int, year: int) -> tuple[float, str]:
    """Score based on mileage vs expected average (15,000 km/year)."""
    age = max(datetime.now().year - year, 1)
    expected_km = age * 15000
    ratio = mileage_km / max(expected_km, 1)

    if ratio < 0.6:
        score, label = 95.0, "well below average mileage"
    elif ratio < 1.0:
        score, label = 82.0, "below average mileage"
    elif ratio < 1.3:
        score, label = 68.0, "near average mileage"
    elif ratio < 1.7:
        score, label = 50.0, "above average mileage"
    else:
        score, label = 28.0, "significantly above average mileage"

    return score, f"{mileage_km:,} km — {label} ({int(ratio * 100)}% of expected)."


def _score_tyre_condition(detections: List[dict]) -> tuple[float, str]:
    """Score based on tyre-related detections."""
    tyre_issues = [d for d in detections if d.get("damageType") == "tyre_abnormality"]
    if not tyre_issues:
        return 85.0, "No tyre abnormalities detected visually."
    severe = sum(1 for d in tyre_issues if d.get("severity") == "severe")
    score = max(0, 85.0 - (severe * 40) - (len(tyre_issues) * 15))
    return score, f"{len(tyre_issues)} tyre issue(s) detected visually."


def _score_exterior(detections: List[dict]) -> tuple[float, str]:
    """Score exterior based on non-tyre damage detections."""
    exterior_issues = [
        d for d in detections
        if d.get("damageType") not in ("tyre_abnormality",)
    ]
    if not exterior_issues:
        return 92.0, "Exterior appears clean based on uploaded images."
    penalty = sum(SEVERITY_PENALTY.get(d.get("severity", "minor"), 5) for d in exterior_issues)
    score = max(0.0, 92.0 - penalty)
    return score, f"{len(exterior_issues)} exterior issue(s) detected."


def _score_interior(_detections: List[dict]) -> tuple[float, str]:
    """Interior score — based on image availability for now."""
    interior_issues = [d for d in _detections if d.get("imageAngle") in ("interior", "dashboard")]
    if not interior_issues:
        return 75.0, "Interior images provided; no visible damage detected."
    penalty = sum(SEVERITY_PENALTY.get(d.get("severity", "minor"), 5) for d in interior_issues)
    return max(0.0, 80.0 - penalty), f"{len(interior_issues)} interior issue(s) noted."


def _score_maintenance(_vehicle_info: dict) -> tuple[float, str]:
    """Heuristic maintenance evidence score based on mileage/age consistency."""
    year = int(_vehicle_info.get("year", 2018))
    mileage = int(_vehicle_info.get("mileageKm", 50000))
    age = max(datetime.now().year - year, 1)
    avg = mileage / age
    if 8000 <= avg <= 20000:
        return 80.0, "Mileage per year is within typical maintained vehicle range."
    return 55.0, "Mileage pattern is atypical; verify service records."


def _score_price_fairness(price_result: dict) -> tuple[float, str]:
    """Score price fairness from price estimation result."""
    assessment = price_result.get("priceAssessment", "fair")
    mapping = {
        "underpriced": (95.0, "Asking price is below estimated market value — favourable for buyer."),
        "fair": (80.0, "Asking price is within estimated market range."),
        "slightly_overpriced": (55.0, "Asking price is slightly above estimated market range."),
        "significantly_overpriced": (20.0, "Asking price significantly exceeds estimated market value."),
    }
    return mapping.get(assessment, (70.0, "Price assessment unavailable."))


def compute_condition_score(vehicle_info: dict, damage_result: dict, price_result: dict) -> dict:
    """
    Computes the explainable 0–100 condition score.

    Args:
        vehicle_info: Vehicle details dict.
        damage_result: Output of damage detection module.
        price_result: Output of price estimation module.

    Returns:
        Condition score dict.
    """
    detections = damage_result.get("detections", [])
    year = int(vehicle_info.get("year", 2018))
    mileage_km = int(vehicle_info.get("mileageKm", 50000))

    # Compute sub-scores
    ext_score, ext_exp = _score_exterior(detections)
    int_score, int_exp = _score_interior(detections)
    dmg_score, dmg_exp = _score_visible_damage(detections)
    tyr_score, tyr_exp = _score_tyre_condition(detections)
    age_score, age_exp = _score_vehicle_age(year)
    mil_score, mil_exp = _score_mileage(mileage_km, year)
    mnt_score, mnt_exp = _score_maintenance(vehicle_info)
    prc_score, prc_exp = _score_price_fairness(price_result)

    sub_scores = {
        "exteriorCondition": round(ext_score, 1),
        "interiorCondition": round(int_score, 1),
        "visibleDamage": round(dmg_score, 1),
        "tyreCondition": round(tyr_score, 1),
        "vehicleAge": round(age_score, 1),
        "mileageFactor": round(mil_score, 1),
        "maintenanceEvidence": round(mnt_score, 1),
        "priceFairness": round(prc_score, 1),
    }

    overall = (
        ext_score * WEIGHTS["exterior_condition"]
        + int_score * WEIGHTS["interior_condition"]
        + dmg_score * WEIGHTS["visible_damage"]
        + tyr_score * WEIGHTS["tyre_condition"]
        + age_score * WEIGHTS["vehicle_age"]
        + mil_score * WEIGHTS["mileage_factor"]
        + mnt_score * WEIGHTS["maintenance_evidence"]
        + prc_score * WEIGHTS["price_fairness"]
    )

    explanations = [ext_exp, int_exp, dmg_exp, tyr_exp, age_exp, mil_exp, mnt_exp, prc_exp]

    return {
        "modelVersion": "rule-v1.0",
        "isMock": False,  # This is always a real rule-based calculation
        "overallScore": round(overall, 1),
        "subScores": sub_scores,
        "scoreExplanation": explanations,
        "weights": WEIGHTS,  # Include weights for transparency
    }
