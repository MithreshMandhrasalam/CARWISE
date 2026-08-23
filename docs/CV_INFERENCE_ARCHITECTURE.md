# CARWISE — Computer Vision Inference Architecture (Phase 7C)

> **Document Type:** Production Inference Architecture Specification  
> **Subsystem:** Computer Vision Damage Detection & IQA Gating Subsystem  
> **Baseline Benchmark:** CarDD (IEEE T-ITS 2023) — YOLO11s Baseline v1  
> **Target Environment:** Python FastAPI Microservice + Node.js API Gateway + Next.js Client  
> **Review Date:** August 2026  

---

## 1. End-to-End IQA $\to$ CV Damage Detection Pipeline

```
Uploaded Perspective Photograph (JPEG / PNG / WebP)
                      ↓
[ Phase 6: Deterministic Image Quality Assessment (IQA) ]
   ├── Variance of Laplacian (Blur Threshold: σ² < 80)
   ├── Mean Grayscale Luminance (Exposure: μ < 45 or μ > 215)
   ├── RMS Contrast (Standard Deviation: σ < 30)
   └── 64-bit dHash (Perceptual Duplicate Detection: dist ≤ 4)
                      ↓
       ┌──────────────┴──────────────┐
       ▼                             ▼
  [ IQA = FAIL ]              [ IQA = PASS / WARN ]
       │                             │
       │ (Quality standards not met) │ (Proceed to CV Inference)
       ▼                             ▼
  Return BLOCKED_BY_IQA       [ BaseDamageDetector Strategy ]
  (Zero False Detections)            │
                                     ▼
                              [ YOLODamageDetector Adapter ]
                                     ├── Preprocess & Normalize
                                     ├── Forward Pass (Apple Silicon MPS / CPU)
                                     ├── Filter Confidence (c ≥ 0.40)
                                     └── Coordinate Scaling (BBox [0.0, 1.0])
                                     │
                                     ▼
                              [ Confidence Banding & Tagging ]
                               ├── c ≥ 0.55 ──────► HIGH_CONFIDENCE
                               ├── 0.40 ≤ c < 0.55 ► POTENTIAL (Physical check advised)
                               └── c < 0.40 ──────► SUPPRESSED (Filtered as noise)
                                     │
                                     ▼
                              [ MongoDB Persistence & UI Rendering ]
                               ├── Store in inspection.damageDetections
                               └── Client-side SVG Bounding Box Overlay
```

---

## 2. Pluggable Detector Architecture (`BaseDamageDetector`)

Downstream scoring, zone-mapping, and recommendation modules depend **exclusively** on the abstract `BaseDamageDetector` interface, completely decoupled from Ultralytics, PyTorch, or YOLO internals.

```python
class BaseDamageDetector(ABC):
    @abstractmethod
    def detect(
        self,
        image_bytes: bytes,
        view_type: Optional[str] = None,
        image_id: Optional[str] = None,
        run_iqa_gate: bool = True,
    ) -> DamageDetectionResult:
        pass
```

### Supported Concrete Adapters:
- **`YOLODamageDetector`**: Production/Baseline adapter executing YOLO11s on Apple Silicon MPS or CPU.
- **`MockDamageDetector`**: Deterministic test fixture adapter for decoupled CI/CD unit testing.

---

## 3. Standardized Output Schema

```json
{
  "status": "COMPLETE",
  "imageId": "img-front-001",
  "viewType": "FRONT",
  "detections": [
    {
      "className": "scratch",
      "classId": 0,
      "confidence": 0.78,
      "confidenceBand": "HIGH_CONFIDENCE",
      "bbox": {
        "xMin": 0.22,
        "yMin": 0.45,
        "xMax": 0.48,
        "yMax": 0.56
      },
      "qualityWarning": false
    }
  ],
  "iqa": {
    "qualityStatus": "PASS",
    "qualityScore": 88,
    "qualityWarning": false,
    "blurScore": 342.18,
    "brightnessMean": 136.45
  },
  "model": {
    "name": "YOLO11s",
    "provider": "Ultralytics",
    "version": "1.0.0",
    "weightsVersion": "cardd-baseline-v1",
    "dataset": "CarDD",
    "inferenceTimeMs": 7.4
  },
  "analyzedAt": "2026-08-22T18:00:00.000Z"
}
```

---

## 4. Confidence Thresholding & UI Evidence Language

| Confidence Range | Internal Tag | UI Display Badge | Mandatory User-Facing Language |
| :--- | :--- | :--- | :--- |
| **$c \ge 0.55$** | `HIGH_CONFIDENCE` | Emerald Solid Box | *"High-confidence model detection"* |
| **$0.40 \le c < 0.55$** | `POTENTIAL` | Amber Dashed Box | *"Potential model detection — physical verification recommended"* |
| **$c < 0.40$** | `SUPPRESSED` | *(Not rendered)* | Filtered out as background noise / specular highlight |

> ⚠️ **Academic Rule:** The system never refers to high-confidence detections as "Confirmed damage", "Previous accident", or "Structural failure" because single 2D bounding boxes are localized evidence indicators, not mechanical proof.

---

## 5. Model Versioning & Weights Governance

- **Model Identifier:** `CARWISE Damage Detector — CarDD Baseline v1`
- **Architecture:** Ultralytics YOLO11s (v8.4.126)
- **Environment Variable Controls:**
  - `DAMAGE_MODEL_PROVIDER=yolo11`
  - `DAMAGE_MODEL_PATH=app/ml/weights/yolo11s_cardd_best.pt`
  - `DAMAGE_CONFIDENCE_THRESHOLD=0.40`
  - `DAMAGE_HIGH_CONFIDENCE_THRESHOLD=0.55`
- **Weight Checkpoint Security:** Weight files (`*.pt`, `*.onnx`, `*.engine`) are strictly ignored via `.gitignore` and never checked into source control.

---

## 6. Error & Failure Handling Matrix

| Failure Mode | API / Microservice Behavior | Client Response |
| :--- | :--- | :--- |
| **Corrupt Image / Magic-Byte Mismatch** | Caught at Express upload boundary (Phase 5) | `400 INVALID_IMAGE` |
| **Image Fails IQA (Severe Blur / Darkness)** | IQA gate triggers before CV detector | Returns `status: "BLOCKED_BY_IQA"`, zero detections |
| **Image Has Sub-Optimal Quality (IQA WARN)** | CV detector runs; `qualityWarning: true` attached | Rendered with amber `IQA Warn` tag |
| **Weights Missing / AI Service Offline** | Express API Gateway falls back to local deterministic engine | Returns valid structured detection with `fallback: true` |
| **Cross-User Access Attempt** | Express middleware verifies JWT ownership | `403 FORBIDDEN` |

---

## 7. Known Scientific Limitations

1. **Benchmark Provenance:** The current detector is trained on the global/Asian **CarDD** dataset. It has not yet undergone domain-adaptation for Indian vehicle models (e.g. Maruti Swift, Tata Nexon) or tropical road grime.
2. **Severity Separation:** Damage severity (Minor, Moderate, Severe) and repair cost estimation are not evaluated in this phase; they belong to downstream deterministic reasoning.
3. **Multi-View Independence:** Detections across different angles represent independent observations without 3D reconstruction claims.
