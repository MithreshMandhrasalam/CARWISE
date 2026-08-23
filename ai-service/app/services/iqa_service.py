# ═══════════════════════════════════════════════════════════════
# CARWISE — Deterministic Image Quality Assessment (IQA) Engine
# Mathematical and signal-processing verification pipeline
# ═══════════════════════════════════════════════════════════════

import io
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class QualityMetrics(BaseModel):
    blurScore: float
    brightnessMean: float
    contrastScore: float
    glareRatio: float
    shadowRatio: float
    width: int
    height: int
    pHash: str
    isDuplicate: bool = False


class IQAResult(BaseModel):
    imageId: Optional[str] = None
    viewType: Optional[str] = None
    qualityScore: int
    qualityStatus: str  # PASS | WARN | FAIL
    readyForCV: bool
    warnings: List[str]
    metrics: QualityMetrics


def compute_dhash(image_gray_np: np.ndarray, hash_size: int = 8) -> str:
    """
    Computes a 64-bit difference gradient hash (dHash) for duplicate detection.
    Fast, scale-invariant, and rotation-tolerant.
    """
    resized = cv2.resize(image_gray_np, (hash_size + 1, hash_size), interpolation=cv2.INTER_AREA)
    diff = resized[:, 1:] > resized[:, :-1]
    # Convert bool array to 64-bit hex string
    bit_string = "".join(["1" if b else "0" for b in diff.flatten()])
    hex_str = f"{int(bit_string, 2):016x}"
    return hex_str


def hamming_distance(hash1: str, hash2: str) -> int:
    """Calculates the number of differing bits between two 64-bit hex hashes."""
    try:
        n1 = int(hash1, 16)
        n2 = int(hash2, 16)
        return bin(n1 ^ n2).count("1")
    except Exception:
        return 64


def assess_single_image(
    image_bytes: bytes,
    image_id: Optional[str] = None,
    view_type: Optional[str] = None,
    existing_hashes: Optional[List[str]] = None,
) -> IQAResult:
    """
    Executes the deterministic IQA pipeline on raw image binary data.
    """
    warnings: List[str] = []

    # 1. Integrity Check
    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        pil_img.verify()
        # Re-open after verify() as PIL verify alters file pointer
        pil_img = Image.open(io.BytesIO(image_bytes))
        rgb_img = np.array(pil_img.convert("RGB"))
        height, width, _ = rgb_img.shape
    except Exception as e:
        return IQAResult(
            imageId=image_id,
            viewType=view_type,
            qualityScore=0,
            qualityStatus="FAIL",
            readyForCV=False,
            warnings=[f"Image integrity failure: corrupt or unreadable image file ({str(e)})."],
            metrics=QualityMetrics(
                blurScore=0.0,
                brightnessMean=0.0,
                contrastScore=0.0,
                glareRatio=0.0,
                shadowRatio=0.0,
                width=0,
                height=0,
                pHash="",
                isDuplicate=False,
            ),
        )

    # Grayscale conversion for signal-processing metrics
    gray_img = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2GRAY)

    # 2. Resolution Check
    if width < 640 or height < 480:
        s_res = 15.0
        warnings.append(f"Image resolution is critically low ({width}x{height}). Minimum required: 640x480.")
    elif width < 1024 or height < 720:
        s_res = 60.0 + 40.0 * ((width - 640) / 384.0)
    else:
        s_res = 100.0

    # 3. Blur Detection (Variance of Laplacian)
    laplacian_var = float(cv2.Laplacian(gray_img, cv2.CV_64F).var())
    if laplacian_var < 80.0:
        s_blur = max(10.0, laplacian_var * 0.45)
        warnings.append("Severe motion or focal blur detected — please provide a clearer photograph.")
    elif laplacian_var < 180.0:
        s_blur = 40.0 + (laplacian_var - 80.0) * (30.0 / 100.0)
        warnings.append("Moderate blur detected; fine scratch/dent details may be obscured.")
    elif laplacian_var < 350.0:
        s_blur = 70.0 + (laplacian_var - 180.0) * (30.0 / 170.0)
    else:
        s_blur = 100.0

    # 4. Brightness & Exposure Analysis
    mean_brightness = float(np.mean(gray_img))
    glare_ratio = float(np.sum(gray_img >= 250) / (width * height))
    shadow_ratio = float(np.sum(gray_img <= 15) / (width * height))

    if mean_brightness < 45.0 or shadow_ratio > 0.40:
        s_exp = max(15.0, mean_brightness * 0.7)
        warnings.append("Image is underexposed or taken in low lighting. Surface defects may be masked.")
    elif mean_brightness > 215.0 or glare_ratio > 0.25:
        s_exp = max(15.0, (255.0 - mean_brightness) * 0.7)
        warnings.append("High glare or overexposure detected. Specular reflection obscures panel condition.")
    elif 75.0 <= mean_brightness <= 180.0:
        s_exp = 100.0
    else:
        s_exp = 80.0

    # 5. Contrast & Visibility (RMS Contrast)
    rms_contrast = float(np.std(gray_img))
    if rms_contrast < 30.0:
        s_contrast = max(15.0, rms_contrast * 1.2)
        warnings.append("Low contrast / foggy lighting detected. Texture details are washed out.")
    elif rms_contrast < 55.0:
        s_contrast = 40.0 + (rms_contrast - 30.0) * (60.0 / 25.0)
    else:
        s_contrast = 100.0

    # 6. Duplicate Detection (pHash)
    phash = compute_dhash(gray_img)
    is_duplicate = False
    if existing_hashes:
        for ex_hash in existing_hashes:
            if ex_hash and hamming_distance(phash, ex_hash) <= 4:
                is_duplicate = True
                warnings.append("Duplicate photo detected (this image is visually identical to another uploaded angle).")
                break

    # 7. Quality Score Synthesis
    raw_score = (
        0.40 * s_blur +
        0.25 * s_exp +
        0.20 * s_contrast +
        0.15 * s_res
    )

    if is_duplicate:
        raw_score = min(raw_score, 20.0)
    if s_blur < 35.0:
        raw_score = min(raw_score, 45.0)
    if width < 640 or height < 480:
        raw_score = min(raw_score, 35.0)

    quality_score = int(round(np.clip(raw_score, 0.0, 100.0)))

    # 8. Status Classification
    if quality_score >= 70 and not is_duplicate and laplacian_var >= 100.0 and width >= 640 and height >= 480:
        quality_status = "PASS"
    elif quality_score >= 50 and not is_duplicate:
        quality_status = "WARN"
    else:
        quality_status = "FAIL"

    ready_for_cv = (quality_status != "FAIL")

    return IQAResult(
        imageId=image_id,
        viewType=view_type,
        qualityScore=quality_score,
        qualityStatus=quality_status,
        readyForCV=ready_for_cv,
        warnings=warnings,
        metrics=QualityMetrics(
            blurScore=round(laplacian_var, 2),
            brightnessMean=round(mean_brightness, 2),
            contrastScore=round(rms_contrast, 2),
            glareRatio=round(glare_ratio, 4),
            shadowRatio=round(shadow_ratio, 4),
            width=width,
            height=height,
            pHash=phash,
            isDuplicate=is_duplicate,
        ),
    )


def assess_batch_images(images: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Assesses a batch of vehicle images, automatically computing cross-view duplicate detection.
    images: list of dicts with keys: 'bytes', 'imageId', 'viewType'
    """
    results: List[IQAResult] = []
    seen_hashes: List[str] = []

    for item in images:
        img_bytes = item.get("bytes", b"")
        img_id = item.get("imageId")
        view_type = item.get("viewType")

        result = assess_single_image(
            image_bytes=img_bytes,
            image_id=img_id,
            view_type=view_type,
            existing_hashes=seen_hashes,
        )
        if result.metrics.pHash:
            seen_hashes.append(result.metrics.pHash)
        results.append(result)

    all_ready = all(r.readyForCV for r in results)
    pass_count = sum(1 for r in results if r.qualityStatus == "PASS")
    warn_count = sum(1 for r in results if r.qualityStatus == "WARN")
    fail_count = sum(1 for r in results if r.qualityStatus == "FAIL")

    return {
        "success": True,
        "totalAssessed": len(results),
        "allReadyForCV": all_ready,
        "summary": {
            "pass": pass_count,
            "warn": warn_count,
            "fail": fail_count,
        },
        "results": [r.model_dump() for r in results],
    }
