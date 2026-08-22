// ── Shared TypeScript Types for CARWISE ──────────────────────

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
export type Transmission = 'manual' | 'automatic' | 'amt';
export type InspectionStatus = 'pending' | 'processing' | 'complete' | 'failed';
export type DamageType =
  | 'dent' | 'scratch' | 'crack' | 'rust' | 'paint_anomaly'
  | 'broken_part' | 'damaged_bumper' | 'damaged_light' | 'damaged_panel' | 'tyre_abnormality';
export type Severity = 'minor' | 'moderate' | 'severe';
export type ImageAngle =
  | 'front' | 'rear' | 'left' | 'right'
  | 'front-left' | 'front-right' | 'rear-left' | 'rear-right'
  | 'interior' | 'dashboard' | 'engine'
  | 'tyre-fl' | 'tyre-fr' | 'tyre-rl' | 'tyre-rr';
export type PriceAssessment = 'underpriced' | 'fair' | 'slightly_overpriced' | 'significantly_overpriced';
export type ConditionRating = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';
export type Recommendation = 'RECOMMENDED' | 'CONSIDER_INSPECT' | 'PROCEED_CAUTION' | 'AVOID';
export type ChecklistPriority = 'high' | 'medium' | 'low';

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
}

export interface InspectionImage {
  _id: string;
  angle: ImageAngle;
  url: string;
  uploadedAt: string;
}

export interface Detection {
  _id: string;
  imageAngle: string;
  damageType: DamageType;
  component: string;
  severity: Severity;
  confidence: number;
  boundingBox: { x: number; y: number; w: number; h: number };
  notes?: string;
}

export interface DamageDetectionResult {
  modelVersion: string;
  isMock: boolean;
  detections: Detection[];
  repairIndicationFlag: boolean;
  repairIndicationNote?: string;
}

export interface PriceEstimationResult {
  modelVersion: string;
  isMock: boolean;
  estimatedRangeLow: number;
  estimatedRangeHigh: number;
  estimatedMid: number;
  askingPrice: number;
  priceDelta: number;
  priceAssessment: PriceAssessment;
  factors: string[];
}

export interface ConditionScoreResult {
  modelVersion: string;
  isMock: boolean;
  overallScore: number;
  subScores: {
    exteriorCondition: number;
    interiorCondition: number;
    visibleDamage: number;
    tyreCondition: number;
    vehicleAge: number;
    mileageFactor: number;
    maintenanceEvidence: number;
    priceFairness: number;
  };
  scoreExplanation: string[];
}

export interface ChecklistItem {
  _id: string;
  priority: ChecklistPriority;
  area: string;
  reason: string;
}

export interface FinalAssessment {
  trustScore: number;
  conditionRating: ConditionRating;
  riskLevel: RiskLevel;
  majorFindings: string[];
  recommendation: Recommendation;
  recommendationText: string;
  disclaimer: string;
}

export interface AIResults {
  damageDetection?: DamageDetectionResult;
  priceEstimation?: PriceEstimationResult;
  conditionScore?: ConditionScoreResult;
  inspectionChecklist?: ChecklistItem[];
  finalAssessment?: FinalAssessment;
}

export interface Inspection {
  _id: string;
  userId: string;
  status: InspectionStatus;
  createdAt: string;
  completedAt?: string;
  vehicleInfo: VehicleInfo;
  images: InspectionImage[];
  aiResults?: AIResults;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
