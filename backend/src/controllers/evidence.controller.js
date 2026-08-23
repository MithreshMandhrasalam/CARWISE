/**
 * ═══════════════════════════════════════════════════════════════
 * CARWISE — Evidence Reasoning Controller (Phase 8)
 * Transforms YOLO11s detections into normalized evidence,
 * vehicle-zone mappings, deterministic severity, and condition scores.
 * ═══════════════════════════════════════════════════════════════
 */

const axios = require('axios');
const Inspection = require('../models/Inspection');
const { detectDamage } = require('./damage.controller');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const DAMAGE_CLASS_PRIORITY = {
  glass_shatter: 5,
  tire_flat: 5,
  lamp_broken: 4,
  crack: 4,
  dent: 2,
  scratch: 1,
};

const SEVERITY_DEDUCTIONS = {
  MINOR: 5,
  MODERATE: 15,
  SEVERE: 30,
};

/**
 * Deterministic local fallback reasoning engine for development/recovery.
 */
function runDeterministicEvidenceFallback(damageDetections, submittedViews = []) {
  const normalizedFindings = [];

  for (const record of damageDetections || []) {
    if (record.status === 'BLOCKED_BY_IQA') continue;

    const viewType = record.viewType || 'FRONT';
    for (const det of record.detections || []) {
      const bbox = det.bbox || { xMin: 0.2, yMin: 0.2, xMax: 0.4, yMax: 0.4 };
      const width = Math.max(0, bbox.xMax - bbox.xMin);
      const height = Math.max(0, bbox.yMax - bbox.yMin);
      const areaRatio = Number((width * height).toFixed(4));

      // Map zone
      let zone = 'FRONT';
      const xCenter = (bbox.xMin + bbox.xMax) / 2.0;
      if (['FRONT', 'FRONT_LEFT', 'FRONT_RIGHT'].includes(viewType)) {
        zone = xCenter < 0.35 ? 'FRONT_LEFT' : xCenter > 0.65 ? 'FRONT_RIGHT' : 'FRONT';
      } else if (['REAR', 'REAR_LEFT', 'REAR_RIGHT'].includes(viewType)) {
        zone = xCenter < 0.35 ? 'REAR_LEFT' : xCenter > 0.65 ? 'REAR_RIGHT' : 'REAR';
      } else if (['LEFT', 'LEFT_SIDE'].includes(viewType)) {
        zone = 'LEFT_SIDE';
      } else if (['RIGHT', 'RIGHT_SIDE'].includes(viewType)) {
        zone = 'RIGHT_SIDE';
      }

      // Calculate severity
      let severity = 'MINOR';
      const basis = [`damage_class=${det.className}`, `bbox_area_ratio=${areaRatio}`];

      if (['glass_shatter', 'tire_flat'].includes(det.className) || areaRatio >= 0.10) {
        severity = 'SEVERE';
        basis.push('structural_component_or_large_area_damage');
      } else if (['crack', 'lamp_broken'].includes(det.className) || areaRatio >= 0.03) {
        severity = 'MODERATE';
        basis.push('fracture_or_moderate_area_damage');
      } else {
        basis.push('superficial_flaw_area_lt_0.03');
      }

      normalizedFindings.push({
        evidenceId: `ev-${Math.random().toString(36).substr(2, 9)}`,
        imageId: record.imageId,
        viewType,
        zone,
        damageClass: det.className,
        modelConfidence: det.confidence,
        confidenceBand: det.confidenceBand || (det.confidence >= 0.55 ? 'HIGH_CONFIDENCE' : 'POTENTIAL'),
        bbox,
        bboxAreaRatio: areaRatio,
        severity,
        severityBasis: basis,
        mappingConfidence: 'HIGH',
        mappingBasis: `Logical vehicle-zone association based on ${viewType} perspective`,
        requiresPhysicalVerification: true,
        isDuplicateEvidence: false,
        duplicateOf: null,
        qualityWarning: det.qualityWarning || false,
      });
    }
  }

  // Zone Aggregations
  const canonicalZones = ['FRONT', 'FRONT_LEFT', 'FRONT_RIGHT', 'REAR', 'REAR_LEFT', 'REAR_RIGHT', 'LEFT_SIDE', 'RIGHT_SIDE'];
  const zones = [];

  for (const z of canonicalZones) {
    const items = normalizedFindings.filter((f) => f.zone === z);
    if (items.length > 0) {
      const prioritySum = items.reduce((sum, item) => sum + (DAMAGE_CLASS_PRIORITY[item.damageClass] || 1), 0);
      let highestSev = 'MINOR';
      if (items.some((it) => it.severity === 'SEVERE')) highestSev = 'SEVERE';
      else if (items.some((it) => it.severity === 'MODERATE')) highestSev = 'MODERATE';

      zones.push({
        zone: z,
        findingCount: items.length,
        highestSeverity: highestSev,
        evidencePriority: prioritySum,
        findings: items,
      });
    }
  }

  // Deductions & Condition Score
  const deductions = [];
  let totalDeduction = 0;
  for (const f of normalizedFindings) {
    const pts = SEVERITY_DEDUCTIONS[f.severity] || 5;
    totalDeduction += pts;
    deductions.push({
      reason: `${f.severity} ${f.damageClass} in ${f.zone}`,
      zone: f.zone,
      severity: f.severity,
      points: pts,
    });
  }

  const conditionScore = {
    score: Math.max(0, Math.min(100, 100 - totalDeduction)),
    formulaVersion: 'CONDITION_V1',
    baseScore: 100,
    deductions,
    explanation: `Condition score computed deterministically from ${normalizedFindings.length} observable findings.`,
    limitations: [
      'Score reflects visible 2D cosmetic and surface damage evidence only.',
      'Photographs cannot establish hidden mechanical condition or chassis alignment.',
      'Hands-on physical inspection is strongly recommended.',
    ],
  };

  const mandatoryViews = ['FRONT', 'REAR', 'LEFT', 'RIGHT'];
  const submittedSet = new Set(submittedViews.length > 0 ? submittedViews : damageDetections.map((d) => d.viewType));
  const mandatoryViewsComplete = mandatoryViews.every((mv) => submittedSet.has(mv));
  const blindspots = mandatoryViews.filter((mv) => !submittedSet.has(mv)).map((mv) => `MANDATORY_${mv}`);

  return {
    version: 'EVIDENCE_V1',
    totalEvidenceCount: normalizedFindings.length,
    uniqueFindingCount: normalizedFindings.length,
    findings: normalizedFindings,
    zones,
    crossViewObservations: [],
    conditionScore,
    evidenceCompleteness: {
      coverageScore: Number((submittedSet.size / 8.0).toFixed(2)),
      mandatoryViewsComplete,
      usableImageCount: (damageDetections || []).filter((d) => d.status !== 'BLOCKED_BY_IQA').length,
      submittedViews: Array.from(submittedSet),
      blindspots,
      warnings: mandatoryViewsComplete ? [] : [`Missing mandatory views: ${blindspots.join(', ')}`],
    },
    trustScore: {
      trustScore: null,
      status: 'PENDING_TRUST_MODEL',
      reason: 'Trust scoring requires evidence completeness, model confidence, and price validation.',
    },
    limitations: [
      'All findings represent observable 2D photographic evidence and require physical verification.',
      'Vehicle-zone mappings represent logical associations based on camera perspective.',
      'Severity classifications are computed via deterministic rules.',
    ],
    analyzedAt: new Date(),
  };
}

/**
 * POST /api/v1/inspections/:id/evidence/analyze
 * Executes evidence reasoning on damage detection findings and updates MongoDB.
 */
async function analyzeInspectionEvidence(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        status: 'error',
        message: 'Inspection not found',
        code: 'NOT_FOUND',
      });
    }

    // Strict multi-tenant inspection ownership check
    if (inspection.userId && req.user && inspection.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You do not have permission to analyze this inspection',
        code: 'FORBIDDEN',
      });
    }

    const submittedViews = (inspection.images || []).map((img) => img.viewType);
    let evidenceReport = null;

    // Call FastAPI AI microservice /api/v1/evidence/analyze
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/v1/evidence/analyze`,
        {
          inspectionId: inspection._id.toString(),
          damageResults: inspection.damageDetections || [],
          submittedViews,
        },
        { timeout: 15000 }
      );

      if (response.data) {
        evidenceReport = response.data;
      }
    } catch (aiErr) {
      console.warn(
        `[Evidence Gateway] AI service unreachable (${aiErr.message}), executing deterministic local fallback.`
      );
      evidenceReport = runDeterministicEvidenceFallback(inspection.damageDetections || [], submittedViews);
    }

    // Persist evidence assessment in MongoDB
    inspection.evidenceAssessment = evidenceReport;
    if (evidenceReport.conditionScore) {
      inspection.conditionScore = {
        overallScore: evidenceReport.conditionScore.score,
        observableCosmeticScore: evidenceReport.conditionScore.score,
        panelIntegrityScore: evidenceReport.conditionScore.score,
        paintIntegrityScore: evidenceReport.conditionScore.score,
        deductionSummary: (evidenceReport.conditionScore.deductions || []).map((d) => ({
          finding: d.reason,
          zone: d.zone,
          deduction: d.points,
        })),
      };
    }
    await inspection.save();

    return res.status(200).json({
      status: 'success',
      message: 'Evidence reasoning and deterministic assessment complete',
      data: {
        inspectionId: inspection._id,
        evidenceAssessment: evidenceReport,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/inspections/:id/evidence
 * Retrieves persisted evidence assessment findings for an inspection.
 */
async function getInspectionEvidence(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        status: 'error',
        message: 'Inspection not found',
        code: 'NOT_FOUND',
      });
    }

    // Strict multi-tenant inspection ownership check
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
        evidenceAssessment: inspection.evidenceAssessment || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeInspectionEvidence,
  getInspectionEvidence,
};
