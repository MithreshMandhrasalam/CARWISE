# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 7C: Smoke Regression Test
# Verifies BaseDamageDetector and YOLODamageDetector pipeline
# ═══════════════════════════════════════════════════════════════

import io
import time
import numpy as np
from PIL import Image

from app.ml.yolo_adapter import YOLODamageDetector
from app.ml.base_detector import DamageDetectionResult


def generate_synthetic_vehicle_image(view="FRONT") -> bytes:
    """Generates synthetic test vehicle perspective images."""
    arr = np.random.randint(70, 190, (600, 800, 3), dtype=np.uint8)
    # Add horizontal body creases
    arr[280:290, :, :] = 50
    arr[400:410, :, :] = 210
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def run_smoke_test():
    print("=" * 60)
    print("CARWISE Phase 7C: CV Adapter Smoke Regression Test")
    print("=" * 60)

    detector = YOLODamageDetector()
    views = ["FRONT", "REAR", "LEFT", "RIGHT"]
    total_detections = 0
    start_time = time.perf_counter()

    for view in views:
        img_bytes = generate_synthetic_vehicle_image(view)
        res = detector.detect(img_bytes, view_type=view, image_id=f"smoke-{view.lower()}", run_iqa_gate=True)

        assert isinstance(res, DamageDetectionResult)
        assert res.status in ["COMPLETE", "NO_DAMAGE_DETECTED"]
        total_detections += len(res.detections)
        print(f"[{view}] Status: {res.status} | Detections: {len(res.detections)} | Model: {res.model.name} | Inference: {res.model.inferenceTimeMs}ms")

    elapsed_total = round((time.perf_counter() - start_time) * 1000, 2)
    print("-" * 60)
    print(f"Smoke Test Summary: 4 images processed in {elapsed_total}ms")
    print(f"Total Detections Found: {total_detections}")
    print("Smoke Test Status: PASS")
    print("=" * 60)


if __name__ == "__main__":
    run_smoke_test()
