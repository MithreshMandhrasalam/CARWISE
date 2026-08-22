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
        ↓  (JWT Bearer Auth)
Node.js / Express API Gateway (Port 4000)
        ↓                     ↓
    MongoDB (27017)       Python FastAPI AI Service (Port 8000)
    (carwise_db)                ↓
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

## Authentication & Authorization Architecture (Phase 4)

### 1. Token & Session Strategy
- **Mechanism:** Stateless JSON Web Tokens (JWT) signed with HMAC SHA-256 (`JWT_SECRET`).
- **Header:** Sent as `Authorization: Bearer <token>` on all protected API requests.
- **Client Storage:** Managed by React `AuthContext` and stored in `localStorage` (`carwise_token`, `carwise_user`).
- **Token Lifecycle:** 7-day standard expiration (`JWT_EXPIRES_IN=7d`), automatically validated on initial load against `GET /api/v1/auth/me`.

### 2. Strict Inspection Ownership Model
- **User-Bound Creation:** Every vehicle inspection created via `POST /api/v1/inspections` is automatically assigned to `req.user._id`.
- **Scoped Lists:** `GET /api/v1/inspections` strictly filters documents to `{ userId: req.user._id, isDeleted: false }`.
- **403 Forbidden Enforcement:** Accessing, updating, or deleting an inspection that belongs to another user returns `403 Forbidden` (`code: 'FORBIDDEN'`).
- **Route Protection:** Frontend routes (`/dashboard`, `/inspect`, `/history`, `/inspect/[id]`) automatically verify active session and redirect unauthenticated visitors to `/auth/login?redirect=...`.

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
npm test            # Run automated 18-case test suite
npm run dev         # Starts API gateway on http://localhost:4000
```

### 2. AI Service (Python/FastAPI)
```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install fastapi uvicorn pydantic pydantic-settings python-multipart

# Mock / Dev mode:
AI_SERVICE_USE_MOCK=true uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev         # Starts Next.js app on http://localhost:3000
```

---

## Environment Variables

### `backend/.env`
| Variable | Description | Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/carwise_db` |
| `JWT_SECRET` | JWT signing secret | *(change in production)* |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `AI_SERVICE_URL` | Python AI service URL | `http://localhost:8000` |
| `UPLOAD_DIR` | Image upload directory | `./uploads` |
| `CORS_ORIGIN` | Allowed client origin | `http://localhost:3000` |

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
├── frontend/               # Next.js (App Router, TypeScript, AuthContext)
├── backend/                # Node.js / Express API Gateway & Auth
│   ├── src/
│   │   ├── config/         # MongoDB connection
│   │   ├── controllers/    # auth.controller, inspection.controller
│   │   ├── middleware/     # auth, validate, errorHandler
│   │   ├── models/         # User, Inspection
│   │   └── routes/         # auth.routes, inspection.routes
│   └── tests/              # Automated integration test suite
├── ai-service/             # Python FastAPI Microservice & ML Pipelines
├── docs/                   # System Architecture & Technical Specifications
└── README.md
```
