# Custom BOM - Progress Tracker

## Status: IN PROGRESS

---

## What's Been Built

### Backend

#### 1. Database
- New table `custom_boms` added to `backend/prisma/schema.prisma` via `db push`
- Fields: `id`, `project_id`, `module_wp`, `spare_percent`, `ss304_rate`, `al6063_rate`, `t6_rate`, `gi_rate`, `buildings` (JSON), `created_at`, `updated_at`
- `Project` model updated with `customBom` relation
- **`module_wp` and `spare_percent` columns added** — requires `npx prisma db push` in backend if not already done

#### 2. Service — `backend/src/services/customBomService.js`
- Uses raw SQL (`prisma.$queryRaw` / `prisma.$executeRaw`) to avoid Prisma client regeneration dependency
- `getByProjectId(projectId)` — fetches or returns empty default (includes moduleWp, sparePercent)
- `upsert(projectId, data)` — insert or update (includes moduleWp, sparePercent)

#### 3. Controller — `backend/src/controllers/customBomController.js`
- `GET /api/custom-bom/:projectId` → calls `getByProjectId`
- `PUT /api/custom-bom/:projectId` → calls `upsert`

#### 4. Routes — `backend/src/routes/customBomRoutes.js`
- Registered in `backend/src/server.js` as `app.use('/api/custom-bom', customBomRoutes)`

#### 5. Bug Fix in `backend/src/routes/bomRoutes.js`
- `GET /api/bom/master-items` was commented out — fixed (now active)

---

### Frontend

#### 1. `knapsack-front/src/services/api.js`
- Added `customBomAPI`:
  - `get(projectId)` → `GET /api/custom-bom/:projectId`
  - `save(projectId, data)` → `PUT /api/custom-bom/:projectId`

#### 2. `knapsack-front/src/pages/CreateCustomBomProjectPage.jsx`
- After project creation → navigates to `/custom-bom/app`
- After opening existing project → navigates to `/custom-bom/app`

#### 3. `knapsack-front/src/pages/CustomBOMPage.jsx` — Main BOM editor

##### Rates & Params Bar
- 6 inline pill-style inputs: **Module Wp**, **Spare %**, SS 304 (₹/kg), Al 6063 (₹/kg), T6 (₹/kg), GI (₹/kg)
- Changing any material rate → recalculates all rows instantly
- Changing Spare % → recalculates all rows instantly (spareQty, finalQty, RM, Wt, Cost)

##### Building Tabs
- Add / remove buildings
- **Whole tab is clickable** to switch (no input blocking clicks anymore)
- **Right-click on tab** → context menu with Rename and Duplicate options
  - Uses existing `TabContextMenu` and `RenameTabDialog` components (same as Long Rail)

##### BOM Table — 3-row yellow header (like Long Rail)
- Row 1: Project name | "Spare" | "Weight Calculation and Cost Calculation"
- Row 2: Building name | spare% | material rates display
- Row 3: Column labels

##### BOM Table Columns
| Column | Notes |
|---|---|
| S.N | Serial number |
| Profile | Image from `sunrack_profiles.profile_image` |
| Sunrack Code | Item code |
| Item Description | Generic name + description (fixed width `w-40`) |
| Material | Editable dropdown (SS 304, Al 6063, T6, GI) |
| Length (mm) | Editable; hidden/greyed for fasteners |
| UoM | From master items catalog |
| ░ separator ░ | |
| Spare Qty | `ceil(qty × spare% / 100)` — green bg |
| Final Qty | `qty + spareQty` — purple bg |
| ░ separator ░ | |
| Wt/RM (kg/m) | Design weight from profile |
| RM (m) | `finalQty × length / 1000` |
| Wt (kg) | `RM × Wt/RM` |
| Rate (₹/kg) | Material rate; `—` for fasteners |
| Rate/Piece (₹) | Cost per piece; `—` for profiles — blue bg |
| Cost (₹) | Profiles: `Wt × rate`; Fasteners: `finalQty × costPerPiece` |
| Delete | Hover to reveal, confirmation modal |

##### Calculation Logic (`calcItem`)
- Accepts `(item, rates, sparePercent)`
- **Profiles**: `spareQty → finalQty → RM → Wt → Cost (weight-based)`
- **Fasteners**: `spareQty → finalQty → Cost = finalQty × costPerPiece` (RM/Wt = 0)
- All calculations based on `finalQty` (not raw qty) — includes spare

##### Add Item Modal
- Trigger button (dropdown style) with chevron — click to open
- Search input inside the dropdown — auto-focuses, shows all items on open, filters as you type
- Shows both PROFILE and FASTENER items with colour-coded badges
- For fasteners: shows **Cost/Piece badge**, length field replaced with placeholder, length validation skipped
- Live preview: profiles show Spare Qty / Final Qty / RM / Wt / Cost; fasteners show Spare Qty / Final Qty / Cost
- Item Code auto-fills (read-only)
- Stores: `uom`, `profileImagePath`, `costPerPiece` from catalog

##### Other
- Totals footer: total RM, total Wt, total Cost across all items in active building
- Delete item with confirmation modal
- Save persists to DB via `customBomAPI.save()` (includes moduleWp, sparePercent, rates, buildings)

#### 4. `knapsack-front/src/Router.jsx`
- `/custom-bom/create` → `CreateCustomBomProjectPage`
- `/custom-bom/app` → `CustomBOMPage`

#### 5. `knapsack-front/src/pages/HomePage.jsx`
- "Custom BOM" card as first card in BOM modules grid

---

## Pending / Next Steps

- [ ] **`npx prisma db push`** — must be run in `backend/` to add `module_wp` and `spare_percent` columns if not already done
- [ ] **End-to-end test** after db push (create project → open BOM → add items + fasteners → save → reload)
- [ ] **Print Preview** — similar to Long Rail BOM print preview
  - Show project info (client name, project ID, date, module Wp)
  - Show material rates and spare % used
  - Table per building with all columns
  - Grand total across all buildings
  - Print / PDF export button
- [ ] **Multiple buildings as columns** (like Long Rail) — currently tab-based (each building has its own item list). Long Rail shows all buildings as columns in one table with a shared item list. **Needs manager decision**: should all buildings share the same item catalog, or can each building have different items?
- [ ] **Open Existing Project** from Create page should route to `/custom-bom/app` (currently may still go to `/app` for existing projects)
- [ ] **Permissions** — decide if Custom BOM needs role-based access control (who can create/view/edit)
- [ ] **More materials** — currently SS 304, Al 6063, T6, GI; more can be added later
- [ ] **Notes section** — like Long Rail BOM notes

---

## Key Design Decisions Made

| Decision | Choice |
|---|---|
| Material rates location | Inline pill inputs at top of BOM page |
| Module Wp + Spare % | Stored in `custom_boms` table, shown in rates bar |
| Data storage | New `custom_boms` table (not reusing existing BOM tables) |
| Items source | Both profiles + fasteners from `sunrack_profiles` + `fasteners` |
| Fastener cost | `finalQty × costPerPiece` (not weight-based) |
| Material override | User can override material per line item (4 options for now) |
| Cost calculation | Profiles: `finalQty × length/1000 × Wt/RM × rate`; Fasteners: `finalQty × costPerPiece` |
| Spare calculation | `spareQty = ceil(qty × spare% / 100)`, `finalQty = qty + spareQty` |
| RM/Wt/Cost basis | Based on `finalQty` (includes spare), not raw qty |
| Multiple buildings | Tab-based for now (each building has own item list) — column-based pending manager decision |
| Tab rename | Right-click → context menu (same pattern as Long Rail) |
| Variation dropdown | Not required for Custom BOM |

---

## Full Feature Plan

### Overall Flow
```
HomePage (Custom BOM card)
  → CreateCustomBomProjectPage  (Client Name, Project ID, Project Name)
    → CustomBOMPage             (Main BOM editor)
      → [future] CustomBOM PrintPreview
```

### Phase 1 — Core BOM Editor ✅ (built, needs full e2e test after db push)
- Module Wp + Spare % + material rate inputs
- Multiple building tabs with right-click rename/duplicate
- Add items from sunrack_profiles + fasteners via searchable dropdown
- Profile: weight-based cost calculation using finalQty
- Fastener: cost-per-piece calculation using finalQty
- Profile image, UoM, Spare Qty, Final Qty, Rate/kg, Rate/Piece columns
- 3-row yellow table header matching Long Rail style
- Save to DB

### Phase 2 — Print Preview (PENDING)
- Similar to Long Rail BOM print preview
- Project info header (client, project ID, module Wp, date)
- Material rates + spare % summary
- Table per building
- Grand total across all buildings
- Print / PDF export

### Phase 3 — Polish & Permissions (PENDING)
- Role-based access control
- Multiple buildings as columns (pending manager decision)
- Notes section
- More material options
