"""
Final Assessment Generator — rule-v1.0
Uses a deterministic decision tree on top of all AI outputs.
"""
from typing import List

DISCLAIMER = (
    "This is an AI-assisted decision-support report and does not replace "
    "a professional mechanical inspection by a qualified mechanic. "
    "Always physically inspect any used vehicle before purchase."
)


def _determine_recommendation(overall_score: float, severe_count: int, price_assessment: str) -> tuple:
    """Map score + damage flags to a recommendation level."""
    if overall_score >= 78 and severe_count == 0 and price_assessment in ("underpriced", "fair"):
        return "RECOMMENDED", "Vehicle appears to be in good condition at a fair price. Still recommended to conduct a final physical inspection."
    elif overall_score >= 60 and severe_count <= 1:
        return "CONSIDER_INSPECT", "Vehicle shows some issues that warrant closer inspection before purchase. Negotiate on detected damage points."
    elif overall_score >= 40 or severe_count <= 2:
        return "PROCEED_CAUTION", "Vehicle has notable defects or pricing concerns. Proceed only after thorough professional inspection and price negotiation."
    else:
        return "AVOID", "Vehicle shows multiple severe defects and/or significant overpricing. Not recommended for purchase without major repairs and price reduction."


def _determine_risk(overall_score: float, severe_count: int, repair_flag: bool) -> str:
    if overall_score >= 75 and severe_count == 0:
        return "low"
    elif overall_score >= 55 and severe_count <= 1:
        return "medium"
    elif overall_score >= 35 or severe_count <= 3:
        return "high"
    else:
        return "very_high"


def _determine_condition_rating(overall_score: float) -> str:
    if overall_score >= 82:
        return "excellent"
    elif overall_score >= 68:
        return "good"
    elif overall_score >= 50:
        return "fair"
    elif overall_score >= 30:
        return "poor"
    else:
        return "critical"


def _build_checklist(detections: List[dict], repair_flag: bool) -> List[dict]:
    """Build a prioritized inspection checklist from detections."""
    checklist = []

    # High-priority items
    for d in detections:
        if d.get("severity") == "severe":
            checklist.append({
                "priority": "high",
                "area": d.get("component", "Unknown area"),
                "reason": f"Severe {d.get('damageType', 'damage')} detected visually. "
                          f"Requires physical verification. {d.get('notes', '')}",
            })

    if repair_flag:
        checklist.append({
            "priority": "high",
            "area": "Accident/repair history",
            "reason": "Visual evidence suggests possible previous repair. Request service records and check VIN history.",
        })

    # Medium-priority items
    for d in detections:
        if d.get("severity") == "moderate":
            checklist.append({
                "priority": "medium",
                "area": d.get("component", "Unknown area"),
                "reason": f"Moderate {d.get('damageType', 'damage')} visible. "
                          f"Assess repair cost before purchase. {d.get('notes', '')}",
            })

    # Low-priority items
    for d in detections:
        if d.get("severity") == "minor":
            checklist.append({
                "priority": "low",
                "area": d.get("component", "Unknown area"),
                "reason": f"Minor {d.get('damageType', 'damage')}. "
                          f"Cosmetic issue, negotiate for discount. {d.get('notes', '')}",
            })

    # Always add standard checklist items
    standard_items = [
        {"priority": "high", "area": "Test drive", "reason": "Evaluate engine, brakes, steering, and transmission performance."},
        {"priority": "high", "area": "Engine bay inspection", "reason": "Check oil level, fluid leaks, belt condition, and overall cleanliness."},
        {"priority": "medium", "area": "Service records", "reason": "Verify maintenance history and timing belt/chain replacement."},
        {"priority": "medium", "area": "Tyre tread depth", "reason": "Physically check all four tyres for even wear and adequate tread."},
        {"priority": "low", "area": "Interior condition", "reason": "Check AC, power windows, locks, and infotainment system."},
    ]
    checklist.extend(standard_items)

    return checklist


def _extract_major_findings(detections: List[dict], repair_flag: bool, price_result: dict) -> List[str]:
    """Extract top findings for the summary section."""
    findings = []
    severe = [d for d in detections if d.get("severity") == "severe"]
    moderate = [d for d in detections if d.get("severity") == "moderate"]

    for d in severe:
        findings.append(f"SEVERE: {d.get('damageType', 'damage').replace('_', ' ').title()} on {d.get('component', 'panel')}")

    if repair_flag:
        findings.append("Possible previous repair or accident-related damage detected visually")

    if price_result.get("priceAssessment") == "significantly_overpriced":
        delta = price_result.get("priceDelta", 0)
        findings.append(f"Asking price is ₹{abs(delta):,.0f} above estimated market range")

    for d in moderate[:2]:  # Top 2 moderate issues
        findings.append(f"MODERATE: {d.get('damageType', 'damage').replace('_', ' ').title()} on {d.get('component', 'panel')}")

    if not findings:
        findings.append("No major defects detected in uploaded images")

    return findings


def generate_final_assessment(vehicle_info: dict, damage_result: dict, price_result: dict, score_result: dict) -> dict:
    """
    Synthesizes all AI outputs into a final assessment.

    Returns:
        Dict containing inspectionChecklist and finalAssessment.
    """
    detections = damage_result.get("detections", [])
    repair_flag = damage_result.get("repairIndicationFlag", False)
    overall_score = score_result.get("overallScore", 50.0)
    price_assessment = price_result.get("priceAssessment", "fair")
    severe_count = sum(1 for d in detections if d.get("severity") == "severe")

    recommendation, recommendation_text = _determine_recommendation(
        overall_score, severe_count, price_assessment
    )

    return {
        "inspectionChecklist": _build_checklist(detections, repair_flag),
        "finalAssessment": {
            "trustScore": round(overall_score, 1),
            "conditionRating": _determine_condition_rating(overall_score),
            "riskLevel": _determine_risk(overall_score, severe_count, repair_flag),
            "majorFindings": _extract_major_findings(detections, repair_flag, price_result),
            "recommendation": recommendation,
            "recommendationText": recommendation_text,
            "disclaimer": DISCLAIMER,
        },
    }
