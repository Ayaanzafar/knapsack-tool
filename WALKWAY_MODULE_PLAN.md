# Walkway Module — Complete Implementation Plan

Last updated: 2026-03-14

---

## Overview

The Walkway module is a separate calculation and BOM generation tool for solar rooftop walkways.
Walkways are installed in two orientations: **Horizontal** and **Vertical**.
Each project can have multiple rows of each type, mixed freely.

---

## Current Status

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 1 | Homepage — Walkway card enabled | ✅ Done |
| Phase 1 | `CreateWalkwayProjectPage` — project setup with DB | ✅ Done |
| Phase 1 | `WalkwayApp` — preliminary calculation page | ✅ Done |
| Phase 1 | DB schema — `moduleType` on Project + `WalkwayRow` table | ✅ Done |
| Phase 1 | API — `walkwayAPI.getRows` / `syncRows` | ✅ Done |
| Phase 1 | Autosave rows to DB (1.5s debounce) | ✅ Done |
| Phase 2 | BOM Settings (fastener selection, rate, spare%) | 🔲 Pending |
| Phase 2 | `lib/walkwayBomCalculations.js` — BOM formula engine | 🔲 Pending |
| Phase 2 | `WalkwayBOMPage` — BOM view (H + V sections) | 🔲 Pending |
| Phase 2 | `WalkwayBOMPrintPreview` — PDF/print | 🔲 Pending |
| Phase 3 | BOM Sharing & Admin panel support | 🔲 Future |

---

## Phase 1 — Preliminary Calculation (COMPLETE)

### Constants

```
SECTION_LENGTH = 2.01 m  (fixed, one walkway panel = 2.01m)
```

### Preliminary Formulas (per row, then × Qty)

| Output | Formula | Applies To |
|--------|---------|-----------|
| Walkway Sections | `ceil(Length / 2.01)` | H + V |
| L-Cleats | `Sections × 6` | H + V |
| Jointers | `Sections × 2` | H + V |
| Base Rail | `(Sections × 2) + 1` per line | **V only** |

> All values are multiplied by **Qty** (number of walkway lines) to get totals.
> Grand totals are sum across all rows.

### What is Saved to DB

Only raw user inputs per row — derived values recalculated live on frontend:

| Field | Type | Description |
|-------|------|-------------|
| `type` | String `"H"` / `"V"` | Horizontal or Vertical |
| `length` | Decimal | Length in metres |
| `qty` | Integer | Number of walkway lines |

---

## Phase 2 — Walkway BOM Page

### 2.1 BOM Page Layout

When user clicks **"Create BOM"** from `WalkwayApp`, a **BOM Settings step** appears first,
then navigates to `/walkway-bom`.

The BOM page shows **two separate sections on the same page**:

```
┌──────────────────────────────────────────────┐
│  WALKWAY BOM                                 │
│  Project: XYZ  |  Client: ABC  |  ID: 01     │
│  Across Crest: 210m  |  Along Crest: 94m     │
├──────────────────────────────────────────────┤
│  SECTION A — HORIZONTAL WALKWAY              │
│  (rendered only if project has H rows)       │
│                                              │
│  S.No | Description        | Qty  | UoM      │
│   1   | Walkway Section    |  x   | Nos      │
│   2   | Walkway Cleat      |  x   | Nos      │
│   3   | Jointer            |  x   | Nos      │
│   4   | Blind Rivets       |  x   | Nos  ┐   │
│   5   | SDS                |  x   | Nos  ┘ (user-selected fasteners)
│   6   | EPDM Pad           |  x   | Nos      │
├──────────────────────────────────────────────┤
│  SECTION B — VERTICAL WALKWAY                │
│  (rendered only if project has V rows)       │
│                                              │
│  S.No | Description        | Qty  | UoM      │
│   1   | Walkway Section    |  x   | Nos      │
│   2   | Base Rail          |  x   | Nos      │
│   3   | Walkway Cleat      |  x   | Nos      │
│   4   | Jointer            |  x   | Nos      │
│   5   | Rail Nut           |  x   | Nos      │
│   6   | M8×20 Allen Hex Bolt|  x  | Nos      │
│   7   | M8 Plain & Spring  |  x   | Nos      │
│   8   | Blind Rivets       |  x   | Nos  ┐   │
│   9   | SDS                |  x   | Nos  ┘ (user-selected fasteners)
│  10   | EPDM Pad           |  x   | Nos      │
└──────────────────────────────────────────────┘
```

> **Rules:**
> - Only H rows exist → only Section A shown
> - Only V rows exist → only Section B shown
> - Both H + V rows → both sections shown
> - Seam Clamps and Grub Screws are **NOT part of this BOM** (customer-supplied / different scope)
> - Support distance 1000mm is a **printed recommendation note** only, no calculation

---

### 2.2 Confirmed BOM Formulas

#### HORIZONTAL WALKWAY — All Items

| S.No | Item | Material | Formula | UoM |
|------|------|---------|---------|-----|
| 1 | Walkway Section (310mm width, 2010mm) | Magnelis | = Total Sections | Nos |
| 2 | Walkway Cleat (L-Angle, 40mm) | Magnelis | = Total L-Cleats = Sections × 6 | Nos |
| 3 | Jointer (200mm) | Magnelis | = Sections × 2 | Nos |
| 4 | Blind Rivets (4.8×15mm) | Al 5000 | = L-Cleats + (Jointers × 4) | Nos |
| 5 | SDS | — | = L-Cleats + (Jointers × 4) | Nos |
| 6 | EPDM Pad (30×30×2mm) | Al 5001 | = L-Cleats | Nos |

> **Note on EPDM (Horizontal):** EPDM is a rubber pad placed wherever a drill is made.
> For Horizontal, drills are at every L-Cleat position → EPDM = L-Cleats.

> **Note on Blind Rivets vs SDS:** Both use the same formula. User selects which
> fastener(s) to include at BOM generation time (checkbox — one, both, or neither).

---

#### VERTICAL WALKWAY — All Items

| S.No | Item | Material | Formula | UoM |
|------|------|---------|---------|-----|
| 1 | Walkway Section (310mm width, 2010mm) | Magnelis | = Total Sections | Nos |
| 2 | Base Rail (400mm) | Magnelis | = (Sections × 2) + 1 per line, summed | Nos |
| 3 | Walkway Cleat (L-Angle, 40mm) | Magnelis | = Total L-Cleats = Sections × 6 | Nos |
| 4 | Jointer (200mm) | Magnelis | = Sections × 2 | Nos |
| 5 | Rail Nut | Al 6063-T6 | = L-Cleats | Nos |
| 6 | M8×20 Allen Hex Bolt | SS 304 | = L-Cleats | Nos |
| 7 | M8 Plain & Spring Washer | SS 304 | = L-Cleats | Nos |
| 8 | Blind Rivets (4.8×15mm) | Al 5000 | = (Base Rail × 2) + L-Cleats + (Jointers × 4) | Nos |
| 9 | SDS | — | = (Base Rail × 2) + L-Cleats + (Jointers × 4) | Nos |
| 10 | EPDM Pad (30×30×2mm) | Al 5001 | = Base Rail × 2 | Nos |

> **Note on EPDM (Vertical):** For Vertical, Base Rail is present. Each Base Rail holds
> 2 L-Cleats, so there are 2 drill points per Base Rail → EPDM = Base Rail × 2.

> **Note on Blind Rivets (Vertical):** Formula derived from GA drawing — 4 rivets per
> jointer side × 2 sides = 8 per jointer. Plus Base Rail connections and L-Cleat connections.

---

### 2.3 Fastener Selection (BOM Settings Step)

Before generating the BOM, user sees a settings modal/step with:

```
Fastener Options:
  ☑ Blind Rivets (4.8×15mm)    ← checked by default
  ☑ SDS Screws                  ← checked by default

  → Both checked   : both items appear in BOM
  → Only one       : only that item appears
  → Must select at least one
```

Both Blind Rivets and SDS use the **same quantity formula** — selection only controls
whether the line item appears in the BOM output.

---

### 2.4 Spare Parts

```
Spare %        = 0.1% (default, shown in Excel as "0.1%")
Spare Qty      = round up (Base Qty × 0.001)
Total Qty      = Base Qty + Spare Qty
```

Spare is applied to **all items** in both sections.

---

### 2.5 Weight & Cost Calculation

Each item row shows:

| Column | Formula |
|--------|---------|
| Wt/pc (kg) | from item master (fixed per item type) |
| Total Weight | = Total Qty × Wt/pc |
| Rate/kg (INR) | user input at BOM generation time (varies per project) |
| Rate/pc | = Wt/pc × Rate/kg |
| Cost (INR) | = Total Qty × Rate/pc |

**Profile & Weight Data (to be added to DB later):**

| Item | Profile Name | Material | Length (mm) | Wt/Running Metre (kg/m) | Wt/pc (kg) |
|------|-------------|---------|------------|------------------------|-----------|
| Walkway Section 310mm | 310x35x10x0.9mm | Magnelis | 2010 | 3.80 | **7.638** |
| Walkway Cleat (L-Angle) | LA 35x45x1.2 | Magnelis | 40 | 1.2 | **0.048** |
| Jointer | LA 35x45x2 | Magnelis | 200 | 1.2 | **0.24** |
| Base Rail | Strut 41x41x1.2mm | Magnelis | 400 | 1.25 | **0.5** |
| Rail Nut | MA 01 | Al 6063-T6 | 23 | 0.67 | **0.0154** |

**Fasteners (no weight — costed by Rate/pc):**

| Item | Material | Rate/pc (INR) |
|------|---------|--------------|
| Blind Rivets 4.8×15mm | Al 5000 | 1.2 |
| EPDM Pad 30×30×2mm | Al 5001 | 3.0 |
| M8×20 Allen Hex Bolt | SS 304 | 10.0 |
| M8 Plain & Spring Washer | SS 304 | 5.0 |
| SDS Screws | — | ❓ |

> **Note:** These profiles are NOT yet in the DB. To be added to `sunrack_profiles` and
> `fasteners` tables in a future DB migration. Until then, weights are hardcoded in
> `walkwayBomCalculations.js` as constants.

**Totals:**
```
Total Cost  = sum of all item costs (H section + V section)
Cost/RM     = Total Cost / Total Walkway Length (metres)
```

---

### 2.6 BOM Settings Modal — All Inputs

When user clicks "Create BOM" from `WalkwayApp`:

| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| Aluminum Rate (INR/kg) | Number input | — | User enters per project |
| Spare % | Number input | 0.1 | Applied to all items |
| ☑ Blind Rivets | Checkbox | checked | Include in BOM? |
| ☑ SDS Screws | Checkbox | checked | Include in BOM? |

---

### 2.7 DB Approach for BOM (Phase 2)

**No new DB tables needed.**

Reuse existing `SavedBom` model — store walkway BOM as JSON in `bomData` with a
`moduleType: 'WALKWAY'` flag inside the JSON. This keeps sharing, print, and admin
flows reusable without schema changes.

---

### 2.8 Frontend Files to Create (Phase 2)

| File | Purpose |
|------|---------|
| `src/lib/walkwayBomCalculations.js` | Pure formula engine — takes rows[], settings → returns BOM items |
| `src/pages/WalkwayBOMPage.jsx` | BOM view with H section + V section + settings modal |
| `src/pages/WalkwayBOMPrintPreview.jsx` | Print/PDF preview page |

### 2.9 Routes to Add (Phase 2)

| Route | Component |
|-------|-----------|
| `/walkway-bom` | `WalkwayBOMPage` |
| `/walkway-bom/print-preview` | `WalkwayBOMPrintPreview` |

### 2.10 API to Add (Phase 2)

```
POST  /api/projects/:projectId/walkway-bom          → generate + save BOM snapshot
GET   /api/projects/:projectId/walkway-bom          → get latest saved BOM
PUT   /api/projects/:projectId/walkway-bom          → update saved BOM
```

Reuse existing `SavedBom` table (no new backend model needed).

---

## Phase 3 — BOM Sharing & Admin (Future)

- Share walkway BOM via token (reuse existing `BomShare` system)
- Admin can view walkway BOMs in AdminPanel
- Walkway projects visible in "Shared with Me"

---

## Items NOT in Scope (Confirmed)

| Item | Reason |
|------|--------|
| Seam Clamps | Standing Seam Flush Mount only — customer-supplied / different scope |
| M8×20 Allen Grub Screw | Same as above |
| M8×30 Allen Grub Screw | Same as above |
| M4 Hex Fastener Set | Not in formulas provided — out of scope |
| Support distance (1000mm) | Recommendation note only — printed on BOM, no calculation |

---

## Complete File Map

```
Frontend:
src/pages/
  ├── CreateWalkwayProjectPage.jsx      ✅ Done
  ├── WalkwayApp.jsx                    ✅ Done
  ├── WalkwayBOMPage.jsx                🔲 Phase 2
  └── WalkwayBOMPrintPreview.jsx        🔲 Phase 2

src/lib/
  └── walkwayBomCalculations.js         🔲 Phase 2

src/services/
  └── api.js  (walkwayAPI added)        ✅ Done

src/Router.jsx                          ✅ Done (Phase 1 routes)
                                        🔲 Phase 2 routes to add

Backend:
backend/src/
  ├── services/walkwayService.js        ✅ Done
  ├── controllers/walkwayController.js  ✅ Done
  ├── routes/walkwayRoutes.js           ✅ Done
  └── server.js  (routes registered)    ✅ Done

backend/prisma/schema.prisma
  ├── Project.moduleType                ✅ Done
  └── WalkwayRow model                  ✅ Done
```

---

## Open Items Before Phase 2 Build Starts

| # | Item | Status |
|---|------|--------|
| 1 | Profile weights confirmed — hardcoded in calc engine until added to DB | ✅ Done |
| 2 | BOM editable after generation (same as Long Rail BOM) | ✅ Confirmed |
| 3 | All formulas confirmed | ✅ Done |
| 4 | BOM layout (2 sections on same page) confirmed | ✅ Done |
| 5 | Fastener selection approach (checkbox) confirmed | ✅ Done |
| 6 | Spare = 0.1% confirmed | ✅ Done |
| 7 | Seam Clamps / Grub Screws out of scope confirmed | ✅ Done |





Quick summary of what's hardcoded as constants in walkwayBomCalculations.js:

  // Profiles (Magnelis)
  Walkway Section  → 7.638 kg/pc   (310x35x10x0.9mm, 2010mm)
  Walkway Cleat    → 0.048 kg/pc   (LA 35x45x1.2, 40mm)
  Jointer          → 0.24  kg/pc   (LA 35x45x2, 200mm)
  Base Rail        → 0.5   kg/pc   (Strut 41x41x1.2mm, 400mm)
  Rail Nut         → 0.0154 kg/pc  (MA 01, 23mm)

  // Fasteners (Rate/pc only, no weight)
  Blind Rivets     → 1.2  INR/pc
  EPDM Pad         → 3.0  INR/pc
  M8×20 Bolt       → 10.0 INR/pc
  M8 Spring Washer → 5.0  INR/pc
