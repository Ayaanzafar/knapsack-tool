# Custom BOM - Progress Tracker

## Status: IN PROGRESS

---

## What's Been Built

### Backend

#### 1. Database
- New table `custom_boms` added to `prisma/schema.prisma` via `db push`
- Fields: `id`, `project_id`, `ss304_rate`, `al6063_rate`, `t6_rate`, `gi_rate`, `buildings` (JSON), `created_at`, `updated_at`
- `Project` model updated with `customBom` relation

#### 2. Service — `src/services/customBomService.js`
- Uses raw SQL (`prisma.$queryRaw` / `prisma.$executeRaw`) to avoid Prisma client regeneration dependency
- `getByProjectId(projectId)` — fetches or returns empty default
- `upsert(projectId, data)` — insert or update

#### 3. Controller — `src/controllers/customBomController.js`
- `GET /api/custom-bom/:projectId` → calls `getByProjectId`
- `PUT /api/custom-bom/:projectId` → calls `upsert`

#### 4. Routes — `src/routes/customBomRoutes.js`
- Registered in `src/server.js` as `app.use('/api/custom-bom', customBomRoutes)`

#### 5. Bug Fix in `src/routes/bomRoutes.js`
- `GET /api/bom/master-items` was commented out, causing requests to fall through to `GET /:bomId` and crash
- Fixed: route is now active (uncommented)

---

### Frontend

#### 1. `src/services/api.js`
- Added `customBomAPI`:
  - `get(projectId)` → `GET /api/custom-bom/:projectId`
  - `save(projectId, data)` → `PUT /api/custom-bom/:projectId`

#### 2. `src/pages/CreateCustomBomProjectPage.jsx`
- After project creation → navigates to `/custom-bom/app` (was `/app`)
- After opening existing project → navigates to `/custom-bom/app`
- Removed `pb-64` padding (was causing unnecessary scroll)

#### 3. `src/pages/CustomBOMPage.jsx` — Main BOM editor (fully built)
- Header: project name, back to home, Save BOM button
- **Material Rates Bar**: 4 inputs at top (SS 304, Al 6063, T6, GI) in ₹/kg — recalculates all rows on change
- **Building Tabs**: add / rename (click name) / remove buildings
- **BOM Table** per building:
  - Columns: #, Item Name, Item Code, Material, Length (mm), Qty, RM (m), Wt/RM (kg/m), Total Wt (kg), Cost (₹), Delete
  - Inline editable: Material (dropdown), Length, Quantity
  - Auto-calculates: RM = Qty × Length / 1000, Wt = RM × designWeight, Cost = Wt × material rate
  - Totals footer row
- **Add Item Modal**:
  - Live search dropdown fetching from `/api/bom/master-items` (profiles + fasteners)
  - Item code auto-fills (read-only)
  - Material dropdown (pre-filled from profile, overridable): SS 304, Al 6063, T6, GI
  - Length (mm) + Quantity inputs
  - Live cost preview (RM / Wt / Cost) before adding
- Delete item with confirmation modal
- Save persists to DB via `customBomAPI.save()`

#### 4. `src/Router.jsx`
- Added import + routes:
  - `/custom-bom/create` → `CreateCustomBomProjectPage`
  - `/custom-bom/app` → `CustomBOMPage`

#### 5. `src/pages/HomePage.jsx`
- "Custom BOM" card added as **first card** in the BOM modules grid
- Active badge (green), pencil icon
- `handleCustomBom` navigates to `/custom-bom/create`

---

## Current Issue (Last Error Before Stopping)

**Error:** `GET /api/custom-bom/:projectId` returns 500

**Root Cause:** Prisma client not regenerated after schema change (server was running and locked the DLL on Windows)

**Fix Applied:** Rewrote `customBomService.js` to use raw SQL — no Prisma regeneration needed

**Status:** Backend server needs one restart to pick up:
1. Raw SQL service (fixes the 500)
2. `bomRoutes.js` fix (GET /master-items now active)

---

## What's Pending / Next Steps

- [ ] **Test end-to-end** after backend restart (create project → open BOM → add items → save → reload)
- [ ] **Print Preview** for Custom BOM (similar to Long Rail BOM print preview)
- [ ] **Open Existing Project** from Create page should also show correct Custom BOM data (currently opens Long Rail `/app`)
- [ ] Permissions — decide if Custom BOM needs role-based access control like Long Rail
- [ ] Consider adding more materials to the dropdown later (currently: SS 304, Al 6063, T6, GI)

---

## Full Feature Plan (What Custom BOM Will Be)

### Overall Flow
```
HomePage (Custom BOM card)
  → CreateCustomBomProjectPage  (Client Name, Project ID, Project Name — NO variation dropdown)
    → CustomBOMPage             (Main BOM editor)
      → [future] CustomBOM PrintPreview
```

### Phase 1 — Core BOM Editor ✅ (built, needs testing)
- Material rate inputs at top (SS 304, Al 6063, T6, GI)
- Multiple building tabs
- Add items from sunrack_profiles + fasteners via search dropdown
- Item code auto-fills, material pre-fills (overridable)
- User enters: Length (mm) + Quantity
- Auto-calculates: RM → Total Wt → Cost per row
- Inline edit material / length / qty after adding
- Totals footer per building
- Save to DB

### Phase 2 — Print Preview (PENDING)
- Similar to Long Rail BOM print preview
- Show project info (client name, project ID, date)
- Show material rates used
- Table per building with all columns
- Grand total across all buildings
- Print / PDF export button

### Phase 3 — Polish & Permissions (PENDING)
- Role-based access (who can create/view/edit Custom BOMs)
- "Open Existing Project" on Create page must route to `/custom-bom/app` not `/app`
- Notes section (like Long Rail)
- More material options to be added later

---

## Key Design Decisions Made

| Decision | Choice |
|---|---|
| Material rates location | Input fields at top of BOM page (Option A) |
| Data storage | New `custom_boms` table (not reusing existing BOM tables) |
| Items source | Both profiles + fasteners from `sunrack_profiles` + `fasteners` |
| Material override | User can override material per line item (4 options for now) |
| Cost calculation | Same as Long Rail: RM × Wt/RM × material rate |
| Multiple buildings | Yes — tab-based like Long Rail |
| Variation dropdown | Not required for Custom BOM |
