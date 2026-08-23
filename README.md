# CARWISE
### Car Assessment & Risk With Intelligent Safety & Evidence
> *"See the Evidence. Know the Risk. Buy Wiser."*

*Final Year CSE Project — Software Only*

---

## Project Overview

**CARWISE** is a software-only, AI-powered used-vehicle assessment and buyer decision-support platform.

### Core Purpose
Help used-car buyers make safer and more informed purchasing decisions by analyzing available vehicle evidence, identifying visible abnormalities, estimating condition and price-related risk, and generating prioritized inspection recommendations.

Key capabilities include:
- **User Authentication & Inspection Ownership** — strict user-bound inspection lifecycle with JWT sessions and 403 Forbidden cross-user access prevention
- **Production Image Ingestion & Storage Pipeline** — memory buffer magic-byte validation (JPEG, PNG, WebP), pluggable `StorageProvider` abstraction, replacement auto-cleanup, and server-side mandatory view completeness
- **Deterministic Image Quality Assessment (IQA)** — mathematical signal processing for blur (Variance of Laplacian), luminance exposure, RMS contrast, resolution, and 64-bit dHash duplicate detection
- **Pluggable Computer Vision Damage Detection (BaseDamageDetector)** — decoupled Strategy pattern architecture executing YOLO11s (CarDD Baseline v1) with deterministic IQA gating and normalized bounding boxes
- **Cross-View Vehicle-Zone Reasoning** — map multi-angle visual abnormalities to logical vehicle zones (e.g. `ZONE_FRONT_RIGHT`) without claiming 3D reconstruction
- **Dual Scoring Architecture**:
  - **Vehicle Condition Score ($S_{condition} \in [0, 100]$)** — evaluates physical cosmetic integrity strictly from observable evidence
  - **Buyer Evidence Confidence / Assessment Trust Score ($S_{trust} \in [0, 100]$)** — evaluates buyer confidence considering evidence completeness, image clarity, model confidence, and price alignment
- **Gated Price Valuation** — estimate fair-market price range based strictly on validated regional datasets (or explicit pending validation status)
- **Traceable Decision Support** — actionable, prioritized inspection recommendations with full academic traceability

> ⚠️ **Disclaimer:** CARWISE is an AI-assisted decision-support platform. It is designed to complement, not replace, a comprehensive hands-on mechanical inspection.

---

## Architecture Overview

```
Next.js Frontend (Port 3000)
        ↓  (JWT Bearer Auth + Multipart Images)
Node.js / Express API Gateway (Port 4000)
        ↓                     ↓
    MongoDB (27017)       Python FastAPI AI Service (Port 8000)
    (carwise_db)                ↓
        ↓             ┌────────────────────────────────────────┐
 StorageProvider      │ 1. Deterministic IQA Engine            │
(LocalStorageProvider)│ 2. BaseDamageDetector (YOLO11s)        │
                      │ 3. Cross-View Vehicle-Zone Reasoner    │
                      │ 4. Evidence Completeness Evaluator     │
                      │ 5. Gated Price Valuation Module        │
                      │ 6. Dual Scoring (Condition & Trust)    │
                      │ 7. ML Evaluation & Experiment Registry │
                      └────────────────────────────────────────┘
```

Detailed technical specifications and design artifacts are located in:
- [`docs/REFINED_ARCHITECTURE.md`](file:///Users/mithresh/Desktop/autotrust-ai/docs/REFINED_ARCHITECTURE.md)
- [`docs/CV_DATASET_AUDIT.md`](file:///Users/mithresh/Desktop/autotrust-ai/docs/CV_DATASET_AUDIT.md)
- [`docs/CV_BASELINE_EXPERIMENT.md`](file:///Users/mithresh/Desktop/autotrust-ai/docs/CV_BASELINE_EXPERIMENT.md)
- [`docs/CV_INFERENCE_ARCHITECTURE.md`](file:///Users/mithresh/Desktop/autotrust-ai/docs/CV_INFERENCE_ARCHITECTURE.md)

---

## Computer Vision & Damage Detection Pipeline (Phases 6 & 7)

```
Uploaded Perspective Image
            ↓
[ 1. Image Quality Assessment (IQA) ] ── (FAIL) ──────► BLOCKED_BY_IQA (Zero false detections)
            ↓ (PASS / WARN)
[ 2. BaseDamageDetector Interface ]
            ↓
[ 3. YOLODamageDetector Adapter (YOLO11s) ]
   ├── Input: RGB Tensor (640x640) on Apple Silicon MPS / CPU
   ├── 6 Supported Classes: scratch, dent, crack, glass_shatter, lamp_broken, tire_flat
   ├── Normalized BBoxes: [xMin, yMin, xMax, yMax] in [0.0, 1.0]
   └── Confidence Filtering:
       ├── c ≥ 0.55 ──────► HIGH_CONFIDENCE ("High-confidence model detection")
       ├── 0.40 ≤ c < 0.55 ► POTENTIAL ("Potential model detection — physical verification advised")
       └── c < 0.40 ──────► SUPPRESSED (Filtered out as noise)
            ↓
[ 4. MongoDB Persistence & Client-Side SVG Overlay ]
```

### Computer Vision API Endpoints
- `POST /api/v1/damage/detect` — Single photo evaluation with IQA gating (FastAPI).
- `POST /api/v1/damage/batch-detect` — Multi-photo batch evaluation with IQA gating (FastAPI).
- `POST /api/v1/inspections/:id/damage/detect` — Evaluates stored inspection photos and persists results to MongoDB (Node.js API Gateway).
- `GET /api/v1/inspections/:id/damage` — Retrieves persisted localized damage findings (Node.js API Gateway).

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB 7.0 running locally (or Docker)

### 1. Backend (Node.js/Express)
```bash
cd backend
npm install
npm test            # Run automated integration tests
npm run dev         # Starts API gateway on http://localhost:4000
```

### 2. AI Service (Python/FastAPI)
```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt pytest
pytest tests/ -v                  # Run 15 unit tests (IQA + Damage Detection)
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev         # Starts Next.js app on http://localhost:3000
```
