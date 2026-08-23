# ═══════════════════════════════════════════════════════════════
# CARWISE — Computer Vision Damage Detection API Router
# Supports BaseDamageDetector / YOLO11s with IQA Gating
# ═══════════════════════════════════════════════════════════════

import base64
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel, Field

from app.ml.yolo_adapter import damage_detector
from app.ml.base_detector import DamageDetectionResult, DamageDetection, ModelMetadata

router = APIRouter()


class ImagePayload(BaseModel):
    imageId: Optional[str] = None
    viewType: str
    imageBase64: str = Field(..., description="Base64-encoded image binary")
    runIqaGate: bool = True


class BatchDamageRequest(BaseModel):
    inspectionId: Optional[str] = None
    images: List[ImagePayload]


class BatchDamageResponse(BaseModel):
    status: str = "COMPLETE"
    inspectionId: Optional[str] = None
    results: List[DamageDetectionResult]
    model: ModelMetadata = ModelMetadata()


@router.post("/detect", response_model=DamageDetectionResult)
async def detect_damage_file(
    file: UploadFile = File(...),
    viewType: Optional[str] = Form(None),
    imageId: Optional[str] = Form(None),
    runIqaGate: bool = Form(True),
):
    """
    Detects visible exterior damage on a single uploaded vehicle image.
    Executes Phase 6 IQA first; if image fails IQA, inference is blocked.
    """
    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded image is empty")

        result = damage_detector.detect(
            image_bytes=image_bytes,
            view_type=viewType,
            image_id=imageId,
            run_iqa_gate=runIqaGate,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Damage detection failed: {str(e)}")


@router.post("/batch-detect", response_model=BatchDamageResponse)
async def detect_damage_batch(request: BatchDamageRequest):
    """
    Batch evaluates all vehicle perspective images for an inspection.
    Processes each image through IQA gate -> BaseDamageDetector -> Standard Detection Schema.
    """
    if not request.images:
        raise HTTPException(status_code=400, detail="At least one image payload is required")

    results: List[DamageDetectionResult] = []

    for item in request.images:
        try:
            # Strip data URI prefix if present
            raw_b64 = item.imageBase64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]
            img_bytes = base64.b64decode(raw_b64)

            detection_res = damage_detector.detect(
                image_bytes=img_bytes,
                view_type=item.viewType,
                image_id=item.imageId,
                run_iqa_gate=item.runIqaGate,
            )
            results.append(detection_res)
        except Exception as err:
            results.append(
                DamageDetectionResult(
                    status="MODEL_ERROR",
                    imageId=item.imageId,
                    viewType=item.viewType,
                    detections=[],
                    iqa={"error": str(err)},
                )
            )

    return BatchDamageResponse(
        status="COMPLETE",
        inspectionId=request.inspectionId,
        results=results,
        model=damage_detector.model if hasattr(damage_detector, "model_meta") else ModelMetadata(),
    )
