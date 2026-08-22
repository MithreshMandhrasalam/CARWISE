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
- **Deterministic & ML Image Quality Assessment (IQA)** — filter out blurry, improperly exposed, and duplicate images before processing
- **Pluggable Computer Vision Damage Detection** — identify cosmetic flaws (dents, scratches, rust, cracks, misalignments) via swappable model adapters
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
        ↓
Node.js / Express API Gateway (Port 4000)
        ↓                     ↓
    MongoDB (27017)       Python FastAPI AI Service (Port 8000)
                                ↓
                      ┌────────────────────────────────────────┐
                      │ 1. Deterministic & ML IQA              │
                      │ 2. Pluggable BaseDamageDetector        │
                      │ 3. Cross-View Vehicle-Zone Reasoner    │
                      │ 4. Evidence Completeness Evaluator     │
                      │ 5. Gated Price Valuation Module        │
                      │ 6. Dual Scoring (Condition & Trust)    │
                      │ 7. ML Evaluation & Experiment Registry │
                      └────────────────────────────────────────┘
```

Detailed technical specifications and design artifacts are located in [`docs/REFINED_ARCHITECTURE.md`](file:///Users/mithresh/Desktop/autotrust-ai/docs/REFINED_ARCHITECTURE.md).

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
# Ensure MongoDB is running on localhost:27017
npm run dev
# API available at http://localhost:4000
```

### 2. AI Service (Python/FastAPI)
```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install fastapi uvicorn pydantic pydantic-settings python-multipart

# Mock / Dev mode:
AI_SERVICE_USE_MOCK=true uvicorn app.main:app --reload --port 8000

# Full install with ML libraries:
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API docs at http://localhost:8000/docs
```

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
# App at http://localhost:3000
```

### Docker (All Services)
```bash
docker-compose up --build
```

---

## Environment Variables

### `backend/.env`
| Variable | Description | Default |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/carwise_db` |
| `JWT_SECRET` | JWT signing secret | *(change in production)* |
| `AI_SERVICE_URL` | Python AI service URL | `http://localhost:8000` |
| `UPLOAD_DIR` | Image upload directory | `./uploads` |

### `ai-service/.env`
| Variable | Description | Default |
|---|---|---|
| `AI_SERVICE_USE_MOCK` | Use mock AI adapters (dev mode) | `true` |
| `DAMAGE_MODEL_WEIGHTS` | Path to damage detection weights | `app/ml/weights/damage_weights.pt` |
| `PRICE_MODEL_WEIGHTS` | Path to verified price model | `app/ml/weights/price_model.json` |

---

## System Boundaries & Academic Defensibility

| Analytical Layer | Component Type | Implementation & Examples |
|---|---|---|
| **Layer 1: AI/ML Models** | Statistical Inference | Damage Object Detection, Severity Classifier, Gated Price Regressor |
| **Layer 2: Deterministic Rule Engines** | Hard Logic & Validation | 4-Mandatory View Check, Laplacian Blur Filter, pHash Duplicates, Zone Mapper |
| **Layer 3: Scoring Formulas** | Mathematical Aggregation | Condition Score ($S_{condition}$), Evidence Confidence ($C_{evidence}$), Assessment Trust Score ($S_{trust}$) |
| **Layer 4: Domain Heuristics** | Empirical Baselines | Panel criticality weights, standard repair cost reference brackets |

---

## Project Structure
```
CARWISE/
├── frontend/               # Next.js 14 (App Router, TypeScript)
├── backend/                # Node.js / Express API Gateway & Auth
├── ai-service/             # Python FastAPI Microservice & ML Pipelines
├── docs/                   # System Architecture & Technical Specifications
│   └── REFINED_ARCHITECTURE.md
├── docker-compose.yml
└── README.md
```
