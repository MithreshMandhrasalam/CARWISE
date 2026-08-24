/**
 * ═══════════════════════════════════════════════════════════════
 * CARWISE — Repair Cost Estimation Controller (Phase 10)
 * Evaluates itemized & aggregated repair cost ranges (INR)
 * ═══════════════════════════════════════════════════════════════
 */

const axios = require('axios');
const Inspection = require('../models/Inspection');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const BASE_REPAIR_COSTS = {
  RUBBING_COMPOUNDING_OR_SPOT_PAINT: { min: 500, max: 1500, name: 'Rubbing, Compounding & Spot Polish' },
  PANEL_TOUCHUP_AND_CLEARCOAT: { min: 1500, max: 3500, name: 'Spot Sanding & Clearcoat Blending' },
  FULL_PANEL_REPAINT: { min: 3000, max: 6000, name: 'Full Panel Refinishing & Oven Bake' },
  PAINTLESS_DENT_REMOVAL_PDR: { min: 1000, max: 2500, name: 'Paintless Dent Removal (PDR)' },
  DENT_PULLING_BODYWORK_AND_PAINT: { min: 3000, max: 7500, name: 'Dent Pulling Bodywork & Repaint' },
  PANEL_REPLACEMENT_OR_MAJOR_BODYWORK: { min: 7500, max: 18000, name: 'Major Panel Overhaul / Replacement' },
  PLASTIC_WELDING_OR_PART_REPLACEMENT: { min: 2000, max: 6000, name: 'Plastic Welding / Bumper Repair' },
  HEADLAMP_OR_TAILLAMP_ASSEMBLY_REPLACEMENT: { min: 2500, max: 8500, name: 'Lamp Assembly Replacement' },
  WINDSHIELD_OR_GLASS_REPLACEMENT: { min: 4500, max: 12000, name: 'Automotive Glass Replacement' },
  TYRE_REPLACEMENT_OR_PUNCTURE_OVERHAUL: { min: 3500, max: 8000, name: 'Radial Tyre Replacement & Balancing' },
};

const SEGMENT_FACTORS = {
  HATCHBACK: 1.0,
  ENTRY: 1.0,
  SEDAN: 1.25,
  COMPACT_SUV: 1.25,
  MID_SUV: 1.6,
  PREMIUM_SEDAN: 1.6,
  LUXURY: 2.5,
};

const REGION_FACTORS = {
  TIER_1_METRO: 1.2,
  TIER_2: 1.0,
  TIER_3_RURAL: 0.85,
};

const ZONE_FACTORS = {
  FRONT: 1.0,
  REAR: 1.0,
  FRONT_LEFT: 1.15,
  FRONT_RIGHT: 1.15,
  REAR_LEFT: 1.15,
  REAR_RIGHT: 1.15,
  LEFT_SIDE: 1.25,
  RIGHT_SIDE: 1.25,
};

function mapAction(damageClass, severity) {
  const dc = (damageClass || '').toLowerCase();
  const sev = (severity || 'MINOR').toUpperCase();

  if (dc === 'scratch') {
    if (sev === 'SEVERE') return 'FULL_PANEL_REPAINT';
    if (sev === 'MODERATE') return 'PANEL_TOUCHUP_AND_CLEARCOAT';
    return 'RUBBING_COMPOUNDING_OR_SPOT_PAINT';
  } else if (dc === 'dent') {
    if (sev === 'SEVERE') return 'PANEL_REPLACEMENT_OR_MAJOR_BODYWORK';
    if (sev === 'MODERATE') return 'DENT_PULLING_BODYWORK_AND_PAINT';
    return 'PAINTLESS_DENT_REMOVAL_PDR';
  } else if (dc === 'crack') {
    return 'PLASTIC_WELDING_OR_PART_REPLACEMENT';
  } else if (dc === 'lamp_broken') {
    return 'HEADLAMP_OR_TAILLAMP_ASSEMBLY_REPLACEMENT';
  } else if (dc === 'glass_shatter') {
    return 'WINDSHIELD_OR_GLASS_REPLACEMENT';
  } else if (dc === 'tire_flat') {
    return 'TYRE_REPLACEMENT_OR_PUNCTURE_OVERHAUL';
  }
  return 'RUBBING_COMPOUNDING_OR_SPOT_PAINT';
}

function detectSegment(vehicleInfo) {
  if (!vehicleInfo) return 'HATCHBACK';
  const make = String(vehicleInfo.make || '').toUpperCase();
  const model = String(vehicleInfo.model || '').toUpperCase();

  if (['BMW', 'MERCEDES', 'AUDI', 'JAGUAR', 'VOLVO'].some((b) => make.includes(b)) || model.includes('FORTUNER')) {
    return 'LUXURY';
  }
  if (['CRETA', 'SELTOS', 'CITY', 'VERNA', 'SCORPIO', 'HARRIER', 'XUV700', 'INNOVA'].some((m) => model.includes(m))) {
    return 'MID_SUV';
  }
  if (['NEXON', 'BREZZA', 'VENUE', 'SONET', 'AMAZE', 'DZIRE', 'PUNCH'].some((m) => model.includes(m))) {
    return 'SEDAN';
  }
  return 'HATCHBACK';
}

function runDeterministicRepairFallback(evidenceAssessment, vehicleInfo, regionTier = 'TIER_2') {
  const segment = detectSegment(vehicleInfo);
  const fSegment = SEGMENT_FACTORS[segment] || 1.0;
  const fRegion = REGION_FACTORS[regionTier.toUpperCase()] || 1.0;

  const findings = evidenceAssessment?.findings || [];
  const usableFindings = findings.filter((f) => !f.isDuplicateEvidence);

  if (usableFindings.length === 0) {
    return {
      version: 'REPAIR_V1',
      currency: 'INR',
      status: 'NO_DAMAGE_DETECTED',
      totalEstimatedRange: { min: 0, max: 0, median: 0 },
      vehicleSegment: segment,
      regionTier,
      multipliersApplied: {
        segment,
        segmentFactor: fSegment,
        region: regionTier,
        regionFactor: fRegion,
      },
      itemizedRepairs: [],
      synergyDiscountApplied: { itemsCount: 0, discountPercentage: 0, savingsMedian: 0 },
      summary: 'No visible cosmetic defects requiring repair detected.',
      limitations: ['Estimates reflect visible photographic evidence only.'],
    };
  }

  const itemized = [];
  let rawMinSum = 0;
  let rawMaxSum = 0;

  for (const f of usableFindings) {
    const dc = f.damageClass || 'scratch';
    const sev = f.severity || 'MINOR';
    const zone = f.zone || 'FRONT';
    const actionCode = mapAction(dc, sev);
    const baseSpec = BASE_REPAIR_COSTS[actionCode] || BASE_REPAIR_COSTS.RUBBING_COMPOUNDING_OR_SPOT_PAINT;

    const fZone = ZONE_FACTORS[zone] || 1.0;
    const combinedMult = fSegment * fRegion * fZone;

    const itemMin = Math.round(baseSpec.min * combinedMult);
    const itemMax = Math.round(baseSpec.max * combinedMult);
    const itemMedian = Math.round((itemMin + itemMax) / 2.0);

    rawMinSum += itemMin;
    rawMaxSum += itemMax;

    itemized.push({
      repairId: `rep-${Math.random().toString(36).substr(2, 8)}`,
      evidenceId: f.evidenceId,
      zone,
      damageClass: dc,
      severity: sev,
      recommendedAction: actionCode,
      actionName: baseSpec.name,
      actionDescription: `${baseSpec.name} for ${sev.toLowerCase()} ${dc.replace('_', ' ')} in ${zone}.`,
      baseRange: { min: baseSpec.min, max: baseSpec.max, median: Math.round((baseSpec.min + baseSpec.max) / 2) },
      estimatedRange: { min: itemMin, max: itemMax, median: itemMedian },
      confidence: f.modelConfidence >= 0.7 ? 'HIGH' : f.modelConfidence >= 0.5 ? 'MODERATE' : 'LOW',
      requiresPhysicalInspection: true,
      qualityWarning: f.qualityWarning || false,
    });
  }

  const itemsCount = itemized.length;
  const discountPct = itemsCount >= 3 ? 15 : itemsCount === 2 ? 10 : 0;
  const discountMult = (100 - discountPct) / 100.0;

  const finalMin = Math.round(rawMinSum * discountMult);
  const finalMax = Math.round(rawMaxSum * discountMult);
  const finalMedian = Math.round((finalMin + finalMax) / 2.0);
  const rawMedian = Math.round((rawMinSum + rawMaxSum) / 2.0);

  return {
    version: 'REPAIR_V1',
    currency: 'INR',
    status: 'COMPLETE',
    totalEstimatedRange: { min: finalMin, max: finalMax, median: finalMedian },
    vehicleSegment: segment,
    regionTier,
    multipliersApplied: {
      segment,
      segmentFactor: fSegment,
      region: regionTier,
      regionFactor: fRegion,
    },
    itemizedRepairs: itemized,
    synergyDiscountApplied: {
      itemsCount,
      discountPercentage: discountPct,
      savingsMedian: rawMedian - finalMedian,
    },
    summary: `Estimated total repair range: ₹${finalMin.toLocaleString()} – ₹${finalMax.toLocaleString()} (Median: ₹${finalMedian.toLocaleString()}) across ${itemsCount} defect(s).`,
    limitations: [
      'Estimates reflect baseline independent multi-brand workshop labor and material rates in India (2026).',
      'Authorized OEM dealership estimates may be 30%–60% higher due to genuine part markup.',
      'Hands-on physical bodyshop estimate is required before making financial commitments.',
    ],
  };
}

/**
 * POST /api/v1/inspections/:id/repair/estimate
 * Calculates and persists repair cost assessment for an inspection.
 */
async function estimateInspectionRepairCost(req, res, next) {
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
        message: 'Forbidden: You do not have permission to estimate repair costs on this inspection',
        code: 'FORBIDDEN',
      });
    }

    const regionTier = req.body?.regionTier || 'TIER_2';
    let repairReport = null;

    // Call FastAPI AI microservice /api/v1/repair/estimate
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/v1/repair/estimate`,
        {
          inspectionId: inspection._id.toString(),
          evidenceAssessment: inspection.evidenceAssessment || null,
          vehicleInfo: inspection.vehicleInfo || null,
          regionTier,
        },
        { timeout: 15000 }
      );

      if (response.data) {
        repairReport = response.data;
      }
    } catch (aiErr) {
      console.warn(
        `[Repair Gateway] AI service unreachable (${aiErr.message}), executing deterministic local fallback.`
      );
      repairReport = runDeterministicRepairFallback(
        inspection.evidenceAssessment || null,
        inspection.vehicleInfo || null,
        regionTier
      );
    }

    // Persist repair cost assessment in MongoDB
    inspection.repairCostAssessment = repairReport;
    await inspection.save();

    return res.status(200).json({
      status: 'success',
      message: 'Repair cost estimation complete',
      data: {
        inspectionId: inspection._id,
        repairCostAssessment: repairReport,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/inspections/:id/repair
 * Retrieves persisted repair cost assessment for an inspection.
 */
async function getInspectionRepairCost(req, res, next) {
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
        message: 'Forbidden: You do not have permission to view this inspection',
        code: 'FORBIDDEN',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        inspectionId: inspection._id,
        repairCostAssessment: inspection.repairCostAssessment || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  estimateInspectionRepairCost,
  getInspectionRepairCost,
};
