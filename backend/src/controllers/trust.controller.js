/**
 * ═══════════════════════════════════════════════════════════════
 * CARWISE — Buyer Assessment Trust Controller (Phase 9)
 * Computes Evidence Completeness, Reliability, and Buyer Trust Score V1
 * ═══════════════════════════════════════════════════════════════
 */

const axios = require('axios');
const Inspection = require('../models/Inspection');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const TRUST_V1_CONFIG = {
  mandatoryWeight: 0.70,
  optionalWeight: 0.30,
  mandatoryViews: ['FRONT', 'REAR', 'LEFT', 'RIGHT'],
  reliabilityWeights: {
    evidenceCompleteness: 0.35,
    iqaReliability: 0.25,
    modelConfidence: 0.25,
    crossViewConsistency: 0.15,
  },
  trustCaps: {
    oneMandatoryMissing: 69,
    twoOrMoreMandatoryMissing: 49,
    multipleIqaFailures: 59,
  },
  trustBands: {
    HIGH_CONFIDENCE: 80,
    MODERATE_CONFIDENCE: 65,
    PROCEED_WITH_CAUTION: 50,
  },
};

/**
 * Deterministic local fallback trust evaluation engine.
 */
function runDeterministicTrustFallback(images = [], evidenceAssessment = null) {
  const mandatoryViews = TRUST_V1_CONFIG.mandatoryViews;
  const submittedViews = images.map((img) => (img.viewType || 'UNKNOWN').toUpperCase());
  const submittedSet = new Set(submittedViews);

  const usableImages = images.filter((img) => img.qualityStatus !== 'FAIL' && !img.isDuplicate);
  const usableMandatory = mandatoryViews.filter((mv) => {
    const img = images.find((i) => (i.viewType || '').toUpperCase() === mv);
    return img && img.qualityStatus !== 'FAIL' && !img.isDuplicate;
  });

  const mandatoryCoverage = usableMandatory.length / 4.0;
  const optionalCoverage = Math.min(1.0, Math.max(0.0, (usableImages.length - usableMandatory.length) / 8.0));
  const coverageScore = Number((0.70 * mandatoryCoverage + 0.30 * optionalCoverage).toFixed(4));
  const missingMandatoryCount = 4 - usableMandatory.length;

  if (images.length === 0 || usableImages.length === 0) {
    return {
      version: 'TRUST_V1',
      assessmentStatus: 'INSUFFICIENT_EVIDENCE',
      evidenceCompleteness: {
        mandatoryCoverage: 0.0,
        optionalCoverage: 0.0,
        mandatoryDisclosureRatio: 0.0,
        overallDisclosureRatio: 0.0,
        coverageScore: 0.0,
        usableImageCount: 0,
        submittedImageCount: 0,
        mandatoryViewsComplete: false,
        viewQuality: [],
        blindspots: mandatoryViews.map((mv) => ({
          type: 'MISSING_MANDATORY_VIEW',
          viewType: mv,
          severity: 'HIGH',
          message: `${mv} perspective is missing.`,
        })),
      },
      trustScore: {
        trustScore: null,
        trustBand: 'INSUFFICIENT_EVIDENCE',
        status: 'INSUFFICIENT_EVIDENCE',
        formulaVersion: 'TRUST_V1',
        components: {
          evidenceCompleteness: 0.0,
          iqaReliability: 0.0,
          modelConfidence: 0.0,
          crossViewConsistency: 0.0,
        },
        rawReliabilityScore: 0.0,
        capsApplied: ['NO_USABLE_EVIDENCE'],
        explanation: 'No usable photographic evidence submitted.',
        limitations: ['Cannot establish condition or trust without valid vehicle photographs.'],
      },
      conditionScoreStatus: 'INSUFFICIENT_EVIDENCE',
      modelConfidenceStatus: 'NO_USABLE_EVIDENCE',
      limitations: ['Photographs cannot replace on-site physical mechanical inspection.'],
    };
  }

  // IQA Reliability
  const iqaWeights = { PASS: 1.0, WARN: 0.70, FAIL: 0.0 };
  const totalIqa = images.reduce((sum, img) => sum + (iqaWeights[img.qualityStatus] || 0.70), 0);
  const rIqa = Number((totalIqa / images.length).toFixed(4));
  const iqaFailCount = images.filter((img) => img.qualityStatus === 'FAIL').length;

  // Model Confidence & Cross-view
  const findings = evidenceAssessment?.findings || [];
  let cModel = 0.80;
  if (findings.length === 0) cModel = usableImages.length >= 4 ? 0.90 : 0.55;
  const crossConsistency = usableImages.length >= 4 ? 0.90 : 0.60;

  // Reliability R_evidence
  const rEvidence = Number((0.35 * coverageScore + 0.25 * rIqa + 0.25 * cModel + 0.15 * crossConsistency).toFixed(4));
  let finalTrust = Math.round(rEvidence * 100);
  const capsApplied = [];

  if (missingMandatoryCount >= 2) {
    capsApplied.append ? capsApplied.append('GATED_MAX_49_DUE_TO_2+_MISSING_MANDATORY_VIEWS') : capsApplied.push('GATED_MAX_49_DUE_TO_2+_MISSING_MANDATORY_VIEWS');
    finalTrust = Math.min(finalTrust, 49);
  } else if (missingMandatoryCount === 1) {
    capsApplied.push('GATED_MAX_69_DUE_TO_MISSING_MANDATORY_VIEW');
    finalTrust = Math.min(finalTrust, 69);
  }

  if (iqaFailCount >= 2) {
    capsApplied.push('GATED_MAX_59_DUE_TO_MULTIPLE_IQA_FAILURES');
    finalTrust = Math.min(finalTrust, 59);
  }

  finalTrust = Math.max(0, Math.min(100, finalTrust));

  let band = 'INSUFFICIENT_EVIDENCE';
  if (finalTrust >= 80 && missingMandatoryCount === 0) band = 'HIGH_CONFIDENCE';
  else if (finalTrust >= 65) band = 'MODERATE_CONFIDENCE';
  else if (finalTrust >= 50) band = 'PROCEED_WITH_CAUTION';

  const assessmentStatus = missingMandatoryCount >= 2 ? 'INSUFFICIENT_EVIDENCE' : missingMandatoryCount === 1 ? 'LIMITED_ASSESSMENT' : 'READY_FOR_ASSESSMENT';

  const blindspots = mandatoryViews
    .filter((mv) => !submittedSet.has(mv))
    .map((mv) => ({
      type: 'MISSING_MANDATORY_VIEW',
      viewType: mv,
      severity: 'HIGH',
      message: `${mv} perspective is missing.`,
    }));

  return {
    version: 'TRUST_V1',
    assessmentStatus,
    evidenceCompleteness: {
      mandatoryCoverage,
      optionalCoverage,
      mandatoryDisclosureRatio: Number((usableMandatory.length / 4.0).toFixed(4)),
      overallDisclosureRatio: Number((usableImages.length / 12.0).toFixed(4)),
      coverageScore,
      usableImageCount: usableImages.length,
      submittedImageCount: images.length,
      mandatoryViewsComplete: missingMandatoryCount === 0,
      viewQuality: images.map((img) => ({
        viewType: img.viewType,
        submitted: true,
        usable: img.qualityStatus !== 'FAIL',
        iqaStatus: img.qualityStatus || 'PASS',
        qualityScore: img.qualityScore || 85,
        isDuplicate: img.isDuplicate || false,
        coverageContribution: img.qualityStatus === 'PASS' ? 1.0 : img.qualityStatus === 'WARN' ? 0.7 : 0.0,
      })),
      blindspots,
    },
    trustScore: {
      trustScore: finalTrust,
      trustBand: band,
      status: assessmentStatus,
      formulaVersion: 'TRUST_V1',
      components: {
        evidenceCompleteness: coverageScore,
        iqaReliability: rIqa,
        modelConfidence: cModel,
        crossViewConsistency: crossConsistency,
      },
      rawReliabilityScore: rEvidence,
      capsApplied,
      explanation: `Trust score ${finalTrust}/100 calculated from ${usableImages.length} usable photographs.`,
      limitations: [
        'Trust score measures confidence in assessment completeness and quality, NOT vehicle mechanical roadworthiness.',
        'Hands-on physical mechanical inspection is strongly recommended.',
      ],
    },
    conditionScoreStatus: 'CALCULATED',
    modelConfidenceStatus: findings.length === 0 ? 'NO_VISIBLE_DAMAGE_DETECTED' : 'CONFIDENCE_AGGREGATED',
    limitations: [
      'Trust score measures confidence in assessment completeness and quality, NOT vehicle mechanical roadworthiness.',
      'Photographs cannot certify sub-surface chassis alignment or hidden mechanical condition.',
    ],
  };
}

/**
 * POST /api/v1/inspections/:id/trust/analyze
 * Executes buyer assessment trust evaluation and updates MongoDB.
 */
async function analyzeInspectionTrust(req, res, next) {
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
        message: 'Forbidden: You do not have permission to evaluate trust on this inspection',
        code: 'FORBIDDEN',
      });
    }

    let trustReport = null;

    // Call FastAPI AI microservice /api/v1/trust/analyze
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/v1/trust/analyze`,
        {
          inspectionId: inspection._id.toString(),
          submittedImages: inspection.images || [],
          evidenceAssessment: inspection.evidenceAssessment || null,
        },
        { timeout: 15000 }
      );

      if (response.data) {
        trustReport = response.data;
      }
    } catch (aiErr) {
      console.warn(
        `[Trust Gateway] AI service unreachable (${aiErr.message}), executing deterministic local fallback.`
      );
      trustReport = runDeterministicTrustFallback(inspection.images || [], inspection.evidenceAssessment || null);
    }

    // Persist into MongoDB
    if (!inspection.evidenceAssessment) {
      inspection.evidenceAssessment = { version: 'EVIDENCE_V1', findings: [], zones: [] };
    }

    inspection.evidenceAssessment.evidenceCompleteness = trustReport.evidenceCompleteness;
    inspection.evidenceAssessment.trustScore = trustReport.trustScore;
    inspection.evidenceAssessment.assessmentStatus = trustReport.assessmentStatus;

    // Sync top-level trustScore container
    inspection.trustScore = {
      overallTrustScore: trustReport.trustScore.trustScore,
      trustBand: trustReport.trustScore.trustBand,
      confidenceSummary: trustReport.trustScore.explanation,
      limitations: trustReport.trustScore.limitations || [],
    };

    await inspection.save();

    return res.status(200).json({
      status: 'success',
      message: 'Buyer assessment trust evaluation complete',
      data: {
        inspectionId: inspection._id,
        assessmentTrust: trustReport,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/inspections/:id/trust
 * Retrieves persisted buyer trust score and completeness diagnostics.
 */
async function getInspectionTrust(req, res, next) {
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
        trustScore: inspection.evidenceAssessment?.trustScore || null,
        evidenceCompleteness: inspection.evidenceAssessment?.evidenceCompleteness || null,
        assessmentStatus: inspection.evidenceAssessment?.assessmentStatus || 'INSUFFICIENT_EVIDENCE',
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeInspectionTrust,
  getInspectionTrust,
};
