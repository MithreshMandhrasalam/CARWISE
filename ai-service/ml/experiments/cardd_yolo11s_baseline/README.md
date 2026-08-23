# CARWISE — YOLO11s Baseline Damage Detection Experiment

This directory stores experimental training and evaluation artifacts for the YOLO11s detector trained on the CarDD dataset.

## Files & Artifacts
- `training_config.yaml`: Exact hyperparameter configuration, seed (42), and MPS device settings.
- `metrics.json`: Evaluated test metrics across overall and per-class thresholds.
- `results.csv`: Per-class precision, recall, mAP@50, and mAP@50:95 summary.
- `sample_predictions/`: Representative evaluation visual samples.

## Important Note
In accordance with project rules, model weights (`.pt`, `.onnx`) are excluded via `.gitignore` and are not committed to Git.
