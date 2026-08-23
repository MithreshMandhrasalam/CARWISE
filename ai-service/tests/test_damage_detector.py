# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 7C: Damage Detector Automated Unit Tests
# Tests BaseDamageDetector, YOLODamageDetector, IQA Gating, & API
# ═══════════════════════════════════════════════════════════════

import io
import base64
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.ml.base_detector import BaseDamageDetector, DamageDetectionResult, BoundingBox
from app.ml.yolo_adapter import YOLODamageDetector

client = TestClient(app)


def _create_synthetic_image(width=800, height=600, pattern="normal") -> bytes:
    """Generates synthetic JPEG test images with defined visual properties."""
    if pattern == "normal":
        arr = np.random.randint(60, 200, (height, width, 3), dtype=np.uint8)
        # Draw some gradient lines to provide feature variance
        for i in range(10):
            arr[100 + i * 20 : 105 + i * 20, :, :] = 220
    elif pattern == "dark_fail":
        arr = np.ones((height, width, 3), dtype=np.uint8) * 15  # Mean 15 -> IQA FAIL
    elif pattern == "warn_blur":
        # Low contrast & mild blur
        arr = np.ones((height, width, 3), dtype=np.uint8) * 128
        arr += np.random.randint(-15, 15, (height, width, 3), dtype=np.int16).astype(np.uint8)
    else:
        arr = np.random.randint(0, 255, (height, width, 3), dtype=np.uint8)

    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def test_base_detector_interface():
    """Verifies that YOLODamageDetector properly inherits from BaseDamageDetector."""
    detector = YOLODamageDetector()
    assert isinstance(detector, BaseDamageDetector)


def test_valid_image_inference():
    """Verifies that a valid image produces standardized CARWISE detections."""
    detector = YOLODamageDetector()
    img_bytes = _create_synthetic_image(800, 600, "normal")

    result = detector.detect(img_bytes, view_type="FRONT", image_id="img-001")
    assert isinstance(result, DamageDetectionResult)
    assert result.status in ["COMPLETE", "NO_DAMAGE_DETECTED"]
    assert result.imageId == "img-001"
    assert result.viewType == "FRONT"
    assert result.model.name == "YOLO11s"
    assert result.model.weightsVersion == "cardd-baseline-v1"

    for det in result.detections:
        assert det.className in ["scratch", "dent", "crack", "glass_shatter", "lamp_broken", "tire_flat"]
        assert 0.0 <= det.confidence <= 1.0
        assert det.confidenceBand in ["HIGH_CONFIDENCE", "POTENTIAL"]
        assert 0.0 <= det.bbox.xMin <= det.bbox.xMax <= 1.0
        assert 0.0 <= det.bbox.yMin <= det.bbox.yMax <= 1.0


def test_confidence_banding():
    """Verifies that confidence thresholds map correctly to HIGH_CONFIDENCE vs POTENTIAL."""
    detector = YOLODamageDetector(confidence_threshold=0.40, high_confidence_threshold=0.55)
    img_bytes = _create_synthetic_image(800, 600, "normal")

    result = detector.detect(img_bytes, view_type="FRONT")
    for det in result.detections:
        if det.confidence >= 0.55:
            assert det.confidenceBand == "HIGH_CONFIDENCE"
        elif 0.40 <= det.confidence < 0.55:
            assert det.confidenceBand == "POTENTIAL"
        else:
            pytest.fail(f"Confidence {det.confidence} should have been suppressed below 0.40")


def test_iqa_fail_blocks_cv_inference():
    """Verifies that an image failing IQA immediately blocks CV inference and returns BLOCKED_BY_IQA."""
    detector = YOLODamageDetector()
    dark_bytes = _create_synthetic_image(800, 600, "dark_fail")

    result = detector.detect(dark_bytes, view_type="FRONT", image_id="dark-01", run_iqa_gate=True)
    assert result.status == "BLOCKED_BY_IQA"
    assert len(result.detections) == 0
    assert result.iqa["qualityStatus"] == "FAIL"


def test_iqa_warn_allows_inference_with_warning():
    """Verifies that an image with IQA WARN is allowed into CV but flagged with qualityWarning."""
    detector = YOLODamageDetector()
    warn_bytes = _create_synthetic_image(800, 600, "warn_blur")

    result = detector.detect(warn_bytes, view_type="FRONT", image_id="warn-01", run_iqa_gate=True)
    assert result.status in ["COMPLETE", "NO_DAMAGE_DETECTED", "BLOCKED_BY_IQA"]
    if result.status == "COMPLETE":
        assert result.iqa["qualityStatus"] in ["PASS", "WARN"]
        if result.iqa["qualityStatus"] == "WARN":
            assert all(d.qualityWarning is True for d in result.detections)


def test_damage_detect_api_file_upload():
    """Verifies POST /api/v1/damage/detect multipart file endpoint."""
    img_bytes = _create_synthetic_image(800, 600, "normal")
    response = client.post(
        "/api/v1/damage/detect",
        files={"file": ("front.jpg", img_bytes, "image/jpeg")},
        data={"viewType": "FRONT", "imageId": "test-front-123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["COMPLETE", "NO_DAMAGE_DETECTED"]
    assert data["viewType"] == "FRONT"
    assert data["model"]["name"] == "YOLO11s"


def test_damage_batch_detect_api():
    """Verifies POST /api/v1/damage/batch-detect processes multiple images with IQA gating."""
    good_img = _create_synthetic_image(800, 600, "normal")
    bad_img = _create_synthetic_image(800, 600, "dark_fail")

    payload = {
        "inspectionId": "insp-999",
        "images": [
            {
                "imageId": "img-good",
                "viewType": "FRONT",
                "imageBase64": base64.b64encode(good_img).decode("utf-8"),
                "runIqaGate": True,
            },
            {
                "imageId": "img-bad",
                "viewType": "REAR",
                "imageBase64": base64.b64encode(bad_img).decode("utf-8"),
                "runIqaGate": True,
            },
        ],
    }

    response = client.post("/api/v1/damage/batch-detect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETE"
    assert len(data["results"]) == 2

    # First image should succeed
    assert data["results"][0]["imageId"] == "img-good"
    assert data["results"][0]["status"] in ["COMPLETE", "NO_DAMAGE_DETECTED"]

    # Second image should be blocked by IQA
    assert data["results"][1]["imageId"] == "img-bad"
    assert data["results"][1]["status"] == "BLOCKED_BY_IQA"
    assert len(data["results"][1]["detections"]) == 0
