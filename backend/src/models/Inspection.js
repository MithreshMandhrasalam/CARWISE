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
      ],
      required: true,
    },
    storageKey: { type: String, required: true },
    originalFilename: { type: String, default: '' },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    width: { type: Number, default: 800 },
    height: { type: Number, default: 600 },
    uploadedAt: { type: Date, default: Date.now },
    processingStatus: {
      type: String,
      enum: ['UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED'],
      default: 'UPLOADED',
    },
    qualityStatus: {
      type: String,
      enum: ['PASS', 'WARN', 'FAIL', 'PENDING'],
      default: 'PENDING',
    },
    qualityScore: { type: Number, min: 0, max: 100, default: null },
    warnings: [String],
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
    damageDetections: [
      {
        imageId: String,
        viewType: String,
        status: {
          type: String,
          enum: ['COMPLETE', 'BLOCKED_BY_IQA', 'NO_DAMAGE_DETECTED', 'MODEL_ERROR'],
          default: 'COMPLETE',
        },
        detections: [
          {
            className: String,
            classId: Number,
            confidence: Number,
            confidenceBand: { type: String, enum: ['HIGH_CONFIDENCE', 'POTENTIAL'] },
            bbox: {
              xMin: Number,
              yMin: Number,
              xMax: Number,
              yMax: Number,
            },
            qualityWarning: { type: Boolean, default: false },
          },
        ],
        iqa: mongoose.Schema.Types.Mixed,
        modelMetadata: {
          name: { type: String, default: 'YOLO11s' },
          provider: { type: String, default: 'Ultralytics' },
          version: { type: String, default: '1.0.0' },
          weightsVersion: { type: String, default: 'cardd-baseline-v1' },
          dataset: { type: String, default: 'CarDD' },
          inferenceTimeMs: { type: Number, default: 0 },
        },
        analyzedAt: { type: Date, default: Date.now },
      },
    ],
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

    evidenceAssessment: {
      version: { type: String, default: 'EVIDENCE_V1' },
      totalEvidenceCount: { type: Number, default: 0 },
      uniqueFindingCount: { type: Number, default: 0 },
      findings: [
        {
          evidenceId: String,
          imageId: String,
          viewType: String,
          zone: String,
          damageClass: String,
          modelConfidence: Number,
          confidenceBand: String,
          bbox: {
            xMin: Number,
            yMin: Number,
            xMax: Number,
            yMax: Number,
          },
          bboxAreaRatio: Number,
          severity: String,
          severityBasis: [String],
          mappingConfidence: String,
          mappingBasis: String,
          requiresPhysicalVerification: { type: Boolean, default: true },
          isDuplicateEvidence: { type: Boolean, default: false },
          duplicateOf: String,
          qualityWarning: { type: Boolean, default: false },
        },
      ],
      zones: [
        {
          zone: String,
          findingCount: Number,
          highestSeverity: String,
          evidencePriority: Number,
          findings: [mongoose.Schema.Types.Mixed],
        },
      ],
      crossViewObservations: [
        {
          observationId: String,
          type: String,
          severity: String,
          zones: [String],
          evidenceIds: [String],
          statement: String,
          requiresPhysicalVerification: { type: Boolean, default: true },
        },
      ],
      conditionScore: {
        score: { type: Number, min: 0, max: 100 },
        formulaVersion: { type: String, default: 'CONDITION_V1' },
        baseScore: { type: Number, default: 100 },
        deductions: [
          {
            reason: String,
            zone: String,
            severity: String,
            points: Number,
          },
        ],
        explanation: String,
        limitations: [String],
      },
      evidenceCompleteness: {
        coverageScore: Number,
        mandatoryViewsComplete: Boolean,
        usableImageCount: Number,
        submittedViews: [String],
        blindspots: [String],
        warnings: [String],
      },
      trustScore: {
        trustScore: { type: Number, default: null },
        status: { type: String, default: 'PENDING_TRUST_MODEL' },
        reason: {
          type: String,
          default: 'Trust scoring requires evidence completeness, model confidence, and price validation.',
        },
      },
      limitations: [String],
      analyzedAt: { type: Date, default: Date.now },
    },

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
