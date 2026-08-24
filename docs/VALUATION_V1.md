# CARWISE — Fair-Market Vehicle Valuation & Asking-Price Assessment (Phase 11)

> **Document Version:** 1.0.0
> **Status:** Production Specification & Architecture
> **Rule Level:** Transparent, Deterministic, Evidence-Adjusted Market Valuation (INR)

---

## 1. System Objective & Academic Boundary

The **CARWISE Vehicle Valuation Engine (`VALUATION_V1`)** answers the fundamental buyer question:

> *"Is the seller's asking price reasonable relative to an evidence-adjusted fair-market range?"*

### Fundamental Principles:
1. **Never Produce Fake-Precise Point Estimates:** Real-world vehicle resale values are inherently distributed. Valuation is always output as an estimated fair-market range (`[min, max]`) with an analytical `midpoint`.
2. **Transparent, Additive Adjustments:** Every adjustment (Age Depreciation, Mileage Usage, Cosmetic Condition, Repair Burden) is individually calculated, attributed, and explained.
3. **Evidence-Gated Valuation:** A vehicle with low assessment trust ($\text{Trust Score} < 50$ or $\text{Trust Band} = \text{INSUFFICIENT\_EVIDENCE}$) **cannot** receive a high-confidence market valuation.
4. **Separated Market Reference Layer:** Market baseline figures are decoupled from the evaluation engine, permitting future plug-and-play integration with verified live data sources without rewriting business logic.

---

## 2. End-to-End Valuation Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│ Input Vector: Vehicle Specs + Condition Score + Trust + Repair Burden  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       [ Step 1: Evidence & Trust Gating Check (Trust Score ≥ 50) ]
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
          [ Pass Gating ]                    [ Fail Gating ]
                  │                                   │
                  ▼                                   ▼
   [ Step 2: Reference Baseline Price ]     [ INSUFFICIENT_EVIDENCE ]
                  │                          (Valuation Withheld)
                  ▼
   [ Step 3: Age & Depreciation Schedule ]
   (Year 1: 15%, Year 2: 25%, Year 3: 35%, Year 4: 43%, Year 5: 50%...)
                  │
                  ▼
   [ Step 4: Mileage Usage Adjustment ]
   (Benchmark: 12,000 km/year, ±1.2% per 10,000 excess/deficit km)
                  │
                  ▼
   [ Step 5: Condition Score Adjustment ]
   (Benchmark: 85.0/100, cosmetic condition delta ±0.25% - 0.35%/point)
                  │
                  ▼
   [ Step 6: Immediate Repair Cost Burden Deduction ]
   (-100% of Phase 10 Median Estimated Repair Cost)
                  │
                  ▼
   [ Step 7: Fair Market Value Range Construction ]
   (Midpoint ± 4% Fair Range: [FairMin, FairMax])
                  │
                  ▼
   [ Step 8: Asking-Price Position & Premium/Discount Classification ]
   (BELOW_FAIR_RANGE | FAIRLY_PRICED | ABOVE_FAIR_RANGE)
```

---

## 3. Reference Market Benchmark Dataset

Reference ex-showroom benchmark prices (INR) represent academic baseline launch figures for standard trims (2020–2025):

| Make | Model | Benchmark Ex-Showroom New Price (INR) |
| :--- | :--- | :--- |
| **Maruti** | Swift | ₹7,20,000 |
| **Maruti** | Baleno | ₹8,00,000 |
| **Maruti** | Dzire | ₹7,80,000 |
| **Maruti** | Brezza | ₹9,80,000 |
| **Maruti** | Alto | ₹4,50,000 |
| **Hyundai** | Creta | ₹13,50,000 |
| **Hyundai** | Venue | ₹9,50,000 |
| **Hyundai** | i20 | ₹8,20,000 |
| **Tata** | Nexon | ₹10,20,000 |
| **Tata** | Punch | ₹7,50,000 |
| **Tata** | Harrier | ₹18,50,000 |
| **Mahindra** | Scorpio / Scorpio-N | ₹16,50,000 |
| **Mahindra** | XUV700 | ₹18,50,000 |
| **Mahindra** | Thar | ₹14,50,000 |
| **Honda** | City | ₹13,50,000 |
| **Toyota** | Fortuner | ₹38,00,000 |
| **Toyota** | Innova / Hycross | ₹22,00,000 |

*If a model is unlisted, the engine falls back to calibrated segment averages (`HATCHBACK`: ₹7.0L, `SEDAN`/`COMPACT_SUV`: ₹10.0L, `MID_SUV`: ₹15.0L, `LUXURY`: ₹45.0L) or assigns status `LIMITED_MARKET_DATA`.*

---

## 4. Depreciation Schedule ($D_{\text{age}}$)

$$\text{Age} = \max(0, \text{ReferenceYear} - \text{Year})$$

| Vehicle Age ($A$) | Depreciation Percentage ($D_{\text{age}}$) |
| :--- | :--- |
| **0 Years (Current Year)** | $8\%$ (Showroom drive-off) |
| **1 Year** | $15\%$ |
| **2 Years** | $25\%$ |
| **3 Years** | $35\%$ |
| **4 Years** | $43\%$ |
| **5 Years** | $50\%$ |
| **6 Years** | $56\%$ |
| **7 Years** | $62\%$ |
| **8 Years** | $68\%$ |
| **$\ge 9$ Years** | $\min(80\%, 68\% + (A - 8) \times 4\%)$ |

$$\text{BaseDepreciated} = P_{\text{base}} \times (1 - D_{\text{age}})$$

---

## 5. Mileage Usage Adjustment ($\Delta_{\text{mileage}}$)

- **Expected Usage:** $E_{\text{km}} = \max(1, A) \times 12,000\text{ km/year}$.
- **Excess Mileage:** $\Delta_{\text{km}} = \text{MileageKm} - E_{\text{km}}$.
- **Adjustment Factor:**
  $$\text{MileageDeltaPct} = \begin{cases} \max\left(-15.0\%, -\frac{\Delta_{\text{km}}}{10,000} \times 1.2\%\right) & \text{if } \Delta_{\text{km}} > 0 \\ \min\left(+8.0\%, -\frac{\Delta_{\text{km}}}{10,000} \times 1.0\%\right) & \text{if } \Delta_{\text{km}} \le 0 \end{cases}$$
$$\Delta_{\text{mileage}} = \text{round}\left(\text{BaseDepreciated} \times \frac{\text{MileageDeltaPct}}{100}\right)$$

---

## 6. Physical Condition Adjustment ($\Delta_{\text{condition}}$)

- **Condition Benchmark:** $S_{\text{benchmark}} = 85.0 / 100$.
- **Condition Delta:** $\Delta_{\text{score}} = S_{\text{condition}} - 85.0$.
- **Adjustment Factor:**
  $$\text{ConditionDeltaPct} = \begin{cases} \min\left(+4.0\%, \Delta_{\text{score}} \times 0.25\%\right) & \text{if } \Delta_{\text{score}} \ge 0 \\ \max\left(-18.0\%, \Delta_{\text{score}} \times 0.35\%\right) & \text{if } \Delta_{\text{score}} < 0 \end{cases}$$
$$\Delta_{\text{condition}} = \text{round}\left(\text{BaseDepreciated} \times \frac{\text{ConditionDeltaPct}}{100}\right)$$

---

## 7. Repair Cost Burden Adjustment ($\Delta_{\text{repair}}$)

$$\Delta_{\text{repair}} = - \text{RepairMedianCost}$$
*Derived directly from Phase 10 `repairCostAssessment.totalEstimatedRange.median`.*

---

## 8. Fair Market Range Construction & Asking-Price Classification

$$\text{MidpointFairValue} = \max(50,000, \text{round}(\text{BaseDepreciated} + \Delta_{\text{mileage}} + \Delta_{\text{condition}} + \Delta_{\text{repair}}))$$
$$\text{FairMin} = \text{round}(\text{MidpointFairValue} \times 0.96)$$
$$\text{FairMax} = \text{round}(\text{MidpointFairValue} \times 1.04)$$

### Classification Rules:
- $\text{AskingPrice} < \text{FairMin} \implies$ **`BELOW_FAIR_RANGE`** (Discount = $\text{FairMin} - \text{AskingPrice}$).
- $\text{FairMin} \le \text{AskingPrice} \le \text{FairMax} \implies$ **`FAIRLY_PRICED`**.
- $\text{AskingPrice} > \text{FairMax} \implies$ **`ABOVE_FAIR_RANGE`** (Premium = $\text{AskingPrice} - \text{FairMax}$).

---

## 9. Trust Score Gating Constraints

| Assessment Trust Score | Valuation Status | Fair Value Output |
| :--- | :--- | :--- |
| **$\ge 80$ (`HIGH_CONFIDENCE`)** | Evaluated (HIGH) | Full `[FairMin, FairMax]` range |
| **$65 - 79$ (`MODERATE_CONFIDENCE`)** | Evaluated (MODERATE) | Full `[FairMin, FairMax]` range |
| **$50 - 64$ (`PROCEED_WITH_CAUTION`)** | Evaluated (LOW) | Full `[FairMin, FairMax]` with warning |
| **$< 50$ (`INSUFFICIENT_EVIDENCE`)** | **`INSUFFICIENT_EVIDENCE`** | **`null` (Valuation Withheld)** |

---

## 10. Scope Limitations & Disclaimers

1. **RTO & Transfer Costs:** Estimates reflect vehicle intrinsic fair market value and exclude state-specific lifetime road taxes, re-registration fees, or hypothecation termination charges.
2. **Ownership & Service History:** Real-world prices vary based on the number of registered owners ($1^{\text{st}}$ vs $2^{\text{nd}}+$ owner typically has a 7%–12% price divergence) and authorized dealership service logbooks.
3. **Physical Inspection Pre-Requisite:** Concealed drivetrain wear, battery health (for EVs/hybrids), or chassis frame damage cannot be factored in without physical examination.
