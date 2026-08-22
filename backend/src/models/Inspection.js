const mongoose = require('mongoose');

// ── 1. Vehicle Information Schema ─────────────────────────────────────────────
const vehicleInfoSchema = new mongoose.Schema(
  {
    make: { type: String, required: true, trim: true, maxlength: 100 },
    model: { type: String, required: true, trim: true, maxlength: 100 },
    variant: { type: String, default: '', trim: true, maxlength: 100 },
    year: {
      type: Number,
      required: true,
      min: [1990, 'Year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the distant future'],
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'],
      required: true,
      lowercase: true,
    },
    transmission: {
      type: String,
      enum: ['manual', 'automatic', 'amt'],
      required: true,
      lowercase: true,
    },
    mileageKm: {
      type: Number,
      required: true,
      min: [0, 'Mileage cannot be negative'],
    },
    askingPrice: {
      type: Number,
      required: true,
      min: [0, 'Asking price cannot be negative'],
    },
    currency: { type: String, default: 'INR', uppercase: true },
    location: { type: String, default: '', trim: true, maxlength: 200 },
    registrationNumber: { type: String, default: '', trim: true, uppercase: true, maxlength: 50 },
  },
  { _id: false }
);

// ── 2. Image Metadata Sub-Schema ──────────────────────────────────────────────
const imageMetadataSchema = new mongoose.Schema(
  {
    imageId: { type: String, required: true },
    viewType: {
      type: String,
      enum: [
        'FRONT', 'REAR', 'LEFT', 'RIGHT',
        'FRONT_LEFT', 'FRONT_RIGHT', 'REAR_LEFT', 'REAR_RIGHT',
        'INTERIOR', 'DASHBOARD', 'ENGINE_BAY', 'TYRES',
        // Lowercase aliases for client compatibility
        'front', 'rear', 'left', 'right',
        'front-left', 'front-right', 'rear-left', 'rear-right',
        'interior', 'dashboard', 'engine', 'tyres',
      ],
      required: true,
    },
    filePath: { type: String, required: true },
    storageKey: { type: String, default: '' },
    originalFilename: { type: String, default: '' },
    mimeType: { type: String, default: 'image/jpeg' },
    size: { type: Number, default: 0 },
    uploadTimestamp: { type: Date, default: Date.now },
    qualityStatus: {
      type: String,
      enum: ['PASS', 'WARN', 'FAIL', 'PENDING'],
      default: 'PENDING',
    },
    qualityScore: { type: Number, min: 0, max: 100, default: null },
    qualityMetrics: {
      blurScore: Number,
      brightnessMean: Number,
      isDuplicate: { type: Boolean, default: false },
      notes: [String],
    },
  },
  { _id: true }
);

// ── 3. Modular Analytical Containers (Structured for Future Phases) ───────────
const damageDetectionItemSchema = new mongoose.Schema(
  {
    imageAngle: String,
    vehicleZone: {
      type: String,
      enum: [
        'ZONE_FRONT', 'ZONE_REAR', 'ZONE_FRONT_LEFT', 'ZONE_FRONT_RIGHT',
        'ZONE_REAR_LEFT', 'ZONE_REAR_RIGHT', 'ZONE_LEFT_SIDE', 'ZONE_RIGHT_SIDE',
      ],
    },
    damageType: {
      type: String,
      enum: [
        'dent', 'scratch', 'crack', 'rust', 'paint_anomaly',
        'panel_misalignment', 'broken_part', 'damaged_bumper', 'damaged_light',
      ],
    },
    component: String,
    severity: { type: String, enum: ['minor', 'moderate', 'severe'] },
    confidence: { type: Number, min: 0, max: 1 },
    bbox: {
      x: Number, y: Number, w: Number, h: Number,
    },
    notes: String,
  },
  { _id: true }
);

const crossViewObservationSchema = new mongoose.Schema(
  {
    vehicleZone: String,
    zoneTitle: String,
    involvedViews: [String],
    observedFinding: String,
    confidenceIndicator: { type: String, enum: ['HIGH', 'MODERATE', 'LOW'] },
    recommendedAction: String,
  },
  { _id: true }
);

const checklistItemSchema = new mongoose.Schema(
  {
    priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
    zone: String,
    item: String,
    rationale: String,
  },
  { _id: true }
);

// ── 4. Main Inspection Schema ─────────────────────────────────────────────────
const inspectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETE', 'FAILED', 'pending', 'processing', 'complete', 'failed'],
      default: 'PENDING',
      index: true,
    },
    vehicleInfo: {
      type: vehicleInfoSchema,
      required: [true, 'Vehicle information is required'],
    },
    images: [imageMetadataSchema],

    // Future analytical containers (modular, populated in phases 6-13)
    conditionScore: {
      overallScore: { type: Number, min: 0, max: 100 },
      observableCosmeticScore: Number,
      panelIntegrityScore: Number,
      paintIntegrityScore: Number,
      deductionSummary: [
        {
          finding: String,
          zone: String,
          deduction: Number,
        },
      ],
    },

    evidenceConfidence: {
      visualCoverageIndex: { type: Number, min: 0, max: 1 },
      mandatoryAnglesSubmitted: { type: Number, default: 0 },
      optionalAnglesSubmitted: { type: Number, default: 0 },
      uninspectedBlindspots: [String],
      dataCompletenessRatio: { type: Number, default: 0 },
    },

    trustScore: {
      overallTrustScore: { type: Number, min: 0, max: 100 },
      trustBand: {
        type: String,
        enum: ['HIGH_CONFIDENCE', 'MODERATE_CONFIDENCE', 'PROCEED_WITH_CAUTION', 'INSUFFICIENT_EVIDENCE'],
      },
      confidenceSummary: String,
      limitations: [String],
    },

    detections: [damageDetectionItemSchema],
    crossViewObservations: [crossViewObservationSchema],

    priceValuation: {
      status: {
        type: String,
        enum: ['VALIDATED', 'PENDING_DATASET_VALIDATION'],
        default: 'PENDING_DATASET_VALIDATION',
      },
      datasetName: String,
      fairRangeLow: Number,
      fairRangeHigh: Number,
      fairMedian: Number,
      askingPrice: Number,
      priceDeltaPercentage: Number,
      valuationNote: String,
    },

    prioritizedChecklist: [checklistItemSchema],

    finalRecommendation: {
      verdict: {
        type: String,
        enum: ['RECOMMENDED_FOR_INSPECTION', 'PROCEED_WITH_CAUTION', 'HIGH_RISK_AVOID'],
      },
      summaryHeading: String,
      summaryText: String,
    },

    completedAt: { type: Date },

    // Soft deletion support
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Exclude soft-deleted records from standard queries unless explicitly queried
inspectionSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
});

module.exports = mongoose.model('Inspection', inspectionSchema);
