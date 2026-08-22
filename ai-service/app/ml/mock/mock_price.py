"""
⚠️  DEV PLACEHOLDER MODULE — mock_price.py
──────────────────────────────────────────────────────
This module returns deterministic mock price estimates.
It does NOT use a real trained ML model.

To replace with the real XGBoost model:
  1. Train XGBoost on India used-car price dataset (see docs/model-notes.md)
  2. Save model to app/ml/weights/price_xgboost.json
  3. Set AI_SERVICE_USE_MOCK=false in .env

All API responses from this module include isMock=true.
──────────────────────────────────────────────────────
"""
from datetime import datetime

# Approximate base prices (INR) for common Indian car segments
SEGMENT_BASE_PRICES = {
    # Make -> approximate new price range (low, high) in INR
    "maruti": (450000, 1200000),
    "hyundai": (600000, 1800000),
    "tata": (550000, 2000000),
    "mahindra": (800000, 3500000),
    "honda": (800000, 2000000),
    "toyota": (1000000, 4000000),
    "kia": (1000000, 2200000),
    "renault": (500000, 1200000),
    "volkswagen": (1200000, 3000000),
    "skoda": (1200000, 3500000),
    "ford": (700000, 2200000),
    "mg": (1500000, 4000000),
    "default": (700000, 2000000),
}

FUEL_MULTIPLIER = {
    "electric": 1.3,
    "hybrid": 1.15,
    "diesel": 1.05,
    "petrol": 1.0,
    "cng": 0.9,
}

TRANSMISSION_MULTIPLIER = {
    "automatic": 1.08,
    "amt": 1.03,
    "manual": 1.0,
}


def estimate_price_mock(vehicle_info: dict) -> dict:
    """
    Returns a mock price estimate based on simple heuristics.

    Args:
        vehicle_info: Dict with make, model, year, fuelType, transmission, mileageKm, askingPrice, location.

    Returns:
        Price estimation result dict (isMock=True always set).
    """
    make = (vehicle_info.get("make") or "default").lower()
    fuel = (vehicle_info.get("fuelType") or "petrol").lower()
    transmission = (vehicle_info.get("transmission") or "manual").lower()
    year = int(vehicle_info.get("year") or 2018)
    mileage_km = int(vehicle_info.get("mileageKm") or 50000)
    asking_price = float(vehicle_info.get("askingPrice") or 500000)
    current_year = datetime.now().year

    # Get base price for make
    base_low, base_high = SEGMENT_BASE_PRICES.get(make, SEGMENT_BASE_PRICES["default"])
    base_mid = (base_low + base_high) / 2

    # Apply depreciation (~15% first year, ~10% per year after)
    age = max(current_year - year, 0)
    if age == 0:
        depreciation = 1.0
    elif age == 1:
        depreciation = 0.85
    else:
        depreciation = 0.85 * (0.90 ** (age - 1))
    depreciation = max(depreciation, 0.15)  # Floor at 15% of original

    # Mileage penalty
    avg_annual_km = 15000
    expected_km = avg_annual_km * age
    excess_km = max(mileage_km - expected_km, 0)
    mileage_penalty = 1.0 - min(excess_km / 200000, 0.20)

    # Fuel and transmission multipliers
    fuel_mult = FUEL_MULTIPLIER.get(fuel, 1.0)
    trans_mult = TRANSMISSION_MULTIPLIER.get(transmission, 1.0)

    # Calculate estimated range
    estimated_mid = base_mid * depreciation * mileage_penalty * fuel_mult * trans_mult
    estimated_low = estimated_mid * 0.88
    estimated_high = estimated_mid * 1.12

    # Price assessment
    delta = asking_price - estimated_mid
    delta_pct = (delta / estimated_mid) * 100 if estimated_mid > 0 else 0

    if delta_pct < -10:
        assessment = "underpriced"
    elif delta_pct <= 10:
        assessment = "fair"
    elif delta_pct <= 25:
        assessment = "slightly_overpriced"
    else:
        assessment = "significantly_overpriced"

    factors = [
        f"Vehicle age: {age} year(s) — depreciation applied",
        f"Mileage: {mileage_km:,} km — {'above' if mileage_km > expected_km else 'within'} expected range",
        f"Fuel type ({fuel}) — {'premium' if fuel_mult > 1 else 'standard'} market segment",
        f"Transmission ({transmission}) — {'premium' if trans_mult > 1 else 'standard'} variant",
        f"Estimated based on typical {make.title()} pricing in Indian used-car market",
    ]

    return {
        "modelVersion": "mock-v0.1",
        "isMock": True,
        "estimatedRangeLow": round(estimated_low),
        "estimatedRangeHigh": round(estimated_high),
        "estimatedMid": round(estimated_mid),
        "askingPrice": round(asking_price),
        "priceDelta": round(delta),
        "priceAssessment": assessment,
        "factors": factors,
    }
