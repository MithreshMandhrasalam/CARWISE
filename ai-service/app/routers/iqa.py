# ═══════════════════════════════════════════════════════════════
# CARWISE — FastAPI IQA Router
# ═══════════════════════════════════════════════════════════════

import base64
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from app.services.iqa_service import assess_single_image, assess_batch_images, IQAResult

router = APIRouter(prefix="/api/v1/iqa", tags=["Image Quality Assessment"])


class BatchImagePayload(BaseModel):
    imageId: str
    viewType: str
    imageBase64: str  # Base64 encoded image string


class BatchIQARequest(BaseModel):
    images: List[BatchImagePayload]


@router.post("/assess", response_model=IQAResult)
async def assess_image_endpoint(
    file: UploadFile = File(...),
    imageId: Optional[str] = Form(None),
    viewType: Optional[str] = Form(None),
):
    """
    Assesses a single vehicle image for sharpness, exposure, contrast, and resolution.
    """
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty image payload received.")

        result = assess_single_image(
            image_bytes=contents,
            image_id=imageId,
            view_type=viewType,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IQA assessment failed: {str(e)}")


@router.post("/batch-assess")
async def batch_assess_endpoint(payload: BatchIQARequest):
    """
    Assesses multiple vehicle images in a single request and checks for duplicate photographs.
    """
    try:
        parsed_images = []
        for img in payload.images:
            # Strip base64 data URL prefix if present
            raw_b64 = img.imageBase64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]

            image_bytes = base64.b64decode(raw_b64)
            parsed_images.append({
                "bytes": image_bytes,
                "imageId": img.imageId,
                "viewType": img.viewType,
            })

        batch_result = assess_batch_images(parsed_images)
        return batch_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch IQA assessment failed: {str(e)}")
