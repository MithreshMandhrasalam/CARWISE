# Mock AI Layer — Developer Reference

## Purpose
This directory contains **clearly marked placeholder implementations** for the AI modules that are not yet trained or integrated.

Every mock module:
- Returns `isMock: true` in its output
- Uses deterministic logic (seeded randomness) for consistent UI testing
- Is **never** presented to the user as a real AI prediction
- Is switchable via the `AI_SERVICE_USE_MOCK=true/false` environment variable

## Active Mock Modules

| File | Replaces | Status |
|------|----------|--------|
| `mock_damage.py` | YOLOv8 damage detection | ✅ Active (Phase 2) |
| `mock_price.py` | XGBoost price estimator | ✅ Active (Phase 2) |

## Real Modules (to be created)

| File to create | Phase | Notes |
|----------------|-------|-------|
| `../damage_detector.py` | Phase 3 | Fine-tuned YOLOv8 on CarDD dataset |
| `../price_model.py` | Phase 4 | XGBoost trained on Kaggle India used-car data |

## How to Switch to Real Models

1. Train your model and save weights to `app/ml/weights/`
2. Implement the real module (e.g. `app/ml/damage_detector.py`) with a `detect_damage_real(images)` function
3. Set `AI_SERVICE_USE_MOCK=false` in `ai-service/.env`
4. Restart the AI service

## Condition Score and Assessment
`score_service.py` and `assessment_service.py` are **always real** — they use deterministic rule-based logic and are never mocked. `isMock: false` is hard-coded in their output.
