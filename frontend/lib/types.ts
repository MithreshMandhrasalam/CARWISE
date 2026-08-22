// ═══════════════════════════════════════════════════════════════
// CARWISE — Shared TypeScript Domain Types & Interfaces
// Car Assessment & Risk With Intelligent Safety & Evidence
// ═══════════════════════════════════════════════════════════════

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
export type Transmission = 'manual' | 'automatic' | 'amt';

export type MandatoryImageAngle = 'front' | 'rear' | 'left' | 'right';
export type OptionalImageAngle =
  | 'front-left'
  | 'front-right'
  | 'rear-left'
  | 'rear-right'
  | 'interior'
  | 'dashboard'
  | 'engine'
  | 'tyres';

export type ImageAngle = MandatoryImageAngle | OptionalImageAngle;

export type VehicleZone =
  | 'ZONE_FRONT'
  | 'ZONE_REAR'
  | 'ZONE_FRONT_LEFT'
  | 'ZONE_FRONT_RIGHT'
  | 'ZONE_REAR_LEFT'
  | 'ZONE_REAR_RIGHT'
  | 'ZONE_LEFT_SIDE'
  | 'ZONE_RIGHT_SIDE';

export type DamageType =
  | 'dent'
  | 'scratch'
  | 'crack'
  | 'rust'
  | 'paint_anomaly'
  | 'panel_misalignment'
  | 'broken_part'
  | 'damaged_bumper'
  | 'damaged_light';

export type Severity = 'minor' | 'moderate' | 'severe';

export type TrustBand =
  | 'HIGH_CONFIDENCE'
  | 'MODERATE_CONFIDENCE'
  | 'PROCEED_WITH_CAUTION'
  | 'INSUFFICIENT_EVIDENCE';

export type InspectionStatus =
  | 'DRAFT'
  | 'PENDING_UPLOAD'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'FAILED';

export type IQAStatus = 'PASS' | 'WARN' | 'FAIL';

export interface IQAResult {
  status: IQAStatus;
  blurScore: number;         // Variance of Laplacian
  isBlurry: boolean;
  brightnessMean: number;    // Mean V channel 0-255
  isPoorlyExposed: boolean;
  isVehicleDetected: boolean;
  isDuplicate: boolean;
  notes?: string[];
}

export interface VehicleInfo {
  make: string;
  model: string;
  variant?: string;
  year: number;
  fuelType: FuelType;
  transmission: Transmission;
  mileageKm: number;
  askingPrice: number;
  currency?: string;
  location?: string;
  vinOrReg?: string;
}

export interface UploadedImageSlot {
  angle: ImageAngle;
  isMandatory: boolean;
  label: string;
  description: string;
  file?: File;
  previewUrl?: string;
  iqaResult?: IQAResult;
  uploadedAt?: string;
}

export interface NormalizedBoundingBox {
  x: number; // 0.0 to 1.0
  y: number;
  w: number;
  h: number;
}

export interface DamageDetection {
  _id: string;
  imageAngle: ImageAngle;
  vehicleZone: VehicleZone;
  damageType: DamageType;
  component: string;
  severity: Severity;
  confidence: number;
  bbox: NormalizedBoundingBox;
  notes?: string;
}

export interface CrossViewObservation {
  vehicleZone: VehicleZone;
  zoneTitle: string;
  involvedViews: ImageAngle[];
  observedFinding: string;
  confidenceIndicator: 'HIGH' | 'MODERATE' | 'LOW';
  recommendedAction: string;
}

export interface PriceValuation {
  status: 'VALIDATED' | 'PENDING_DATASET_VALIDATION';
  datasetName?: string;
  fairRangeLow?: number;
  fairRangeHigh?: number;
  fairMedian?: number;
  askingPrice: number;
  priceDeltaPercentage?: number;
  valuationNote: string;
}

export interface ConditionScoreBreakdown {
  overallScore: number; // 0 - 100
  observableCosmeticScore: number;
  panelIntegrityScore: number;
  paintIntegrityScore: number;
  deductionSummary: Array<{
    finding: string;
    zone: VehicleZone;
    deduction: number;
  }>;
}

export interface EvidenceConfidenceBreakdown {
  visualCoverageIndex: number; // 0.0 to 1.0 (70% mandatory + 20% optional + 10% data)
  mandatoryAnglesSubmitted: number; // out of 4
  optionalAnglesSubmitted: number; // out of 8
  uninspectedBlindspots: string[];
  dataCompletenessRatio: number; // 0.0 to 1.0
}

export interface InspectionChecklistItem {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  zone: VehicleZone;
  item: string;
  rationale: string;
}

export interface CARWISEInspectionReport {
  id: string;
  isDemonstrationData: boolean;
  inspectionDate: string;
  vehicleInfo: VehicleInfo;
  status: InspectionStatus;
  
  // Dual Scores & Evidence Metrics
  conditionScore: ConditionScoreBreakdown;
  evidenceConfidence: EvidenceConfidenceBreakdown;
  trustScore: {
    overallTrustScore: number; // 0 - 100
    trustBand: TrustBand;
    confidenceSummary: string;
    limitations: string[];
  };

  // Analytical Findings
  detections: DamageDetection[];
  crossViewObservations: CrossViewObservation[];
  priceValuation: PriceValuation;
  prioritizedChecklist: InspectionChecklistItem[];
  finalRecommendation: {
    verdict: 'RECOMMENDED_FOR_INSPECTION' | 'PROCEED_WITH_CAUTION' | 'HIGH_RISK_AVOID';
    summaryHeading: string;
    summaryText: string;
  };
}
