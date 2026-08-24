# CARWISE — Repair Cost Estimation & Market Valuation (Phase 10)

> **Document Version:** 1.0.0
> **Status:** Production Specification & Architecture
> **Rule Level:** Deterministic, Transparent, Market-Aware Cost Modeling (INR)

---

## 1. System Objective & Academic Boundary

The **CARWISE Repair Cost Estimation Engine (`REPAIR_V1`)** translates normalized visual damage detections into defensible, market-aware repair cost ranges (**INR ₹**).

### Fundamental Principles:
1. **Ranges, Never False Point Estimates:** Repair costs are always expressed as `[minEstimatedCost, maxEstimatedCost]` with an expected `median`, never fake exact figures.
2. **Evidence Traceability:** Every repair cost line-item links directly to an upstream `evidenceId`, `zone`, `damageClass`, and `severity`.
3. **Market Scaling:** Baseline figures scale deterministically by vehicle segment, regional labor tiers in India, and structural panel complexity.
4. **Labor Synergy:** Multi-panel painting jobs incorporate paint-booth batching discounts ($10\% - 15\%$) to avoid double-charging setup labor.

---

## 2. End-to-End Estimation Pipeline

```
              [ Normalized Evidence Findings (Phase 8) ]
                                  │
                                  ▼
                     [ Repair Action Mapper ]
        (e.g., dent + MODERATE ──► DENT_PULLING_BODYWORK_AND_PAINT)
                                  │
                                  ▼
                   [ Baseline Cost Lookup (INR) ]
                    (BaseMin: ₹3,000, BaseMax: ₹7,500)
                                  │
                                  ▼
                     [ Multiplier Engine ]
            F_segment (1.00 - 2.50)  ×  F_region (0.85 - 1.20)  ×  F_zone (1.00 - 1.25)
                                  │
                                  ▼
                 [ Itemized Cost Range Calculator ]
                 MinCost_i = BaseMin_i × F_combined
                 MaxCost_i = BaseMax_i × F_combined
                                  │
                                  ▼
                [ Multi-Panel Synergy Aggregator ]
            (Batching discount: 2 items = 10%, ≥3 items = 15%)
                                  │
                                  ▼
              ┌───────────────────────────────────────┐
              │ RepairCostAssessmentReport            │
              │  - totalEstimatedRange (Min, Max, Med)│
              │  - itemizedRepairs                    │
              │  - synergyDiscountApplied             │
              │  - limitations & disclaimers          │
              └───────────────────────────────────────┘
```

---

## 3. Repair Action Taxonomy

| Damage Class | Severity | Recommended Action Code | Action Name |
| :--- | :--- | :--- | :--- |
| `scratch` | `MINOR` | `RUBBING_COMPOUNDING_OR_SPOT_PAINT` | Rubbing, Compounding & Spot Polish |
| `scratch` | `MODERATE` | `PANEL_TOUCHUP_AND_CLEARCOAT` | Spot Sanding & Clearcoat Blending |
| `scratch` | `SEVERE` | `FULL_PANEL_REPAINT` | Full Panel Refinishing & Oven Bake |
| `dent` | `MINOR` | `PAINTLESS_DENT_REMOVAL_PDR` | Paintless Dent Removal (PDR) |
| `dent` | `MODERATE` | `DENT_PULLING_BODYWORK_AND_PAINT` | Dent Pulling Bodywork & Repaint |
| `dent` | `SEVERE` | `PANEL_REPLACEMENT_OR_MAJOR_BODYWORK` | Major Panel Overhaul / Replacement |
| `crack` | `MODERATE`/`SEVERE` | `PLASTIC_WELDING_OR_PART_REPLACEMENT` | Plastic Welding / Bumper Repair |
| `lamp_broken` | Any | `HEADLAMP_OR_TAILLAMP_ASSEMBLY_REPLACEMENT` | Lamp Assembly Replacement |
| `glass_shatter` | Any | `WINDSHIELD_OR_GLASS_REPLACEMENT` | Automotive Glass Replacement |
| `tire_flat` | Any | `TYRE_REPLACEMENT_OR_PUNCTURE_OVERHAUL` | Radial Tyre Replacement & Balancing |

---

## 4. Base Cost Configuration Table (Tier 2 Hatchback Baseline)

```json
{
  "RUBBING_COMPOUNDING_OR_SPOT_PAINT": { "min": 500, "max": 1500 },
  "PANEL_TOUCHUP_AND_CLEARCOAT": { "min": 1500, "max": 3500 },
  "FULL_PANEL_REPAINT": { "min": 3000, "max": 6000 },
  "PAINTLESS_DENT_REMOVAL_PDR": { "min": 1000, "max": 2500 },
  "DENT_PULLING_BODYWORK_AND_PAINT": { "min": 3000, "max": 7500 },
  "PANEL_REPLACEMENT_OR_MAJOR_BODYWORK": { "min": 7500, "max": 18000 },
  "PLASTIC_WELDING_OR_PART_REPLACEMENT": { "min": 2000, "max": 6000 },
  "HEADLAMP_OR_TAILLAMP_ASSEMBLY_REPLACEMENT": { "min": 2500, "max": 8500 },
  "WINDSHIELD_OR_GLASS_REPLACEMENT": { "min": 4500, "max": 12000 },
  "TYRE_REPLACEMENT_OR_PUNCTURE_OVERHAUL": { "min": 3500, "max": 8000 }
}
```

---

## 5. Scaling Multipliers

### 5.1 Vehicle Segment Factor ($F_{\text{segment}}$)
- `HATCHBACK` / `ENTRY` (e.g. Alto, WagonR, Swift, i10, Tiago): **$1.00$**
- `SEDAN` / `COMPACT_SUV` (e.g. Nexon, Brezza, Venue, Amaze, Dzire, Punch): **$1.25$**
- `MID_SUV` / `PREMIUM_SEDAN` (e.g. Creta, Seltos, City, Verna, Scorpio, Harrier): **$1.60$**
- `LUXURY` / `EXECUTIVE` (e.g. Fortuner, BMW, Mercedes, Audi, Volvo): **$2.50$**

### 5.2 Regional Labor Tier Factor ($F_{\text{region}}$)
- `TIER_1_METRO` (Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata): **$1.20$**
- `TIER_2` (Pune, Ahmedabad, Coimbatore, Jaipur, Lucknow, Chandigarh, Kochi): **$1.00$**
- `TIER_3_RURAL` (District headquarters and semi-urban / rural areas): **$0.85$**

### 5.3 Zone Complexity Factor ($F_{\text{zone}}$)
- `FRONT`, `REAR` (Fascia / bumper covers): **$1.00$**
- `FRONT_LEFT`, `FRONT_RIGHT`, `REAR_LEFT`, `REAR_RIGHT` (Quarter panels / fenders): **$1.15$**
- `LEFT_SIDE`, `RIGHT_SIDE` (Doors / running board / pillars / roof): **$1.25$**

---

## 6. Multi-Panel Paint Synergy Discount

When multiple panels require bodywork and refinishing in a single repair order, spray-booth prep and clearcoat batching produce labor efficiencies:
- **1 Item:** $0\%$ discount ($\text{Multiplier} = 1.00$)
- **2 Items:** $10\%$ discount on combined raw sum ($\text{Multiplier} = 0.90$)
- **3+ Items:** $15\%$ discount on combined raw sum ($\text{Multiplier} = 0.85$)

$$\text{FinalMin} = \text{round}\left(\sum_i \text{ItemMin}_i \times \text{DiscountMult}\right)$$
$$\text{FinalMax} = \text{round}\left(\sum_i \text{ItemMax}_i \times \text{DiscountMult}\right)$$
$$\text{FinalMedian} = \text{round}\left(\frac{\text{FinalMin} + \text{FinalMax}}{2}\right)$$

---

## 7. Cost Confidence Rating

| Level | Condition |
| :--- | :--- |
| **`HIGH`** | Model detection confidence $\ge 0.70$ and IQA `PASS`. |
| **`MODERATE`** | Model detection confidence in $[0.50, 0.70)$ or IQA `WARN`. |
| **`LOW`** | Model detection confidence $< 0.50$ or multiple IQA warnings. |

---

## 8. Academic Scope Disclaimers

The CARWISE repair cost estimate does **not**:
1. Guarantee that dealership service centers will honor the estimate (authorized OEM workshops typically charge 30%–60% more due to brand part markups).
2. Account for concealed mechanical defects, frame unibody distortion, or electrical harness damage undiscoverable without vehicle teardown.
3. Serve as an insurance claim settlement quote.
