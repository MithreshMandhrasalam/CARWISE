from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import damage_detection, price_estimation, condition_score

app = FastAPI(
    title="AutoTrust AI Service",
    description="Computer vision and ML backend for vehicle inspection analysis.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — only accept from Node.js backend in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ── API Routers ───────────────────────────────────────────────────────────────
app.include_router(damage_detection.router, prefix="/api/v1/ai/damage", tags=["Damage Detection"])
app.include_router(price_estimation.router, prefix="/api/v1/ai/price", tags=["Price Estimation"])
app.include_router(condition_score.router, prefix="/api/v1/ai/score", tags=["Condition Score"])


@app.get("/health")
async def health():
    return {
        "service": "AutoTrust AI Service",
        "version": "1.0.0",
        "mockMode": settings.ai_service_use_mock,
        "models": {
            "damage": settings.damage_model_version,
            "price": settings.price_model_version,
            "score": settings.score_model_version,
        },
    }
