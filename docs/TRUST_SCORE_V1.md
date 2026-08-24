# CARWISE — Evidence Completeness & Buyer Assessment Trust Architecture (Phase 9)

> **Document Version:** 1.0.0  
> **Status:** Production Specification & Architecture  
> **Rule Level:** Strict Deterministic Decision Support (Independent of ML Frameworks)

---

## 1. System Objective & Academic Boundary

The **Buyer Assessment Trust Score ($S_{\text{trust}} \in [0, 100]$)** represents analytical confidence in the **completeness, quality, consistency, and reliability** of submitted photographic evidence.

### Fundamental Semantic Distinction

| Metric | Conceptual Meaning | Question Answered | Source Evidence |
| :--- | :--- | :--- | :--- |
| **Vehicle Condition Score** ($S_{\text{condition}}$) | Observable physical vehicle condition | *"What visible cosmetic & surface damage exists?"* | 2D Bounding-Box Detections & Panel Damage |
| **Assessment Trust Score** ($S_{\text{trust}}$) | Confidence in the quality & coverage of the assessment | *"How reliable and complete is the photographic audit?"* | Image Coverage, IQA Sharpness, Model Certainty |

> ⚠️ **Academic Disclaimer:** A high Trust Score **never** certifies that a vehicle is mechanically sound, accident-free, or roadworthy. It certifies solely that the photographic evidence is sufficiently complete, clear, and consistent to justify reliance on the visual assessment.

---

## 2. End-to-End Decision-Support Pipeline

```
                       ┌──────────────────────┐
                       │ Vehicle Photographs  │
                       └──────────┬───────────┘
                                  ▼
                [ Phase 6: Deterministic IQA Gate ]
                                  ▼
             [ Phase 7C: YOLO11s Damage Detection ]
                                  ▼
             [ Phase 8: Evidence Reasoning Engine ]
                                  ▼
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
[ Evidence Completeness ]  [ Model Confidence ]   [ Cross-View Consistency ]
(0.70 Mand + 0.30 Opt)     (Weighted Detection)   (Multi-Angle Alignment)
      │                           │                           │
      └───────────────────────────┼───────────────────────────┘
                                  ▼
                   [ Evidence Reliability Index ]
                   (R_evidence ∈ [0.0, 1.0])
                                  ▼
                  [ Buyer Assessment Trust Score ]
                  (S_trust = 100 * R_evidence)
                                  ▼
                  [ Mandatory Safety Gating Caps ]
                  (Cap ≤ 69 / 49 / 59 on Missing Views)
                                  ▼
                   ┌─────────────────────────────┐
                   │ Trust Band & Explainability │
                   │  - HIGH_CONFIDENCE (≥80)    │
                   │  - MODERATE_CONFIDENCE (65) │
                   │  - PROCEED_WITH_CAUTION(50) │
                   │  - INSUFFICIENT_EVIDENCE    │
                   └─────────────────────────────┘
```

---

## 3. Mathematical Formulations & Component Weights

### 3.1 Central Configuration (`TRUST_V1_CONFIG`)
```python
TRUST_V1_CONFIG = {
    "mandatoryWeight": 0.70,
    "optionalWeight": 0.30,
    "mandatoryViews": ["FRONT", "REAR", "LEFT", "RIGHT"],
    "optionalViews": [
        "FRONT_LEFT", "FRONT_RIGHT", "REAR_LEFT", "REAR_RIGHT",
        "INTERIOR", "DASHBOARD", "ENGINE_BAY", "TYRES"
    ],
    "reliabilityWeights": {
        "evidenceCompleteness": 0.35,
        "iqaReliability": 0.25,
        "modelConfidence": 0.25,
        "crossViewConsistency": 0.15,
    },
    "trustCaps": {
        "oneMandatoryMissing": 69,
        "twoOrMoreMandatoryMissing": 49,
        "multipleIqaFailures": 59,
    },
    "trustBands": {
        "HIGH_CONFIDENCE": 80,
        "MODERATE_CONFIDENCE": 65,
        "PROCEED_WITH_CAUTION": 50,
    }
}
```

### 3.2 Evidence Completeness Index ($C_{\text{evidence}}$)
$$C_{\text{mandatory}} = \frac{N_{\text{usable\_mandatory}}}{4}$$
$$C_{\text{optional}} = \frac{N_{\text{usable\_optional}}}{8}$$
$$C_{\text{evidence}} = 0.70 \times C_{\text{mandatory}} + 0.30 \times C_{\text{optional}}$$
*If any mandatory perspective is absent, $C_{\text{mandatory}} < 1.0$ and explicit blindspot diagnostics are generated.*

### 3.3 IQA Reliability Factor ($R_{\text{iqa}}$)
Each submitted photograph is assigned an IQA reliability weight:
$$w_{\text{iqa}}(\text{PASS}) = 1.00, \quad w_{\text{iqa}}(\text{WARN}) = 0.70, \quad w_{\text{iqa}}(\text{FAIL}) = 0.00$$
$$R_{\text{iqa}} = \frac{\sum_{i=1}^N w_{\text{iqa}, i}}{N_{\text{submitted}}}$$

### 3.4 Model Confidence Aggregation ($C_{\text{model}}$)
For non-suppressed detections:
$$C_{\text{model}} = \frac{\sum_{i} w_i \times c_i}{\sum_{i} w_i}$$
Where $w(\text{HIGH\_CONFIDENCE}) = 1.0$, $w(\text{POTENTIAL}) = 0.5$.

#### Zero-Detections Distinction
- **Clean Vehicle with High Evidence:** If usable images $\ge 4$ with $\text{IQA} \ge 70.0$, $C_{\text{model}} = 0.90$ with status `"NO_VISIBLE_DAMAGE_DETECTED"`.
- **Sub-Optimal Evidence Coverage:** If usable images $< 4$, $C_{\text{model}} = 0.55$ with status `"UNABLE_TO_ESTABLISH_ABSENCE_DUE_TO_COVERAGE"`.

### 3.5 Cross-View Consistency Index ($CrossViewConsistency$)
- Multi-angle corroborated damage observations: $0.95$
- Clean multi-view vehicle: $0.90$
- Isolated uncorroborated single-view observation: $0.80$
- Single perspective only (no triangulation possible): $0.50$

### 3.6 Overall Evidence Reliability ($R_{\text{evidence}}$)
$$R_{\text{evidence}} = 0.35 \times C_{\text{evidence}} + 0.25 \times R_{\text{iqa}} + 0.25 \times C_{\text{model}} + 0.15 \times CrossViewConsistency$$

---

## 4. Trust Score & Mandatory Safety Gating Caps

Raw score:
$$\text{RawTrust} = \text{round}(100 \times R_{\text{evidence}})$$

### Safety Gating Rules:
1. **Single Mandatory View Missing:** $S_{\text{trust}} \le 69$ (`GATED_MAX_69_DUE_TO_MISSING_MANDATORY_VIEW`).
2. **Two or More Mandatory Views Missing:** $S_{\text{trust}} \le 49$ (`GATED_MAX_49_DUE_TO_2+_MISSING_MANDATORY_VIEWS`).
3. **Multiple IQA Failures ($\ge 2$):** $S_{\text{trust}} \le 59$ (`GATED_MAX_59_DUE_TO_MULTIPLE_IQA_FAILURES`).

---

## 5. Explainable Trust Bands

| Band Name | Score Range | Mandatory Complete? | User-Facing Explanation |
| :--- | :--- | :--- | :--- |
| **`HIGH_CONFIDENCE`** | $80 - 100$ | **Required (True)** | *"Assessment has strong photographic evidence coverage, optimal clarity, and cross-view consistency."* |
| **`MODERATE_CONFIDENCE`** | $65 - 79$ | Optional | *"Assessment is reasonably supported, but some perspective limitations or minor quality penalties remain."* |
| **`PROCEED_WITH_CAUTION`** | $50 - 64$ | Optional | *"Assessment has meaningful evidence gaps or image quality limitations requiring physical inspection."* |
| **`INSUFFICIENT_EVIDENCE`** | $0 - 49$ | — | *"Available evidence is insufficient for a reliable photographic assessment."* |

---

## 6. Assessment Status Lifecycle

```
[ Uploaded Photos ] ── (0 usable or 2+ mandatory missing) ──► INSUFFICIENT_EVIDENCE
                    ── (1 mandatory missing) ──────────────► LIMITED_ASSESSMENT
                    ── (All 4 mandatory usable) ────────────► READY_FOR_ASSESSMENT
```

---

## 7. Non-Claims & Academic Verification

The CARWISE Trust Score does **not**:
1. Guarantee that hidden mechanical components (engine, gearbox, suspension) are functional.
2. Certify structural chassis frame alignment or sub-surface weld integrity.
3. Replace a comprehensive hands-on pre-purchase mechanical inspection.
