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
        ↓  (JWT Bearer Auth + Multipart Images)
Node.js / Express API Gateway (Port 4000)
        ↓                     ↓
    MongoDB (27017)       Python FastAPI AI Service (Port 8000)
    (carwise_db)                ↓
        ↓             ┌────────────────────────────────────────┐
 StorageProvider      │ 1. Deterministic & ML IQA              │
(LocalStorageProvider)│ 2. Pluggable BaseDamageDetector        │
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

- **Mechanism:** Stateless JSON Web Tokens (JWT) signed with HMAC SHA-256 (`JWT_SECRET`).
- **Header:** `Authorization: Bearer <token>` on all protected API requests.
- **Strict Inspection Ownership Model:** Every vehicle inspection is strictly owned by `req.user._id`. Cross-user access, update, or deletion returns **`403 Forbidden`** (`code: 'FORBIDDEN'`).

---

## Image Ingestion & Storage Pipeline (Phase 5)

> ℹ️ *Note: Image quality analysis (IQA) and computer vision damage detection are not yet performed in Phase 5; images remain in `processingStatus: 'UPLOADED'` and `qualityStatus: 'PENDING'`.*

### 1. StorageProvider Abstraction
- Abstract interface: `StorageProvider` (`saveImage`, `getImageStream`, `deleteImage`, `exists`).
- Concrete implementation: `LocalStorageProvider` (`backend/src/storage/LocalStorageProvider.js`).
- Structured hierarchy: `uploads/inspections/<inspection-id>/<image-id>.<extension>`.
- Internal security: Relative keys with strict path traversal guards; raw upload paths are never exposed publicly.

### 2. File Security & Magic-Byte Validation
- Supported MIME types: `image/jpeg` (`.jpg`), `image/png` (`.png`), `image/webp` (`.webp`).
- Content inspection: Direct binary magic-byte inspection (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF...WEBP`). Rejects HTML, JS, SVG, executables, or corrupt files before saving to disk.
- Size limit: 20 MB per file.

### 3. Supported Vehicle Perspectives
- **Mandatory Views (4):** `FRONT`, `REAR`, `LEFT`, `RIGHT`.
- **Optional Views (8):** `FRONT_LEFT`, `FRONT_RIGHT`, `REAR_LEFT`, `REAR_RIGHT`, `INTERIOR`, `DASHBOARD`, `ENGINE_BAY`, `TYRES`.
- Arbitrary angles are rejected with `400 INVALID_VIEW_TYPE`.

### 4. Image Replacement & Orphan Cleanup
- When a user uploads a new photograph for an existing perspective, the previous storage file is automatically unlinked and purged from disk to prevent storage bloat.
- When an image is deleted via `DELETE /api/v1/inspections/:id/images/:imageId`, it is removed from MongoDB and storage simultaneously.

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
npm test            # Run 31 automated integration tests
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
| `UPLOAD_DIR` | Image upload storage directory | `./uploads` |
| `MAX_FILE_SIZE_MB` | Maximum allowed image size | `20` |
| `AI_SERVICE_URL` | Python AI service URL | `http://localhost:8000` |
| `CORS_ORIGIN` | Allowed client origin | `http://localhost:3000` |

---

## Project Structure
```
CARWISE/
├── frontend/               # Next.js (App Router, TypeScript, AuthContext)
├── backend/                # Node.js / Express API Gateway & Auth
│   ├── src/
│   │   ├── config/         # MongoDB connection
│   │   ├── controllers/    # auth.controller, inspection.controller, image.controller
│   │   ├── middleware/     # auth, upload (Multer memoryStorage), validate, errorHandler
│   │   ├── models/         # User, Inspection
│   │   ├── routes/         # auth.routes, inspection.routes
│   │   ├── storage/        # StorageProvider, LocalStorageProvider
│   │   └── utils/          # imageValidator (magic bytes & dimensions)
│   └── tests/              # 31 Automated integration tests
├── ai-service/             # Python FastAPI Microservice & ML Pipelines
├── docs/                   # System Architecture & Technical Specifications
└── README.md
```
