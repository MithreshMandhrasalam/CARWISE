/**
 * ═══════════════════════════════════════════════════════════════
 * CARWISE — Vehicle Valuation Controller (Phase 11)
 * Evaluates fair-market value range & asking-price assessment
 * ═══════════════════════════════════════════════════════════════
 */

const axios = require('axios');
const Inspection = require('../models/Inspection');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const MARKET_REFERENCE_DATA = {
  MARUTI: { SWIFT: 720000, BALENO: 800000, DZIRE: 780000, BREZZA: 980000, ALTO: 450000, WAGONR: 600000 },
  HYUNDAI: { CRETA: 1350000, VENUE: 950000, I20: 820000, I10: 650000, VERNA: 1280000 },
  TATA: { NEXON: 1020000, PUNCH: 750000, HARRIER: 1850000, TIAGO: 620000 },
  MAHINDRA: { SCORPIO: 1650000, XUV700: 1850000, THAR: 1450000 },
  HONDA: { CITY: 1350000, AMAZE: 820000 },
  TOYOTA: { FORTUNER: 3800000, INNOVA: 2200000, GLANZA: 800000 },
};

const DEFAULT_SEGMENT_BENCHMARKS = {
  HATCHBACK: 700000,
  SEDAN: 1000000,
  COMPACT_SUV: 1050000,
  MID_SUV: 1500000,
  LUXURY: 4500000,
};

const DEPRECIATION_SCHEDULE = {
  0: 0.08,
  1: 0.15,
  2: 0.25,
  3: 0.35,
  4: 0.43,
  5: 0.50,
  6: 0.56,
  7: 0.62,
  8: 0.68,
};

function runDeterministicValuationFallback(vehicleInfo, conditionScore, trustScore, repairCostAssessment) {
  const make = String(vehicleInfo?.make || '').toUpperCase().trim();
  const model = String(vehicleInfo?.model || '').toUpperCase().trim();
  const year = Number(vehicleInfo?.year || 2022);
  const mileageKm = Number(vehicleInfo?.mileageKm || 40000);
  const askingPrice = Number(vehicleInfo?.askingPrice || 0);

  const rawTrust =
    trustScore?.overallTrustScore !== undefined
      ? trustScore.overallTrustScore
      : trustScore?.trustScore;
  const trustBand = trustScore?.trustBand || 'INSUFFICIENT_EVIDENCE';

  // 1. Gating check
  if (rawTrust === null || rawTrust === undefined || rawTrust < 50 || trustBand === 'INSUFFICIENT_EVIDENCE' || !make || !model) {
    return {
      version: 'VALUATION_V1',
      currency: 'INR',
      status: 'INSUFFICIENT_EVIDENCE',
      valuationConfidence: 'LOW',
      fairMarketValueRange: { min: null, max: null, midpoint: null },
      baseBenchmarkNewPrice: null,
      depreciatedBaseValue: null,
      askingPriceAssessment: {
        askingPrice,
        pricePosition: 'INSUFFICIENT_EVIDENCE',
        premiumAmount: 0,
        discountAmount: 0,
        varianceFromMidpoint: 0,
        variancePercentage: 0,
        verdictHeading: 'Assessment Trust Insufficient for Market Valuation',
        verdictText: 'Missing mandatory photographic evidence prevents defensible fair-market value estimation.',
      },
      adjustments: [],
      limitations: ['Fair market valuation requires verifiable photographic evidence and an Assessment Trust Score ≥ 50.'],
      summary: 'Market valuation is withheld due to insufficient photographic evidence coverage.',
    };
  }

  // 2. Base benchmark price lookup
  let basePrice = null;
  if (MARKET_REFERENCE_DATA[make]) {
    for (const [refModel, price] of Object.entries(MARKET_REFERENCE_DATA[make])) {
      if (model.includes(refModel) || refModel.includes(model)) {
        basePrice = price;
        break;
      }
    }
  }
  if (!basePrice) {
    basePrice = DEFAULT_SEGMENT_BENCHMARKS.MID_SUV;
  }

  // 3. Depreciation
  const age = Math.max(0, 2026 - year);
  let depPct = DEPRECIATION_SCHEDULE[age];
  if (depPct === undefined) {
    depPct = age > 8 ? Math.min(0.8, 0.68 + (age - 8) * 0.04) : 0.25;
  }
  const depreciatedBase = Math.round(basePrice * (1.0 - depPct));

  // 4. Adjustments
  const adjustments = [
    {
      adjustmentType: 'AGE_DEPRECIATION',
      amountInr: -(basePrice - depreciatedBase),
      percentageDelta: -(depPct * 100),
      rationale: `Standard Indian automotive depreciation for a ${age}-year-old vehicle (-${(depPct * 100).toFixed(1)}%).`,
    },
  ];

  // Mileage
  const expectedKm = Math.max(1, age) * 12000;
  const excessKm = mileageKm - expectedKm;
  let mileagePct = excessKm > 0 ? Math.max(-15.0, -(excessKm / 10000.0) * 1.2) : Math.min(8.0, -(excessKm / 10000.0) * 1.0);
  const mileageAdjInr = Math.round(depreciatedBase * (mileagePct / 100.0));
  adjustments.push({
    adjustmentType: 'MILEAGE_USAGE',
    amountInr: mileageAdjInr,
    percentageDelta: Number(mileagePct.toFixed(2)),
    rationale: `Odometer reading of ${mileageKm.toLocaleString()} km vs expected ${expectedKm.toLocaleString()} km.`,
  });

  // Condition
  const condScore = conditionScore?.overallScore || conditionScore?.score;
  let condAdjInr = 0;
  if (condScore !== undefined && condScore !== null) {
    const deltaScore = Number(condScore) - 85.0;
    const condPct = deltaScore >= 0 ? Math.min(4.0, deltaScore * 0.25) : Math.max(-18.0, deltaScore * 0.35);
    condAdjInr = Math.round(depreciatedBase * (condPct / 100.0));
    adjustments.push({
      adjustmentType: 'PHYSICAL_CONDITION',
      amountInr: condAdjInr,
      percentageDelta: Number(condPct.toFixed(2)),
      rationale: `Condition Score of ${Number(condScore).toFixed(1)}/100 (${condPct >= 0 ? '+' : ''}${condPct.toFixed(1)}%).`,
    });
  }

  // Repair
  const repairMedian = repairCostAssessment?.totalEstimatedRange?.median || 0;
  if (repairMedian > 0) {
    adjustments.push({
      adjustmentType: 'REPAIR_BURDEN_DEDUCTION',
      amountInr: -repairMedian,
      percentageDelta: Number((-(repairMedian / depreciatedBase) * 100).toFixed(2)),
      rationale: `Direct deduction for estimated cosmetic & bodywork repairs (-₹${repairMedian.toLocaleString()}).`,
    });
  }

  // 5. Final Range
  const midpoint = Math.max(50000, Math.round(depreciatedBase + mileageAdjInr + condAdjInr - repairMedian));
  const fairMin = Math.round(midpoint * 0.96);
  const fairMax = Math.round(midpoint * 1.04);

  // 6. Asking-Price Classification
  const varMidpoint = askingPrice - midpoint;
  const varPct = Number(((varMidpoint / midpoint) * 100).toFixed(1));

  let pricePosition = 'FAIRLY_PRICED';
  let premiumAmount = 0;
  let discountAmount = 0;
  let verdictHeading = 'Fair Market Asking Price';
  let verdictText = `The asking price of ₹${askingPrice.toLocaleString()} is within estimated fair market range.`;

  if (askingPrice < fairMin) {
    pricePosition = 'BELOW_FAIR_RANGE';
    discountAmount = fairMin - askingPrice;
    verdictHeading = 'Attractively Priced Below Fair Market Range';
    verdictText = `The seller's asking price of ₹${askingPrice.toLocaleString()} is ₹${discountAmount.toLocaleString()} below fair-market range.`;
  } else if (askingPrice > fairMax) {
    pricePosition = 'ABOVE_FAIR_RANGE';
    premiumAmount = askingPrice - fairMax;
    verdictHeading = 'Above Fair Market Range (Asking Premium)';
    verdictText = `The seller's asking price carries a premium of ₹${premiumAmount.toLocaleString()} relative to fair-market range.`;
  }

  return {
    version: 'VALUATION_V1',
    currency: 'INR',
    status: pricePosition,
    valuationConfidence: rawTrust >= 80 ? 'HIGH' : rawTrust >= 65 ? 'MODERATE' : 'LOW',
    fairMarketValueRange: { min: fairMin, max: fairMax, midpoint },
    baseBenchmarkNewPrice: basePrice,
    depreciatedBaseValue: depreciatedBase,
    askingPriceAssessment: {
      askingPrice,
      pricePosition,
      premiumAmount,
      discountAmount,
      varianceFromMidpoint: varMidpoint,
      variancePercentage: varPct,
      verdictHeading,
      verdictText,
    },
    adjustments,
    limitations: [
      'Valuation is derived from academic ex-showroom benchmarks, Indian depreciation curves, observed condition, and repair estimates.',
      'Actual private and dealership resale prices vary based on city RTO taxes, transfer fees, and ownership count.',
    ],
    summary: `Estimated fair-market value: ₹${(fairMin / 100000).toFixed(2)}L – ₹${(fairMax / 100000).toFixed(2)}L (Midpoint: ₹${(midpoint / 100000).toFixed(2)}L).`,
  };
}

/**
 * POST /api/v1/inspections/:id/valuation/evaluate
 * Evaluates and persists vehicle valuation and asking price assessment.
 */
async function evaluateInspectionValuation(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        status: 'error',
        message: 'Inspection not found',
        code: 'NOT_FOUND',
      });
    }

    // Strict multi-tenant ownership check
    if (inspection.userId && req.user && inspection.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You do not have permission to evaluate valuation on this inspection',
        code: 'FORBIDDEN',
      });
    }

    let valuationReport = null;

    // Call FastAPI AI microservice /api/v1/valuation/evaluate
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/v1/valuation/evaluate`,
        {
          inspectionId: inspection._id.toString(),
          vehicleInfo: inspection.vehicleInfo || null,
          conditionScore: inspection.conditionScore || inspection.evidenceAssessment?.conditionScore || null,
          trustScore: inspection.trustScore || inspection.evidenceAssessment?.trustScore || null,
          repairCostAssessment: inspection.repairCostAssessment || null,
        },
        { timeout: 15000 }
      );

      if (response.data) {
        valuationReport = response.data;
      }
    } catch (aiErr) {
      console.warn(
        `[Valuation Gateway] AI service unreachable (${aiErr.message}), executing deterministic local fallback.`
      );
      valuationReport = runDeterministicValuationFallback(
        inspection.vehicleInfo || null,
        inspection.conditionScore || inspection.evidenceAssessment?.conditionScore || null,
        inspection.trustScore || inspection.evidenceAssessment?.trustScore || null,
        inspection.repairCostAssessment || null
      );
    }

    // Persist priceValuation in MongoDB
    inspection.priceValuation = valuationReport;
    await inspection.save();

    return res.status(200).json({
      status: 'success',
      message: 'Vehicle valuation evaluation complete',
      data: {
        inspectionId: inspection._id,
        priceValuation: valuationReport,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/inspections/:id/valuation
 * Retrieves persisted vehicle valuation assessment.
 */
async function getInspectionValuation(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        status: 'error',
        message: 'Inspection not found',
        code: 'NOT_FOUND',
      });
    }

    // Strict multi-tenant ownership check
    if (inspection.userId && req.user && inspection.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You do not have permission to view this valuation',
        code: 'FORBIDDEN',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        inspectionId: inspection._id,
        priceValuation: inspection.priceValuation || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  evaluateInspectionValuation,
  getInspectionValuation,
};
