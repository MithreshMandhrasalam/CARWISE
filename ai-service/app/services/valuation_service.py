# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 11: Fair-Market Vehicle Valuation & Asking-Price Assessment
# Transparent, evidence-adjusted, market-benchmarked valuation engine (INR)
# ═══════════════════════════════════════════════════════════════

from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field


# ── 1. Reference Market Benchmark Dataset (Academic Provenance: India 2020-2025) ─
MARKET_REFERENCE_DATA: Dict[str, Dict[str, int]] = {
    "MARUTI": {
        "SWIFT": 720000,
        "BALENO": 800000,
        "DZIRE": 780000,
        "BREZZA": 980000,
        "ALTO": 450000,
        "WAGONR": 600000,
        "FRONX": 920000,
        "GRAND VITARA": 1350000,
        "ERTIGA": 1050000,
        "CELERIO": 580000,
        "IGNIS": 650000,
    },
    "HYUNDAI": {
        "CRETA": 1350000,
        "VENUE": 950000,
        "I20": 820000,
        "I10": 650000,
        "GRAND I10": 650000,
        "VERNA": 1280000,
        "ALCAZAR": 1850000,
        "TUCSON": 3200000,
        "AURA": 760000,
        "EXTER": 750000,
    },
    "TATA": {
        "NEXON": 1020000,
        "PUNCH": 750000,
        "HARRIER": 1850000,
        "SAFARI": 2000000,
        "TIAGO": 620000,
        "ALTROZ": 780000,
        "TIGOR": 720000,
    },
    "MAHINDRA": {
        "SCORPIO": 1650000,
        "SCORPIO-N": 1750000,
        "XUV700": 1850000,
        "THAR": 1450000,
        "XUV300": 980000,
        "XUV 3XO": 980000,
        "BOLERO": 1000000,
    },
    "HONDA": {
        "CITY": 1350000,
        "AMAZE": 820000,
        "ELEVATE": 1300000,
    },
    "KIA": {
        "SELTOS": 1350000,
        "SONET": 950000,
        "CARENS": 1250000,
    },
    "TOYOTA": {
        "FORTUNER": 3800000,
        "INNOVA": 2200000,
        "HYCROSS": 2400000,
        "GLANZA": 800000,
        "URBAN CRUISER": 1000000,
    },
    "VOLKSWAGEN": {
        "TAIGUN": 1400000,
        "VIRTUS": 1350000,
        "POLO": 850000,
    },
    "SKODA": {
        "KUSHAQ": 1400000,
        "SLAVIA": 1350000,
        "RAPID": 1050000,
    },
    "BMW": {
        "3 SERIES": 5200000,
        "5 SERIES": 6800000,
        "X1": 4800000,
        "X3": 6500000,
    },
    "MERCEDES": {
        "C-CLASS": 5800000,
        "E-CLASS": 7500000,
        "GLA": 4900000,
        "GLC": 7200000,
    },
    "AUDI": {
        "A4": 4800000,
        "A6": 6400000,
        "Q3": 4600000,
        "Q5": 6800000,
    },
}

DEFAULT_SEGMENT_BENCHMARKS = {
    "HATCHBACK": 700000,
    "ENTRY": 500000,
    "SEDAN": 1000000,
    "COMPACT_SUV": 1050000,
    "MID_SUV": 1500000,
    "PREMIUM_SEDAN": 1500000,
    "LUXURY": 4500000,
    "EXECUTIVE": 4500000,
}

DEPRECIATION_SCHEDULE: Dict[int, float] = {
    0: 0.08,   # Current year
    1: 0.15,
    2: 0.25,
    3: 0.35,
    4: 0.43,
    5: 0.50,
    6: 0.56,
    7: 0.62,
    8: 0.68,
}


# ── Schemas ─────────────────────────────────────────────────────────────────────

class FairValueRange(BaseModel):
    min: Optional[int] = None
    max: Optional[int] = None
    midpoint: Optional[int] = None


class PriceAdjustmentDetail(BaseModel):
    adjustmentType: str
    amountInr: int
    percentageDelta: float
    rationale: str


class AskingPriceAssessment(BaseModel):
    askingPrice: int
    pricePosition: str  # FAIRLY_PRICED, BELOW_FAIR_RANGE, ABOVE_FAIR_RANGE, INSUFFICIENT_EVIDENCE
    premiumAmount: int = 0
    discountAmount: int = 0
    varianceFromMidpoint: int = 0
    variancePercentage: float = 0.0
    verdictHeading: str
    verdictText: str


class VehicleValuationReport(BaseModel):
    version: str = "VALUATION_V1"
    currency: str = "INR"
    status: str  # FAIRLY_PRICED, BELOW_FAIR_RANGE, ABOVE_FAIR_RANGE, INSUFFICIENT_EVIDENCE, LIMITED_MARKET_DATA
    valuationConfidence: str  # HIGH, MODERATE, LOW
    fairMarketValueRange: FairValueRange
    baseBenchmarkNewPrice: Optional[int] = None
    depreciatedBaseValue: Optional[int] = None
    askingPriceAssessment: AskingPriceAssessment
    adjustments: List[PriceAdjustmentDetail]
    limitations: List[str]
    summary: str


# ═══════════════════════════════════════════════════════════════════════════════
# Valuation Calculation Engine
# ═══════════════════════════════════════════════════════════════════════════════

class MarketReferenceRepository:
    """Provides base benchmark prices from academic dataset or fallback segment tables."""

    @staticmethod
    def get_benchmark_price(make: str, model: str, segment: str = "HATCHBACK") -> Tuple[Optional[int], str]:
        mk = (make or "").upper().strip()
        md = (model or "").upper().strip()

        # Direct match in model reference table
        if mk in MARKET_REFERENCE_DATA:
            model_dict = MARKET_REFERENCE_DATA[mk]
            for ref_model, price in model_dict.items():
                if ref_model in md or md in ref_model:
                    return price, "KNOWN_MODEL_BENCHMARK"

        # Fallback to segment benchmark
        seg = segment.upper()
        if seg in DEFAULT_SEGMENT_BENCHMARKS:
            return DEFAULT_SEGMENT_BENCHMARKS[seg], "SEGMENT_AVERAGE_FALLBACK"

        return None, "NO_MARKET_DATA"


class DepreciationEngine:
    """Calculates age-based depreciation on base benchmark new price."""

    @staticmethod
    def calculate_depreciation(base_price: int, vehicle_year: int, reference_year: int = 2026) -> Tuple[int, float]:
        age = max(0, reference_year - vehicle_year)

        if age in DEPRECIATION_SCHEDULE:
            dep_pct = DEPRECIATION_SCHEDULE[age]
        elif age > 8:
            dep_pct = min(0.80, 0.68 + (age - 8) * 0.04)
        else:
            dep_pct = 0.25

        depreciated_value = int(round(base_price * (1.0 - dep_pct)))
        return depreciated_value, dep_pct * 100.0


class VehicleValuationEngine:
    """
    Main Orchestrator for Phase 11 Fair-Market Valuation & Asking-Price Assessment.
    """

    REFERENCE_YEAR = 2026
    BENCHMARK_ANNUAL_KM = 12000
    BENCHMARK_CONDITION_SCORE = 85.0

    @classmethod
    def evaluate_valuation(
        cls,
        vehicle_info: Optional[Dict[str, Any]] = None,
        condition_score: Optional[Dict[str, Any]] = None,
        trust_score: Optional[Dict[str, Any]] = None,
        repair_cost_assessment: Optional[Dict[str, Any]] = None,
    ) -> VehicleValuationReport:
        vinfo = vehicle_info or {}
        make = str(vinfo.get("make", "")).strip()
        model = str(vinfo.get("model", "")).strip()
        year = int(vinfo.get("year", 2022))
        mileage_km = int(vinfo.get("mileageKm", 40000))
        asking_price = int(vinfo.get("askingPrice", 0))
        body_type = str(vinfo.get("bodyType", "")).upper()

        # Extract Trust Score & Band
        trust_dict = trust_score or {}
        raw_trust_val = trust_dict.get("trustScore")
        trust_band = trust_dict.get("trustBand", "INSUFFICIENT_EVIDENCE")

        # ── 1. Gating Rule: Insufficient Evidence or Low Trust Score (< 50) ───
        if (
            raw_trust_val is None
            or raw_trust_val < 50
            or trust_band == "INSUFFICIENT_EVIDENCE"
            or not make
            or not model
        ):
            return VehicleValuationReport(
                version="VALUATION_V1",
                currency="INR",
                status="INSUFFICIENT_EVIDENCE",
                valuationConfidence="LOW",
                fairMarketValueRange=FairValueRange(min=None, max=None, midpoint=None),
                baseBenchmarkNewPrice=None,
                depreciatedBaseValue=None,
                askingPriceAssessment=AskingPriceAssessment(
                    askingPrice=asking_price,
                    pricePosition="INSUFFICIENT_EVIDENCE",
                    premiumAmount=0,
                    discountAmount=0,
                    varianceFromMidpoint=0,
                    variancePercentage=0.0,
                    verdictHeading="Assessment Trust Insufficient for Market Valuation",
                    verdictText="Buyer trust score is below the reliable threshold (Trust Score < 50). Missing mandatory photographic evidence prevents defensible fair-market value estimation.",
                ),
                adjustments=[],
                limitations=[
                    "Fair market valuation requires verifiable photographic evidence and an Assessment Trust Score ≥ 50.",
                    "Upload complete mandatory vehicle perspective photos to unlock market valuation.",
                ],
                summary="Market valuation is withheld due to insufficient photographic evidence coverage.",
            )

        # Detect vehicle segment
        from app.services.repair_cost_service import VehicleSegmentDetector
        segment = VehicleSegmentDetector.detect_segment(vinfo)

        # ── 2. Reference Benchmark Price Lookup ───────────────────────────────
        base_price, provenance = MarketReferenceRepository.get_benchmark_price(make, model, segment)

        if not base_price:
            return VehicleValuationReport(
                version="VALUATION_V1",
                currency="INR",
                status="LIMITED_MARKET_DATA",
                valuationConfidence="LOW",
                fairMarketValueRange=FairValueRange(min=None, max=None, midpoint=None),
                baseBenchmarkNewPrice=None,
                depreciatedBaseValue=None,
                askingPriceAssessment=AskingPriceAssessment(
                    askingPrice=asking_price,
                    pricePosition="LIMITED_MARKET_DATA",
                    premiumAmount=0,
                    discountAmount=0,
                    varianceFromMidpoint=0,
                    variancePercentage=0.0,
                    verdictHeading="Market Reference Data Unavailable",
                    verdictText=f"No verified market price benchmarks available for {make} {model}.",
                ),
                adjustments=[],
                limitations=["Market valuation requires verified reference price baseline."],
                summary=f"No reference market dataset found for {make} {model}.",
            )

        # ── 3. Age & Depreciation Adjustment ──────────────────────────────────
        depreciated_base, dep_pct = DepreciationEngine.calculate_depreciation(
            base_price, year, cls.REFERENCE_YEAR
        )
        age = max(0, cls.REFERENCE_YEAR - year)

        adjustments: List[PriceAdjustmentDetail] = []
        adjustments.append(
            PriceAdjustmentDetail(
                adjustmentType="AGE_DEPRECIATION",
                amountInr=-(base_price - depreciated_base),
                percentageDelta=-dep_pct,
                rationale=f"Standard Indian automotive depreciation for a {age}-year-old vehicle (-{dep_pct:.1f}% on base ex-showroom ₹{base_price:,}).",
            )
        )

        # ── 4. Mileage Adjustment ─────────────────────────────────────────────
        expected_km = max(1, age) * cls.BENCHMARK_ANNUAL_KM
        excess_km = mileage_km - expected_km

        # -1.2% per 10,000 excess km, +1.0% per 10,000 below average km (capped [-15%, +8%])
        if excess_km > 0:
            mileage_pct = max(-15.0, -(excess_km / 10000.0) * 1.2)
        else:
            mileage_pct = min(8.0, -(excess_km / 10000.0) * 1.0)

        mileage_adj_inr = int(round(depreciated_base * (mileage_pct / 100.0)))
        adjustments.append(
            PriceAdjustmentDetail(
                adjustmentType="MILEAGE_USAGE",
                amountInr=mileage_adj_inr,
                percentageDelta=round(mileage_pct, 2),
                rationale=(
                    f"Odometer reading of {mileage_km:,} km vs expected {expected_km:,} km "
                    f"({abs(excess_km):,} km {'above' if excess_km > 0 else 'below'} average)."
                ),
            )
        )

        # ── 5. Condition Score Adjustment ─────────────────────────────────────
        cond_dict = condition_score or {}
        raw_cond_score = cond_dict.get("overallScore") or cond_dict.get("score")

        if raw_cond_score is not None:
            c_score = float(raw_cond_score)
            delta_score = c_score - cls.BENCHMARK_CONDITION_SCORE
            if delta_score >= 0:
                cond_pct = min(4.0, delta_score * 0.25)
            else:
                cond_pct = max(-18.0, delta_score * 0.35)

            cond_adj_inr = int(round(depreciated_base * (cond_pct / 100.0)))
            adjustments.append(
                PriceAdjustmentDetail(
                    adjustmentType="PHYSICAL_CONDITION",
                    amountInr=cond_adj_inr,
                    percentageDelta=round(cond_pct, 2),
                    rationale=(
                        f"Vehicle Condition Score of {c_score:.1f}/100 vs benchmark 85.0/100 "
                        f"({'+' if cond_pct >= 0 else ''}{cond_pct:.1f}% cosmetic condition adjustment)."
                    ),
                )
            )
        else:
            cond_adj_inr = 0

        # ── 6. Repair Cost Burden Adjustment ──────────────────────────────────
        repair_dict = repair_cost_assessment or {}
        repair_range = repair_dict.get("totalEstimatedRange") or {}
        repair_median = repair_range.get("median") or 0

        if repair_median > 0:
            adjustments.append(
                PriceAdjustmentDetail(
                    adjustmentType="REPAIR_BURDEN_DEDUCTION",
                    amountInr=-repair_median,
                    percentageDelta=round(-(repair_median / depreciated_base) * 100.0, 2),
                    rationale=f"Direct deduction for immediate estimated cosmetic & bodywork repairs (-₹{repair_median:,}).",
                )
            )

        # ── 7. Fair Market Value Range Aggregation ────────────────────────────
        net_adjustments = mileage_adj_inr + cond_adj_inr - repair_median
        midpoint_value = max(50000, int(round(depreciated_base + net_adjustments)))

        # Standard range spread ±4%
        fair_min = int(round(midpoint_value * 0.96))
        fair_max = int(round(midpoint_value * 1.04))

        # ── 8. Asking-Price Classification ────────────────────────────────────
        var_midpoint = asking_price - midpoint_value
        var_pct = round((var_midpoint / midpoint_value) * 100.0, 1)

        if asking_price < fair_min:
            price_position = "BELOW_FAIR_RANGE"
            status = "BELOW_FAIR_RANGE"
            discount_amount = fair_min - asking_price
            premium_amount = 0
            verdict_heading = "Attractively Priced Below Fair Market Range"
            verdict_text = (
                f"The seller's asking price of ₹{asking_price:,} is ₹{discount_amount:,} ({abs(var_pct)}%) below "
                f"the estimated fair-market range of ₹{fair_min:,} – ₹{fair_max:,}."
            )
        elif asking_price <= fair_max:
            price_position = "FAIRLY_PRICED"
            status = "FAIRLY_PRICED"
            discount_amount = 0
            premium_amount = 0
            verdict_heading = "Fair Market Asking Price"
            verdict_text = (
                f"The seller's asking price of ₹{asking_price:,} aligns with the estimated "
                f"fair-market range of ₹{fair_min:,} – ₹{fair_max:,} (Midpoint: ₹{midpoint_value:,})."
            )
        else:
            price_position = "ABOVE_FAIR_RANGE"
            status = "ABOVE_FAIR_RANGE"
            premium_amount = asking_price - fair_max
            discount_amount = 0
            verdict_heading = "Above Fair Market Range (Asking Premium)"
            verdict_text = (
                f"The seller's asking price of ₹{asking_price:,} carries a premium of ₹{premium_amount:,} "
                f"(+{var_pct}% vs midpoint) relative to the estimated fair-market range of ₹{fair_min:,} – ₹{fair_max:,}."
            )

        # ── 9. Valuation Confidence ───────────────────────────────────────────
        if raw_trust_val >= 80 and provenance == "KNOWN_MODEL_BENCHMARK":
            val_confidence = "HIGH"
        elif raw_trust_val >= 65:
            val_confidence = "MODERATE"
        else:
            val_confidence = "LOW"

        summary = (
            f"Estimated fair-market value: ₹{fair_min / 100000:.2f}L – ₹{fair_max / 100000:.2f}L "
            f"(Midpoint: ₹{midpoint_value / 100000:.2f}L). Seller asking price: ₹{asking_price / 100000:.2f}L "
            f"({price_position.replace('_', ' ')})."
        )

        limitations = [
            "Valuation is derived from academic ex-showroom benchmarks, Indian automotive depreciation curves, observed cosmetic condition, and repair estimates.",
            "Actual dealer and private resale prices vary based on city-specific RTO taxes, transfer costs, number of previous owners, service records, and insurance NCB status.",
            "Valuation assumes clean legal title and does not account for active hypothecation, blacklisting, or chassis frame defects.",
        ]

        return VehicleValuationReport(
            version="VALUATION_V1",
            currency="INR",
            status=status,
            valuationConfidence=val_confidence,
            fairMarketValueRange=FairValueRange(min=fair_min, max=fair_max, midpoint=midpoint_value),
            baseBenchmarkNewPrice=base_price,
            depreciatedBaseValue=depreciated_base,
            askingPriceAssessment=AskingPriceAssessment(
                askingPrice=asking_price,
                pricePosition=price_position,
                premiumAmount=premium_amount,
                discountAmount=discount_amount,
                varianceFromMidpoint=var_midpoint,
                variancePercentage=var_pct,
                verdictHeading=verdict_heading,
                verdictText=verdict_text,
            ),
            adjustments=adjustments,
            limitations=limitations,
            summary=summary,
        )
