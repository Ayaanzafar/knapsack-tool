# Walkway BOM — Cost Calculation Logic

**Document purpose:** Explain exactly how quantities and costs are calculated in the Walkway BOM, so it can be reviewed and communicated to management or clients.

---

## Overview

There are **three types of items** in the BOM, each using a different costing method:

| Item Type | Material | Examples | How Cost is Calculated |
|-----------|---------|---------|----------------------|
| **Magnelis Profiles** | Magnelis (zinc-coated steel) | Walkway Section, L-Cleat, Jointer, Base Rail | `Total Weight × Magnelis Rate/kg` |
| **Aluminium Profiles** | Al 6063-T6 | Rail Nut | `Total Weight × Aluminium Rate/kg` |
| **Fasteners & Pads** | Al 5000, Al 5001, SS 304 | Blind Rivets, SDS, EPDM Pad, M8 Bolt, M8 Washer | Fixed Rate/pc (not weight-based) |

> **Important:** Magnelis and Aluminium are different materials with different market rates.
> The BOM page has **two separate rate inputs** — one for each.

---

## Step 1 — Quantity Calculation (per row)

The user enters rows with three inputs: **Type (H/V)**, **Length (metres)**, **Qty (number of lines)**.

```
Sections per line  = ⌈ Length ÷ 2.01 ⌉        (ceiling division — 2.01m is one walkway panel)
L-Cleats per line  = Sections × 6
Jointers per line  = Sections × 2
Base Rail per line = (Sections × 2) + 1        (Vertical only)

Total Sections  = Sections per line  × Qty
Total L-Cleats  = L-Cleats per line  × Qty
Total Jointers  = Jointers per line  × Qty
Total Base Rail = Base Rail per line × Qty     (Vertical only)
```

Grand totals are **summed across all rows** of the same type (H or V).

---

## Step 2 — Spare Quantity

A spare percentage (default **0.1%**) is added to every item to account for breakage/wastage.

```
Spare Qty  = ⌈ Base Qty × (Spare% ÷ 100) ⌉    (always rounded UP)
Total Qty  = Base Qty + Spare Qty
```

> Example: Base Qty = 500, Spare = 0.1%
> Spare Qty = ⌈ 500 × 0.001 ⌉ = ⌈ 0.5 ⌉ = **1**
> Total Qty = **501**

---

## Step 3 — Cost per Item

### A) Structural Profiles — Weight-Based Costing

These items are made of Magnelis or Al 6063-T6. Their cost is simply:

```
Total Weight (kg) = Total Qty × Wt/pc
Cost (₹)          = Total Weight × Al Rate (₹/kg)
```

The **Rate/pc** column shown in the BOM is just a derived display value (`Wt/pc × Al Rate`) — it does not change the cost formula. Both expressions are mathematically identical:

```
Total Weight × Al Rate
= (Total Qty × Wt/pc) × Al Rate
= Total Qty × (Wt/pc × Al Rate)
= Total Qty × Rate/pc   ← same result
```

So for all Magnelis and Al 6063-T6 items: **the only inputs that matter are Total Weight and Al Rate.**

**Magnelis items** (use Magnelis Rate):

| Item | Profile | Length | Wt/pc |
|------|---------|--------|-------|
| Walkway Section | 310×35×10×0.9mm | 2010 mm | **7.638 kg** |
| Walkway Cleat (L-Angle) | LA 35×45×1.2 | 40 mm | **0.048 kg** |
| Jointer | LA 35×45×2 | 200 mm | **0.240 kg** |
| Base Rail | Strut 41×41×1.2mm | 400 mm | **0.500 kg** |

**Aluminium items** (use Aluminium Rate):

| Item | Profile | Length | Wt/pc |
|------|---------|--------|-------|
| Rail Nut | MA 01 (Al 6063-T6) | 23 mm | **0.0154 kg** |

> **Example:** 100 Walkway Sections, Magnelis Rate = ₹180/kg
> Total Weight = 100 × 7.638 = 763.8 kg
> Cost = 763.8 × ₹180 = **₹1,37,484**

---

### B) Fasteners & Pads — Fixed Rate per Piece

These small items are not priced by weight. Each has a **fixed market Rate/pc**:

| Item | Material | Fixed Rate/pc |
|------|---------|--------------|
| Blind Rivets (4.8×15mm) | Al 5000 | **₹1.20 / pc** |
| EPDM Pad (30×30×2mm) | Al 5001 | **₹3.00 / pc** |
| M8×20 Allen Hex Bolt | SS 304 | **₹10.00 / pc** |
| M8 Plain & Spring Washer | SS 304 | **₹5.00 / pc** |
| SDS Screws | — | *(rate not set — shows —)* |

```
Cost (₹) = Total Qty × Fixed Rate/pc
```

> These items have **no weight column** in the BOM — the Al Rate does not affect them.

---

## Step 4 — Fastener Quantities

### Horizontal Walkway

```
Blind Rivets / SDS = L-Cleats + (Jointers × 4)
EPDM Pad           = L-Cleats
```

> Reasoning: Each L-Cleat position is drilled once → 1 rivet/screw + 1 EPDM pad per cleat.
> Each Jointer has 4 rivet/screw holes (2 per side × 2 sides) → Jointers × 4.

### Vertical Walkway

```
Blind Rivets / SDS = (Base Rail × 2) + L-Cleats + (Jointers × 4)
EPDM Pad           = Base Rail × 2
```

> Reasoning: Each Base Rail has 2 drill points (one at each end connecting to the structure)
> → 2 rivets/screws and 2 EPDM pads per Base Rail.
> L-Cleats and Jointers follow the same logic as Horizontal.

---

## Step 5 — Project Totals

```
Total Cost   = Sum of Cost(₹) for all items in Section A + Section B
Total Length = Sum of (Length × Qty) for all rows
Cost / RM    = Total Cost ÷ Total Length
```

**Cost/RM** (Cost per Running Metre) is a normalised metric used to compare projects of different sizes.

---

## Summary — Which items use which cost method

| Item | Section | Material | Cost Method | Driver |
|------|---------|---------|-------------|--------|
| Walkway Section | H + V | Magnelis | Total Weight × **Magnelis Rate** | 7.638 kg/pc |
| Walkway Cleat | H + V | Magnelis | Total Weight × **Magnelis Rate** | 0.048 kg/pc |
| Jointer | H + V | Magnelis | Total Weight × **Magnelis Rate** | 0.240 kg/pc |
| Base Rail | V only | Magnelis | Total Weight × **Magnelis Rate** | 0.500 kg/pc |
| Rail Nut | V only | Al 6063-T6 | Total Weight × **Aluminium Rate** | 0.0154 kg/pc |
| Blind Rivets | H + V | Al 5000 | Fixed Rate/pc | ₹1.20/pc |
| SDS Screws | H + V | — | Fixed Rate/pc | ₹— (not set) |
| EPDM Pad | H + V | Al 5001 | Fixed Rate/pc | ₹3.00/pc |
| M8×20 Allen Hex Bolt | V only | SS 304 | Fixed Rate/pc | ₹10.00/pc |
| M8 Plain & Spring Washer | V only | SS 304 | Fixed Rate/pc | ₹5.00/pc |

---

## Worked Example

**Inputs:** 1 Horizontal row — Length = 60 m, Qty = 2 lines, Al Rate = ₹220/kg, Spare = 0.1%

**Step 1 — Quantities:**
```
Sections per line  = ⌈ 60 ÷ 2.01 ⌉ = ⌈ 29.85 ⌉ = 30
L-Cleats per line  = 30 × 6 = 180
Jointers per line  = 30 × 2 = 60

Total Sections  = 30 × 2 = 60
Total L-Cleats  = 180 × 2 = 360
Total Jointers  = 60 × 2 = 120
Blind Rivets/SDS = 360 + (120 × 4) = 360 + 480 = 840
EPDM Pads        = 360
```

**Step 2 — Spare (0.1%):**
```
Spare on 60 Sections  = ⌈ 60 × 0.001 ⌉ = 1   → Total = 61
Spare on 360 L-Cleats = ⌈ 360 × 0.001 ⌉ = 1  → Total = 361
Spare on 120 Jointers = ⌈ 120 × 0.001 ⌉ = 1  → Total = 121
Spare on 840 Rivets   = ⌈ 840 × 0.001 ⌉ = 1  → Total = 841
Spare on 360 EPDM     = ⌈ 360 × 0.001 ⌉ = 1  → Total = 361
```

**Step 3 — Cost:**
```
Walkway Section : 61 × (7.638 × 220) = 61 × 1680.36  = ₹1,02,501.96
L-Cleat         : 361 × (0.048 × 220) = 361 × 10.56  = ₹3,812.16
Jointer         : 121 × (0.240 × 220) = 121 × 52.80  = ₹6,388.80
Blind Rivets    : 841 × 1.20                          = ₹1,009.20
EPDM Pad        : 361 × 3.00                          = ₹1,083.00
                                              ──────────────────────
Total Cost                                            ≈ ₹1,14,795
```

**Cost / RM:**
```
Total Length = 60 m × 2 lines = 120 m
Cost / RM    = ₹1,14,795 ÷ 120 = ≈ ₹956.63 / RM
```

---

*Generated from `src/lib/walkwayBomCalculations.js`*
