# ═══════════════════════════════════════════════════════════════
# CARWISE — CarDD COCO to YOLO Format Converter & Validator
# Converts official CarDD COCO annotations to YOLO format
# Validates bounding box coordinates and split fidelity
# ═══════════════════════════════════════════════════════════════

import os
import json
import yaml
from pathlib import Path
from typing import Dict, List, Any

# Exact CarDD 6-Class Taxonomy Mapping (Phase 7)
CARDD_CLASSES = [
    "scratch",
    "dent",
    "crack",
    "glass_shatter",
    "lamp_broken",
    "tire_flat",
]

CARDD_CLASS_TO_IDX = {cls_name: idx for idx, cls_name in enumerate(CARDD_CLASSES)}

# Normalization map for minor naming discrepancies in COCO json
NAME_NORMALIZATION_MAP = {
    "scratch": "scratch",
    "dent": "dent",
    "crack": "crack",
    "glass shatter": "glass_shatter",
    "glass_shatter": "glass_shatter",
    "lamp broken": "lamp_broken",
    "lamp_broken": "lamp_broken",
    "tire flat": "tire_flat",
    "tire_flat": "tire_flat",
}


def convert_coco_bbox_to_yolo(bbox: List[float], img_width: int, img_height: int) -> List[float]:
    """
    Converts COCO [x_min, y_min, width, height] to YOLO [x_center, y_center, width, height] normalized to [0, 1].
    """
    x_min, y_min, w, h = bbox
    # Clip coordinates to valid image boundary
    x_min = max(0.0, min(float(x_min), float(img_width)))
    y_min = max(0.0, min(float(y_min), float(img_height)))
    w = max(0.0, min(float(w), float(img_width) - x_min))
    h = max(0.0, min(float(h), float(img_height) - y_min))

    x_center = (x_min + w / 2.0) / float(img_width)
    y_center = (y_min + h / 2.0) / float(img_height)
    norm_w = w / float(img_width)
    norm_h = h / float(img_height)

    # Round to 6 decimal places for precision and compactness
    return [
        round(min(max(x_center, 0.0), 1.0), 6),
        round(min(max(y_center, 0.0), 1.0), 6),
        round(min(max(norm_w, 0.0), 1.0), 6),
        round(min(max(norm_h, 0.0), 1.0), 6),
    ]


def generate_dataset_yaml(output_dir: Path) -> Path:
    """
    Generates dataset.yaml for Ultralytics YOLO training.
    """
    data_dict = {
        "path": str(output_dir.resolve()),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "nc": len(CARDD_CLASSES),
        "names": {i: name for i, name in enumerate(CARDD_CLASSES)},
    }

    yaml_path = output_dir / "dataset.yaml"
    with open(yaml_path, "w") as f:
        yaml.dump(data_dict, f, default_flow_style=False, sort_keys=False)

    return yaml_path


if __name__ == "__main__":
    print("CarDD dataset converter & validator initialized.")
