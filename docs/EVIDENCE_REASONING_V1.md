# CARWISE — Evidence Reasoning & Deterministic Damage Assessment Architecture (Phase 8)

> **Document Version:** 1.0.0  
> **Status:** Production Specification & Architecture  
> **Rule Level:** Strict Deterministic Business Logic (Independent of ML frameworks)

---

## 1. System Objective & Academic Boundary

The **CARWISE Evidence Reasoning Layer** converts raw, bounding-box Computer Vision detections (produced by the YOLO11s detector) into structured, explainable, and accountable vehicle condition evidence.

### Fundamental Principle: Decoupled Explainability
1. **The Neural Network Locates:** The YOLO11s model identifies prospective 2D bounding boxes and assigns visual class probabilities.
2. **Deterministic Rules Reason:** Damage severity, vehicle-zone association, deduplication, cross-view patterns, and the **Vehicle Condition Score** are computed purely through deterministic, auditable business logic.
3. **Strict Physical Verification Requirement:** The system **never** claims to determine hidden mechanical condition, structural chassis alignment, or unobservable internal crash history. All findings are explicitly characterized as *"Visual evidence requiring hands-on physical verification."*

---

## 2. End-to-End Pipeline

```
[ Uploaded Perspective Photograph ]
                │
                ▼
  [ Phase 6: Deterministic IQA Gate ] ── (FAIL) ──► BLOCKED_BY_IQA (Zero false detections)
                │ (PASS / WARN)
                ▼
 [ Phase 7C: YOLO11s Damage Detector ] ──► Raw Bounding Boxes [0.0, 1.0]
                │
                ▼
 [ 1. Evidence Normalization & Validation ] ── (Invalid BBox) ──► REJECTED (Zero garbage data)
                │ (Valid Coordinates)
                ▼
 [ 2. Vehicle-Zone Mapping (8 Zones) ] ────► Logical Zone Association
                │
                ▼
 [ 3. Deterministic Severity Engine ] ──────► MINOR | MODERATE | SEVERE
                │
                ▼
 [ 4. Same-Evidence Deduplication ] ────────► IoU ≥ 0.70 Consolidation
                │
                ▼
 [ 5. Multiple Damage Aggregation ] ────────► Zone Burden & Highest Severity
                │
                ▼
 [ 6. Cross-View Reasoning Engine ] ────────► Multi-Angle Contiguity Patterns
                │
                ▼
 [ 7. Vehicle Condition Score Engine ] ─────► S_condition ∈ [0, 100]
                │
                ▼
 [ 8. Evidence Completeness Assessment ] ───► Coverage % & Blindspots
                │
                ▼
   [ Structured Evidence Assessment Report ]
```

---

## 3. Mathematical Formulations & Algorithms

### 3.1 Bounding Box Area Ratio ($\alpha$)
For normalized coordinates $x_{\min}, y_{\min}, x_{\max}, y_{\max} \in [0.0, 1.0]$:
$$\alpha = (x_{\max} - x_{\min}) \times (y_{\max} - y_{\min})$$
- **Validation Rule:** Rejects any coordinate where $x_{\min} < 0$, $y_{\min} < 0$, $x_{\max} > 1$, $y_{\max} > 1$, $x_{\min} \ge x_{\max}$, $y_{\min} \ge y_{\max}$, or $\alpha \le 0$.

### 3.2 Deterministic 2D Intersection over Union (IoU)
$$\text{IoU}(A, B) = \frac{\text{Area}(A \cap B)}{\text{Area}(A \cup B)} = \frac{\max(0, \min(x_{\max}^A, x_{\max}^B) - \max(x_{\min}^A, x_{\min}^B)) \times \max(0, \min(y_{\max}^A, y_{\max}^B) - \max(y_{\min}^A, y_{\min}^B))}{\text{Area}(A) + \text{Area}(B) - \text{Area}(A \cap B)}$$
- **Deduplication Threshold:** If $\text{IoU} \ge 0.70$ between two findings of the identical damage class within the same or adjacent viewpoint, the secondary observation is flagged as `isDuplicateEvidence: true` and linked to `duplicateOf`.

---

## 4. Vehicle Zone Taxonomy & Deterministic Mapping

### 4.1 Canonical 8-Zone Taxonomy
1. `FRONT`
2. `FRONT_LEFT`
3. `FRONT_RIGHT`
4. `REAR`
5. `REAR_LEFT`
6. `REAR_RIGHT`
7. `LEFT_SIDE`
8. `RIGHT_SIDE`

### 4.2 Mapping Heuristics
- **Perspective Projection:** Given `viewType` and bounding box horizontal center $x_c = \frac{x_{\min} + x_{\max}}{2}$:
  - `FRONT` viewpoint: $x_c < 0.35 \implies \text{FRONT\_LEFT}$; $x_c > 0.65 \implies \text{FRONT\_RIGHT}$; else $\text{FRONT}$.
  - `REAR` viewpoint: $x_c < 0.35 \implies \text{REAR\_LEFT}$; $x_c > 0.65 \implies \text{REAR\_RIGHT}$; else $\text{REAR}$.
  - `LEFT` viewpoint: $x_c < 0.30 \implies \text{FRONT\_LEFT}$; $x_c > 0.70 \implies \text{REAR\_LEFT}$; else $\text{LEFT\_SIDE}$.
  - `RIGHT` viewpoint: $x_c < 0.30 \implies \text{FRONT\_RIGHT}$; $x_c > 0.70 \implies \text{REAR\_RIGHT}$; else $\text{RIGHT\_SIDE}$.

---

## 5. Deterministic Severity Rules & Priority Weights

### 5.1 Severity Hierarchy (`DETERMINISTIC_RULE_V1`)

| Severity | Deterministic Criteria | Action & Deductions |
| :--- | :--- | :--- |
| **MINOR** | Superficial scratch with $\alpha < 0.03$<br>Minor dent with $\alpha < 0.03$ | Non-critical cosmetic flaw ($-5$ pts) |
| **MODERATE** | Crack (fracture defect)<br>Broken lamp assembly (`lamp_broken`)<br>Scratch or dent with $0.03 \le \alpha < 0.10$ | Observable structural/lighting defect ($-15$ pts) |
| **SEVERE** | Shattered glass (`glass_shatter`)<br>Flat / deflated tire (`tire_flat`)<br>Large area damage span with $\alpha \ge 0.10$ | Critical component impairment ($-30$ pts) |

### 5.2 Config-Driven Damage Class Evidence Priority

```json
{
  "glass_shatter": 5,
  "tire_flat": 5,
  "lamp_broken": 4,
  "crack": 4,
  "dent": 2,
  "scratch": 1
}
```

---

## 6. Cross-View Reasoning & Cautious Evidence Language

When similar damage classes appear across adjacent viewpoints (e.g., `FRONT` and `FRONT_RIGHT`), the `CrossViewEvidenceService` identifies multi-angle observation patterns.

### Language Enforcement Table

| Prohibited Speculative Assertion | Mandatory CARWISE Evidence Statement |
| :--- | :--- |
| ❌ *"Vehicle was previously crashed."* | ✅ *"Possible repeated visible damage pattern across adjacent views — requires physical verification."* |
| ❌ *"Chassis frame is damaged."* | ✅ *"Visible cosmetic dent observed on front-right fender profile."* |
| ❌ *"Repaired after major collision."* | ✅ *"Observable multi-panel scratch pattern across left flank."* |

---

## 7. Vehicle Condition Score V1

### Formula
$$S_{\text{condition}} = \max\left(0, \min\left(100, 100 - \sum_{i \in \text{Unique Findings}} \Delta_i\right)\right)$$
Where:
- $\Delta_{\text{MINOR}} = 5\text{ pts}$
- $\Delta_{\text{MODERATE}} = 15\text{ pts}$
- $\Delta_{\text{SEVERE}} = 30\text{ pts}$
- **Anti-Destruction Zone Cap:** A single vehicle zone is capped at $\le 40\text{ pts}$ total deduction to prevent localized multiple findings from mathematically wiping out whole-vehicle condition.
- **Duplicate Exclusion:** Deduplicated findings ($\text{IoU} \ge 0.70$) contribute $0\text{ pts}$ to prevent double-counting.

---

## 8. Buyer Assessment Trust Score (Phase 9+ Placeholder)

The Trust Score interface is exposed as a forward-compatible contract:
```json
{
  "trustScore": null,
  "status": "PENDING_TRUST_MODEL",
  "reason": "Trust scoring requires evidence completeness, model confidence calibration, and regional price valuation."
}
```

---

## 9. Verification Summary

- **AI Service Unit Tests:** 30/30 automated pytest tests passing in `ai-service/tests/`.
- **Backend Integration Tests:** 8/8 automated integration tests passing in `backend/tests/evidence_reasoning.test.js`.
- **Frontend Type Safety & Build:** Zero TypeScript errors on `npx tsc --noEmit` and clean Next.js 16 production build.
