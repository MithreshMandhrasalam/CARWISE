const mongoose = require('mongoose');

// ── Sub-schemas ──────────────────────────────────────────────────────────────

const vehicleInfoSchema = new mongoose.Schema(
  {
    make: { type: String, required: true },
    model: { type: String, required: true },
    variant: { type: String, default: '' },
    year: { type: Number, required: true, min: 1980, max: new Date().getFullYear() + 1 },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'],
      required: true,
    },
    transmission: {
      type: String,
      enum: ['manual', 'automatic', 'amt'],
      required: true,
    },
    mileageKm: { type: Number, required: true, min: 0 },
    askingPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    location: { type: String, default: '' },
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    angle: {
      type: String,
      enum: [
        'front', 'rear', 'left', 'right',
        'front-left', 'front-right', 'rear-left', 'rear-right',
        'interior', 'dashboard', 'engine',
        'tyre-fl', 'tyre-fr', 'tyre-rl', 'tyre-rr',
      ],
      required: true,
    },
    storageKey: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const detectionSchema = new mongoose.Schema(
  {
    imageAngle: String,
    damageType: {
      type: String,
      enum: [
        'dent', 'scratch', 'crack', 'rust', 'paint_anomaly',
        'broken_part', 'damaged_bumper', 'damaged_light',
        'damaged_panel', 'tyre_abnormality',
      ],
    },
    component: String,
    severity: { type: String, enum: ['minor', 'moderate', 'severe'] },
    confidence: { type: Number, min: 0, max: 1 },
    boundingBox: {
      x: Number, y: Number, w: Number, h: Number,
    },
    notes: String,
  },
  { _id: true }
);

const damageDetectionSchema = new mongoose.Schema(
  {
    modelVersion: String,
    isMock: { type: Boolean, default: true },
    detections: [detectionSchema],
    repairIndicationFlag: { type: Boolean, default: false },
    repairIndicationNote: String,
  },
  { _id: false }
);

const priceEstimationSchema = new mongoose.Schema(
  {
    modelVersion: String,
    isMock: { type: Boolean, default: true },
    estimatedRangeLow: Number,
    estimatedRangeHigh: Number,
    estimatedMid: Number,
    askingPrice: Number,
    priceDelta: Number,
    priceAssessment: {
      type: String,
      enum: ['underpriced', 'fair', 'slightly_overpriced', 'significantly_overpriced'],
    },
    factors: [String],
  },
  { _id: false }
);

const conditionScoreSchema = new mongoose.Schema(
  {
    modelVersion: String,
    isMock: { type: Boolean, default: true },
    overallScore: { type: Number, min: 0, max: 100 },
    subScores: {
      exteriorCondition: Number,
      interiorCondition: Number,
      visibleDamage: Number,
      tyreCondition: Number,
      vehicleAge: Number,
      mileageFactor: Number,
      maintenanceEvidence: Number,
      priceFairness: Number,
    },
    scoreExplanation: [String],
  },
  { _id: false }
);

const checklistItemSchema = new mongoose.Schema(
  {
    priority: { type: String, enum: ['high', 'medium', 'low'] },
    area: String,
    reason: String,
  },
  { _id: true }
);

const finalAssessmentSchema = new mongoose.Schema(
  {
    trustScore: { type: Number, min: 0, max: 100 },
    conditionRating: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'critical'],
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
    },
    majorFindings: [String],
    recommendation: {
      type: String,
      enum: ['RECOMMENDED', 'CONSIDER_INSPECT', 'PROCEED_CAUTION', 'AVOID'],
    },
    recommendationText: String,
    disclaimer: {
      type: String,
      default:
        'This is an AI-assisted decision-support report. It does not replace a professional mechanical inspection.',
    },
  },
  { _id: false }
);

// ── Main Inspection Schema ────────────────────────────────────────────────────

const inspectionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'complete', 'failed'],
      default: 'pending',
    },
    completedAt: Date,
    vehicleInfo: { type: vehicleInfoSchema, required: true },
    images: [imageSchema],
    aiResults: {
      damageDetection: damageDetectionSchema,
      priceEstimation: priceEstimationSchema,
      conditionScore: conditionScoreSchema,
      inspectionChecklist: [checklistItemSchema],
      finalAssessment: finalAssessmentSchema,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inspection', inspectionSchema);
