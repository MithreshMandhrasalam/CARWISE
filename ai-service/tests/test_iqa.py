import io
import cv2
import numpy as np
from PIL import Image
from app.services.iqa_service import (
    assess_single_image,
    assess_batch_images,
    compute_dhash,
    hamming_distance,
)


def create_test_image(
    width: int = 1280,
    height: int = 720,
    pattern: str = "sharp",
    brightness: int = 128,
) -> bytes:
    """Helper to synthesize test image binaries with controlled properties."""
    img = np.full((height, width, 3), brightness, dtype=np.uint8)

    if pattern == "sharp":
        # Draw high-contrast sharp geometric lines and textures
        for i in range(0, width, 30):
            cv2.line(img, (i, 0), (i, height), (0, 0, 0), 2)
        for j in range(0, height, 30):
            cv2.line(img, (0, j), (width, j), (255, 255, 255), 2)
        cv2.circle(img, (width // 2, height // 2), 100, (20, 180, 240), -1)
        cv2.putText(img, "CARWISE IQA TEST", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)

    elif pattern == "blurry":
        # Draw some lines and apply heavy Gaussian blur
        for i in range(0, width, 40):
            cv2.line(img, (i, 0), (i, height), (30, 30, 30), 2)
        img = cv2.GaussianBlur(img, (51, 51), 30)

    elif pattern == "dark":
        # Almost completely black
        img = np.full((height, width, 3), 15, dtype=np.uint8)

    elif pattern == "overexposed":
        # Almost completely white / blown out
        img = np.full((height, width, 3), 245, dtype=np.uint8)

    pil_img = Image.fromarray(img)
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def test_sharp_image_passes_iqa():
    img_bytes = create_test_image(pattern="sharp", width=1280, height=720)
    res = assess_single_image(img_bytes, image_id="img-001", view_type="FRONT")

    assert res.qualityStatus == "PASS"
    assert res.readyForCV is True
    assert res.qualityScore >= 70
    assert res.metrics.blurScore > 100.0
    assert 60.0 <= res.metrics.brightnessMean <= 200.0
    assert res.metrics.isDuplicate is False


def test_blurry_image_fails_or_warns_iqa():
    img_bytes = create_test_image(pattern="blurry", width=1280, height=720)
    res = assess_single_image(img_bytes, image_id="img-002", view_type="REAR")

    assert res.qualityStatus in ["WARN", "FAIL"]
    assert res.metrics.blurScore < 80.0
    assert any("blur" in w.lower() for w in res.warnings)


def test_dark_underexposed_image():
    img_bytes = create_test_image(pattern="dark", width=1280, height=720)
    res = assess_single_image(img_bytes, image_id="img-003", view_type="LEFT")

    assert res.qualityStatus in ["WARN", "FAIL"]
    assert res.metrics.brightnessMean < 45.0
    assert any("underexposed" in w.lower() or "dark" in w.lower() for w in res.warnings)


def test_overexposed_image():
    img_bytes = create_test_image(pattern="overexposed", width=1280, height=720)
    res = assess_single_image(img_bytes, image_id="img-004", view_type="RIGHT")

    assert res.qualityStatus in ["WARN", "FAIL"]
    assert res.metrics.brightnessMean > 215.0
    assert any("glare" in w.lower() or "overexposed" in w.lower() for w in res.warnings)


def test_low_resolution_image():
    img_bytes = create_test_image(pattern="sharp", width=320, height=240)
    res = assess_single_image(img_bytes, image_id="img-005", view_type="FRONT_LEFT")

    assert res.qualityStatus == "FAIL"
    assert res.readyForCV is False
    assert any("resolution" in w.lower() for w in res.warnings)


def test_duplicate_image_detection():
    img_bytes_1 = create_test_image(pattern="sharp", width=1280, height=720)
    # Exact duplicate
    res_1 = assess_single_image(img_bytes_1, image_id="img-006", view_type="FRONT")
    hash_1 = res_1.metrics.pHash

    res_2 = assess_single_image(img_bytes_1, image_id="img-007", view_type="REAR", existing_hashes=[hash_1])
    assert res_2.metrics.isDuplicate is True
    assert res_2.qualityStatus == "FAIL"
    assert any("duplicate" in w.lower() for w in res_2.warnings)


def test_corrupt_image_payload():
    corrupt_bytes = b"Corrupt binary payload that is not an image"
    res = assess_single_image(corrupt_bytes, image_id="img-008", view_type="TYRES")

    assert res.qualityStatus == "FAIL"
    assert res.qualityScore == 0
    assert res.readyForCV is False
    assert any("corrupt" in w.lower() or "integrity" in w.lower() for w in res.warnings)


def test_batch_assessment():
    img_sharp = create_test_image(pattern="sharp", width=1280, height=720)
    img_blurry = create_test_image(pattern="blurry", width=1280, height=720)

    batch_payload = [
        {"bytes": img_sharp, "imageId": "b1", "viewType": "FRONT"},
        {"bytes": img_blurry, "imageId": "b2", "viewType": "REAR"},
        {"bytes": img_sharp, "imageId": "b3", "viewType": "LEFT"},  # Duplicate of b1
    ]

    batch_res = assess_batch_images(batch_payload)
    assert batch_res["totalAssessed"] == 3
    assert batch_res["summary"]["pass"] >= 1
    assert batch_res["results"][2]["metrics"]["isDuplicate"] is True
