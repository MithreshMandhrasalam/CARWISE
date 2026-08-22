"""
⚠️  DEV PLACEHOLDER MODULE — mock_damage.py
──────────────────────────────────────────────────────
This module returns deterministic mock damage detections for development
and UI testing purposes ONLY.

It does NOT perform any real computer vision or machine learning.

To replace with the real YOLOv8 model:
  1. Train/fine-tune YOLOv8 on a car damage dataset (see docs/model-notes.md)
  2. Export weights to app/ml/weights/damage_yolov8.pt
  3. Set AI_SERVICE_USE_MOCK=false in .env
  4. The real model in app/ml/damage_detector.py will be loaded instead.

All API responses from this module include isMock=true.
──────────────────────────────────────────────────────
"""
import random
from typing import List


MOCK_DAMAGE_TEMPLATES = [
    {
        "damageType": "scratch",
        "component": "front bumper",
        "severity": "minor",
        "notes": "Shallow surface scratch visible along lower bumper edge",
    },
    {
        "damageType": "dent",
        "component": "front-left door panel",
        "severity": "moderate",
        "notes": "Panel dent approximately 15cm diameter, no paint cracking",
    },
    {
        "damageType": "rust",
        "component": "rear-right wheel arch",
        "severity": "minor",
        "notes": "Early-stage surface rust, not yet structural",
    },
    {
        "damageType": "paint_anomaly",
        "component": "front-left fender",
        "severity": "minor",
        "notes": "Color mismatch suggesting possible repainting of this panel",
    },
    {
        "damageType": "damaged_light",
        "component": "front-right headlight",
        "severity": "moderate",
        "notes": "Headlight housing shows cracking, may affect waterproofing",
    },
    {
        "damageType": "tyre_abnormality",
        "component": "front-left tyre",
        "severity": "moderate",
        "notes": "Uneven tread wear visible on inner edge, possible alignment issue",
    },
    {
        "damageType": "crack",
        "component": "windshield",
        "severity": "severe",
        "notes": "Hairline crack in driver field of vision, safety concern",
    },
]

ANGLE_COMPONENT_MAP = {
    "front": ["front bumper", "windshield", "front-right headlight", "front-left headlight", "hood"],
    "rear": ["rear bumper", "rear-right tail light", "rear-left tail light", "trunk"],
    "left": ["front-left door panel", "rear-left door panel", "front-left fender", "rear-left wheel arch"],
    "right": ["front-right door panel", "rear-right door panel", "front-right fender", "rear-right wheel arch"],
    "front-left": ["front-left fender", "front-left headlight", "front bumper"],
    "front-right": ["front-right fender", "front-right headlight", "front bumper"],
    "rear-left": ["rear-left tail light", "rear bumper", "rear-left wheel arch"],
    "rear-right": ["rear-right tail light", "rear bumper", "rear-right wheel arch"],
    "interior": ["dashboard", "steering wheel", "seat upholstery", "headliner"],
    "dashboard": ["instrument cluster", "center console", "dashboard trim"],
    "engine": ["engine bay", "fluid levels", "belts"],
    "tyre-fl": ["front-left tyre"],
    "tyre-fr": ["front-right tyre"],
    "tyre-rl": ["rear-left tyre"],
    "tyre-rr": ["rear-right tyre"],
}


def detect_damage_mock(images: List[dict]) -> dict:
    """
    Returns mock damage detections.
    Each image may generate 0-2 detections based on seeded randomness.

    Args:
        images: List of dicts with 'angle' and 'url' keys.

    Returns:
        Detection result dict (isMock=True always set).
    """
    detections = []
    repair_flags = []

    for img in images:
        angle = img.get("angle", "front")
        # Seed with angle string for deterministic demo results
        rng = random.Random(hash(angle) % 10000)

        num_detections = rng.randint(0, 2)
        for _ in range(num_detections):
            template = rng.choice(MOCK_DAMAGE_TEMPLATES)
            components = ANGLE_COMPONENT_MAP.get(angle, ["unknown"])
            detection = {
                "imageAngle": angle,
                "damageType": template["damageType"],
                "component": rng.choice(components),
                "severity": template["severity"],
                "confidence": round(rng.uniform(0.65, 0.95), 2),
                "boundingBox": {
                    "x": round(rng.uniform(0.1, 0.7), 3),
                    "y": round(rng.uniform(0.1, 0.7), 3),
                    "w": round(rng.uniform(0.1, 0.3), 3),
                    "h": round(rng.uniform(0.05, 0.25), 3),
                },
                "notes": template["notes"],
            }
            detections.append(detection)

            # Flag if paint anomaly + dent on same panel — possible repair
            if detection["damageType"] in ("paint_anomaly", "dent"):
                repair_flags.append(detection["component"])

    # Check for co-occurring paint + dent on same component
    repair_indication = len([c for c in set(repair_flags) if repair_flags.count(c) > 1]) > 0

    return {
        "modelVersion": "mock-v0.1",
        "isMock": True,
        "detections": detections,
        "repairIndicationFlag": repair_indication,
        "repairIndicationNote": (
            "Visual evidence suggests possible previous repair on one or more panels. "
            "Requires physical verification by a qualified inspector."
            if repair_indication
            else None
        ),
    }
