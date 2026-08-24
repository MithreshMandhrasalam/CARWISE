# CARWISE — Complete Final System Architecture & Orchestration Specification (Phase 12)

> **Document Version:** 1.0.0 (Production Master)
> **Assessment Snapshot Version:** `CARWISE_ASSESSMENT_V1`
> **Status:** Fully Integrated, Hardened, and Verified

---

## 1. System Overview

**CARWISE** (Car Assessment & Risk With Intelligent Safety & Evidence) is an end-to-end AI-powered used-car inspection, damage detection, evidence reasoning, repair cost estimation, and fair-market valuation platform.

The system is designed with a strict **deterministic decision-support architecture**:
- Computer vision observations are treated as **observable 2D surface evidence**, not ground truth.
- High-confidence conclusions are gated behind photographic coverage, resolution, and quality metrics.
- Upstream data deficiencies (e.g. blur, glare, missing perspective views) deterministically propagate as confidence caps and disclaimers to prevent misleading downstream buyer recommendations.

---

## 2. End-to-End Pipeline Dependency Flow

```
[ Step 1: Vehicle Information & Image Upload ]
                        │
                        ▼
[ Step 2: Deterministic Image Quality Assessment (IQA_V1) ]
  ├── Laplacian Blur Variance (≥ 100)
  ├── Brightness Mean (40 – 220) & Contrast RMS (≥ 30)
  ├── Glare & Shadow Ratio Limits
  └── 64-bit dHash Duplicate Image Rejection
                        │
                        ├── [ Quality Status = FAIL ] ──► [ Block CV Inference / Warning Flag ]
                        ▼
[ Step 3: YOLO11s Computer Vision Damage Detection (CV_BASELINE_V1) ]
  ├── PyTorch / Ultralytics YOLO11s Model (CarDD Fine-Tuned)
  ├── 6 Damage Classes: Scratch, Dent, Crack, Glass Shatter, Lamp Broken, Flat Tire
  └── Confidence Banding: High Confidence (≥ 0.70) vs Potential (0.45 – 0.70)
                        │
                        ▼
[ Step 4: Evidence Reasoning & Deduplication (EVIDENCE_V1) ]
  ├── Bounding Box Geometry & Validation
  ├── Canonical Zone Mapping (10 Vehicle Zones)
  ├── Spatial IoU Deduplication (Cross-View Duplicate Suppression)
  └── Vehicle Condition Score V1 Calculation (CONDITION_V1, 0 – 100)
                        │
                        ▼
[ Step 5: Evidence Completeness & Buyer Assessment Trust (TRUST_V1) ]
  ├── Mandatory Views Coverage (Front, Rear, Left, Right)
  ├── Blindspot Diagnostics (Uninspected Angles)
  ├── Model Confidence Aggregation & Cross-View Consistency
  └── Buyer Assessment Trust Score V1 (0 – 100) + Banding (HIGH / MODERATE / CAUTION / INSUFFICIENT)
                        │
                        ▼
[ Step 6: Repair Cost Estimation Engine (REPAIR_V1) ]
  ├── Damage Class & Severity -> Repair Action Mapping
  ├── Academic Baseline INR Ranges (Tier-2 Calibrated)
  ├── Vehicle Segment & Metro/Tier Multipliers
  └── Synergy Repair Discounts (10% for 2 items, 15% for 3+ items)
                        │
                        ▼
[ Step 7: Fair-Market Valuation & Asking-Price Assessment (VALUATION_V1) ]
  ├── Reference Ex-Showroom Baseline Lookup
  ├── Age Depreciation Schedule (0 – 8+ Years)
  ├── Mileage Usage Delta (Benchmark 12,000 km/year)
  ├── Physical Condition Score Delta (Benchmark 85.0/100)
  ├── Immediate Repair Cost Burden Deduction (-100% Median Repair)
  └── Asking-Price Comparison (BELOW_FAIR_RANGE | FAIRLY_PRICED | ABOVE_FAIR_RANGE)
                        │
                        ▼
[ Step 8: Consolidated Executive Buyer Assessment (CARWISE_ASSESSMENT_V1) ]
  └── Executive Verdict, 4-Quadrant Matrix, Version Audit, Latency Timings, & Disclaimers
```

---

## 3. Component Version Audit Matrix

| Pipeline Component | Version Identifier | Mathematical / Methodological Baseline |
| :--- | :--- | :--- |
| **Complete Snapshot** | `CARWISE_ASSESSMENT_V1` | Consolidated Immutable Assessment Container |
| **Image Quality** | `IQA_V1` | Laplacian Variance, Brightness/Contrast, dHash Duplicate Filter |
| **Damage Detection** | `CV_BASELINE_V1` | YOLO11s (CarDD Fine-Tuned, 6 classes, Dual-Threshold Banding) |
| **Evidence Reasoning** | `EVIDENCE_V1` | 10 Canonical Zones, Spatial IoU Deduplication, Cross-View Rules |
| **Condition Score** | `CONDITION_V1` | Deterministic Deductions Capped at 40 pts/zone, Base 100 |
| **Trust Score** | `TRUST_V1` | Completeness × Reliability × Confidence, Strict Mandatory Caps |
| **Repair Cost** | `REPAIR_V1` | Tier-2 Baseline INR Cost Catalog, Segment/Regional Scaling, Synergy Discounts |
| **Market Valuation** | `VALUATION_V1` | Age Depreciation, Mileage & Condition Deltas, Repair Burden Deduction |

---

## 4. API Endpoints

### 4.1 FastAPI Analytical Microservice (`ai-service`)
- `POST /api/v1/assessment/orchestrate` — Executes full analytical pipeline end-to-end.
- `POST /api/v1/iqa/assess-image` — Single-image IQA evaluation.
- `POST /api/v1/damage/detect` — YOLO11s damage detection.
- `POST /api/v1/evidence/analyze` — Evidence reasoning and condition scoring.
- `POST /api/v1/trust/analyze` — Buyer assessment trust and blindspots.
- `POST /api/v1/repair/estimate` — Repair cost estimation.
- `POST /api/v1/valuation/evaluate` — Fair market range and asking price analysis.

### 4.2 Node.js / Express Gateway & Persistence (`backend`)
- `POST /api/v1/inspections/:id/analyze` — Orchestrates full pipeline and updates MongoDB (`auth` required).
- `GET /api/v1/inspections/:id/assessment` — Retrieves consolidated buyer assessment report (`auth` required).
- `POST /api/v1/inspections` — Creates vehicle inspection record (`auth` required).
- `POST /api/v1/inspections/:id/images` — Uploads and stores perspective image with IQA validation (`auth` required).

---

## 5. Security Architecture & Multi-Tenant Isolation

1. **Authentication:** All inspection routes require a valid signed JWT bearer token.
2. **Ownership Isolation:** All database queries and mutation routes enforce `inspection.userId === req.user._id`; unauthorized cross-user access strictly returns `403 FORBIDDEN`.
3. **Input Sanitization & Path Traversal Prevention:** Image filenames are sanitized with UUIDv4; relative path traversal (`../`) is blocked at storage boundaries.
4. **Environment & Secret Hygiene:** Zero secrets or model weight binaries are checked into source control (`.env`, `*.pt`, `*.onnx` are gitignored).
5. **No Local Filesystem Path Leaks:** API error handlers strip stack traces in production and never expose internal server paths.

---

## 6. Academic Boundaries & Non-Claims

1. **Surface Flaw Limitation:** All findings represent observable 2D photographic evidence and require hands-on physical verification.
2. **Chassis & Frame Alignment:** Structural unibody integrity, underbody corrosion, and chassis alignment cannot be evaluated from standing-height photos.
3. **Powertrain Health:** Internal combustion engine mechanical condition, transmission synchros, and EV battery health cannot be diagnosed from photographs.
4. **Market Valuation Variation:** Valuation ranges reflect academic ex-showroom benchmarks and depreciation curves; actual private or dealership transactions vary based on city RTO taxes, transfer fees, and ownership count.
