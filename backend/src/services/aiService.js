const axios = require('axios');

const AI_BASE = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_API = `${AI_BASE}/api/v1/ai`;

// Route map (must match FastAPI prefix + router paths)
// POST /api/v1/ai/damage/detect
// POST /api/v1/ai/price/estimate
// POST /api/v1/ai/score/compute
// POST /api/v1/ai/score/assessment/generate

/**
 * Calls the Python FastAPI AI service for damage detection.
 */
const detectDamage = async (images) => {
  const imagePayload = images.map((img) => ({
    angle: img.angle,
    url: img.url,
  }));

  const { data } = await axios.post(`${AI_API}/damage/detect`, { images: imagePayload }, {
    timeout: 60000,
  });
  return data;
};

/**
 * Calls the price estimation endpoint.
 */
const estimatePrice = async (vehicleInfo) => {
  const { data } = await axios.post(`${AI_API}/price/estimate`, vehicleInfo, { timeout: 15000 });
  return data;
};

/**
 * Computes the condition score.
 */
const computeScore = async (vehicleInfo, damageResult) => {
  const { data } = await axios.post(
    `${AI_API}/score/compute`,
    { vehicleInfo, damageResult },
    { timeout: 15000 }
  );
  return data;
};

/**
 * Generates the final trust assessment.
 */
const generateAssessment = async (vehicleInfo, damageResult, priceResult, scoreResult) => {
  const { data } = await axios.post(
    `${AI_API}/score/assessment/generate`,
    { vehicleInfo, damageResult, priceResult, scoreResult },
    { timeout: 15000 }
  );
  return data;
};

/**
 * Orchestrates the full AI pipeline for an inspection.
 */
const runFullAnalysis = async (inspection) => {
  const vehicleInfo = inspection.vehicleInfo.toObject();
  const images = inspection.images.map((img) => img.toObject());

  const [damageResult, priceResult] = await Promise.all([
    detectDamage(images),
    estimatePrice(vehicleInfo),
  ]);

  const scoreResult = await computeScore(vehicleInfo, damageResult);
  const assessmentResult = await generateAssessment(
    vehicleInfo,
    damageResult,
    priceResult,
    scoreResult
  );

  return {
    damageDetection: damageResult,
    priceEstimation: priceResult,
    conditionScore: scoreResult,
    inspectionChecklist: assessmentResult.inspectionChecklist,
    finalAssessment: assessmentResult.finalAssessment,
  };
};

module.exports = { detectDamage, estimatePrice, computeScore, generateAssessment, runFullAnalysis };
