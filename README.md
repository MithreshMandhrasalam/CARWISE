# AutoTrust AI
### AI-Powered Used Car Inspection & Trust Platform
*Final Year CSE Project — Software Only*

---

## Project Overview
AutoTrust AI helps used-car buyers evaluate a vehicle **before purchasing** using:
- **Computer Vision** — detect dents, scratches, rust, paint anomalies, tyre issues
- **Price ML** — estimate fair market price range vs asking price
- **Explainable Scoring** — 0–100 condition score with sub-component breakdown
- **Trust Assessment** — RECOMMENDED / CONSIDER & INSPECT / PROCEED WITH CAUTION / AVOID

> ⚠️ This is an AI decision-support tool. It does **not** replace professional mechanical inspection.

---

## Architecture

```
Next.js Frontend (3000)
        ↓
Node.js / Express API (4000)
        ↓           ↓
    MongoDB      Python FastAPI AI Service (8000)
                      ↓         ↓         ↓
               YOLO CV     XGBoost    Rule-based
               Damage      Price Est.  Scoring
```

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

# For mock-only mode (no ML libraries needed):
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

### Docker (all services)
```bash
docker-compose up --build
```

---

## Environment Variables

### backend/.env
| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/autotrust_ai` |
| `JWT_SECRET` | JWT signing secret | *(change in production)* |
| `AI_SERVICE_URL` | Python AI service URL | `http://localhost:8000` |
| `UPLOAD_DIR` | Image upload directory | `./uploads` |

### ai-service/.env
| Variable | Description | Default |
|----------|-------------|---------|
| `AI_SERVICE_USE_MOCK` | Use mock AI (dev mode) | `true` |
| `DAMAGE_MODEL_WEIGHTS` | Path to YOLOv8 weights | `app/ml/weights/damage_yolov8.pt` |
| `PRICE_MODEL_WEIGHTS` | Path to XGBoost model | `app/ml/weights/price_xgboost.json` |

---

## API Reference

### Node.js API (port 4000)
```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me

GET  /api/v1/inspections
POST /api/v1/inspections
GET  /api/v1/inspections/:id
DELETE /api/v1/inspections/:id
POST /api/v1/inspections/:id/images
POST /api/v1/inspections/:id/analyze
```

### Python AI Service (port 8000)
```
POST /api/v1/ai/damage/detect
POST /api/v1/ai/price/estimate
POST /api/v1/ai/score/compute
POST /api/v1/ai/score/assessment/generate
GET  /health
GET  /docs   ← Swagger UI
```

---

## AI Modules

| Module | Status | Real or Mock? | Notes |
|--------|--------|---------------|-------|
| Damage Detection | Phase 2 | 🟡 Mock (clearly labelled) | Replace with YOLOv8 in Phase 3 |
| Price Estimation | Phase 2 | 🟡 Mock (clearly labelled) | Replace with XGBoost in Phase 4 |
| Condition Scoring | Live | ✅ Real (rule-based) | Weighted formula, always deterministic |
| Final Assessment | Live | ✅ Real (rule-based) | Decision tree, always deterministic |

---

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Scaffolding & Setup | ✅ Done |
| 1 | Core UI & Auth | ✅ Done |
| 2 | Mock AI Pipeline | ✅ Done |
| 3 | Real YOLOv8 Damage Detection | 🔲 Next |
| 4 | Real XGBoost Price Model | 🔲 Next |
| 5 | Polish & Hardening | 🔲 Future |
| 6 | Evaluation & Demo Prep | 🔲 Future |

---

## Replacing Mock Models (Phase 3 & 4)

### Damage Detection
1. Download the [CarDD dataset](https://github.com/CarDD-USTC/CarDD) or a Roboflow car damage dataset in YOLO format
2. Fine-tune: `yolo detect train model=yolov8n.pt data=damage.yaml epochs=50`
3. Export: `yolo export model=runs/detect/train/weights/best.pt format=onnx`
4. Copy `best.onnx` to `ai-service/app/ml/weights/damage_yolov8.pt`
5. Implement `ai-service/app/ml/damage_detector.py` with `detect_damage_real(images)`
6. Set `AI_SERVICE_USE_MOCK=false` in `ai-service/.env`

### Price Estimation
1. Download a Kaggle India used-car dataset
2. Train XGBoost in `notebooks/train_price_model.ipynb`
3. Save model: `model.save_model("price_xgboost.json")`
4. Copy to `ai-service/app/ml/weights/`
5. Implement `ai-service/app/ml/price_model.py` with `estimate_price_real(vehicle_info)`
6. Set `AI_SERVICE_USE_MOCK=false`

---

## Project Structure
```
autotrust-ai/
├── frontend/          # Next.js 14 (App Router)
├── backend/           # Node.js / Express API
├── ai-service/        # Python FastAPI + ML models
├── docker-compose.yml
└── README.md
```

---

## Academic Notes
- Condition scoring uses a **transparent, auditable weighted formula** (not a black box)
- All mock modules are clearly labelled `isMock: true` in API responses and the UI
- Model cards and training notebooks should be maintained in `docs/` and `notebooks/`
- See `ai-service/app/ml/mock/README.md` for the mock-to-real replacement guide
