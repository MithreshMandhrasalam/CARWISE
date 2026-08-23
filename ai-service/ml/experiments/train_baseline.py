# ═══════════════════════════════════════════════════════════════
# CARWISE — Phase 7B: Baseline Damage Detection Experiment
# Trains and evaluates YOLO11s on the CarDD benchmark
# Strictly experimental — zero production interference
# ═══════════════════════════════════════════════════════════════

import os
import sys
import json
import time
import yaml
from pathlib import Path
from typing import Dict, Any, List

CARDD_CLASSES = [
    "scratch",
    "dent",
    "crack",
    "glass_shatter",
    "lamp_broken",
    "tire_flat",
]


def run_baseline_experiment(
    data_yaml_path: str,
    output_dir: str,
    epochs: int = 60,
    img_size: int = 640,
    batch_size: int = 16,
    seed: int = 42,
    device: str = "mps",
) -> Dict[str, Any]:
    """
    Executes baseline YOLO11s training and holdout test set evaluation.
    """
    import torch
    from ultralytics import YOLO

    # 1. Hardware Verification
    mps_available = torch.backends.mps.is_available()
    selected_device = "mps" if (device == "mps" and mps_available) else "cpu"
    print(f"[CARWISE Experiment] Device: {selected_device} (MPS Available: {mps_available})")
    print(f"[CARWISE Experiment] PyTorch Version: {torch.__version__}")
    print(f"[CARWISE Experiment] Fixed Random Seed: {seed}")

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # 2. Save Experiment Configuration
    config = {
        "experiment_name": "cardd_yolo11s_baseline",
        "model_architecture": "YOLO11s",
        "dataset": "CarDD (Car Damage Dataset)",
        "dataset_splits": {
            "train": 2816,
            "val": 810,
            "test": 374,
        },
        "classes": CARDD_CLASSES,
        "epochs": epochs,
        "imgsz": img_size,
        "batch": batch_size,
        "seed": seed,
        "device": selected_device,
        "pytorch_version": torch.__version__,
        "python_version": sys.version,
    }

    with open(out_path / "training_config.yaml", "w") as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False)

    print(f"[CARWISE Experiment] Configuration saved to {out_path / 'training_config.yaml'}")

    return config


if __name__ == "__main__":
    print("CARWISE Baseline Experiment Module initialized.")
