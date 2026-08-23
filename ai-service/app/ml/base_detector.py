# ═══════════════════════════════════════════════════════════════
# CARWISE — Abstract BaseDamageDetector Interface
# Pluggable Strategy Pattern for Vehicle Damage Object Detectors
# ═══════════════════════════════════════════════════════════════

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    xMin: float = Field(..., ge=0.0, le=1.0, description="Normalized top-left X coordinate")
    yMin: float = Field(..., ge=0.0, le=1.0, description="Normalized top-left Y coordinate")
    xMax: float = Field(..., ge=0.0, le=1.0, description="Normalized bottom-right X coordinate")
    yMax: float = Field(..., ge=0.0, le=1.0, description="Normalized bottom-right Y coordinate")


class DamageDetection(BaseModel):
    className: str = Field(..., description="Canonical defect class: scratch, dent, crack, glass_shatter, lamp_broken, tire_flat")
    classId: int = Field(..., description="Zero-indexed class identifier")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model output confidence score")
    confidenceBand: str = Field(..., description="HIGH_CONFIDENCE (>=0.55) or POTENTIAL (0.40 - 0.54)")
    bbox: BoundingBox
    qualityWarning: bool = False


class ModelMetadata(BaseModel):
    name: str = "YOLO11s"
    provider: str = "Ultralytics"
    version: str = "1.0.0"
    weightsVersion: str = "cardd-baseline-v1"
    dataset: str = "CarDD"
    datasetVersion: str = "IEEE-TITS-2023"
    inferenceTimeMs: float = 0.0


class DamageDetectionResult(BaseModel):
    status: str = Field(..., description="COMPLETE | BLOCKED_BY_IQA | NO_DAMAGE_DETECTED | MODEL_ERROR")
    imageId: Optional[str] = None
    viewType: Optional[str] = None
    detections: List[DamageDetection] = []
    iqa: Dict[str, Any] = {}
    model: ModelMetadata = ModelMetadata()
    analyzedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BaseDamageDetector(ABC):
    """
    Abstract strategy interface for all CARWISE vehicle defect object detectors.
    Downstream scoring and reasoning modules interact strictly through this interface.
    """

    @abstractmethod
    def detect(
        self,
        image_bytes: bytes,
        view_type: Optional[str] = None,
        image_id: Optional[str] = None,
        run_iqa_gate: bool = True,
    ) -> DamageDetectionResult:
        """
        Executes damage detection on raw image bytes.
        If run_iqa_gate is True, executes IQA first and blocks inference if IQA status is FAIL.
        """
        pass
