# Master Implementation Plan — Roles, Permissions & App Defaults
### Knapsack BOM Tool

> **Last Updated:** 2026-03-26
> **Status:** Phases A–I COMPLETE — Post-deploy bugs fixed — Next: BOM List entry point for non-admin roles
> **Replaces:** `ROLE_CHANGE_PLAN.md`, `PERMISSIONS_IMPL_PLAN.md`, `FIELD_PERMISSIONS_IMPL_PLAN.md`, `APP_DEFAULTS_IMPL_PLAN.md`

---

## 1. Overview — What We're Building

Three features, one shared foundation:

| Feature | What it does |
|---|---|
| **4-Role System** | Rename BASIC→SALES, MANAGER→MANAGER_DESIGN, add new MANAGER_SALES role |
| **Dynamic Permissions** | Manager(Design) configures what each role can access and which fields they can edit — from Admin Panel, no code change needed |
| **App Defaults** | Manager(Design) sets the default values for all parameters (buffer, aluminum rate, cut lengths, etc.) — new tabs/BOMs use these instead of hardcoded values |

**Why dynamic permissions solves the pending Manager(Sales) question:**
You no longer need your manager to decide Manager(Sales) permissions before coding. Start it as a copy of SALES (restricted), deploy, and Manager(Design) can configure it whenever they decide.

---

## 2. Role System — Before & After

### Old (3 roles)
| Role String | Who |
|---|---|
| `BASIC` | Standard user |
| `DESIGN` | Advanced user |
| `MANAGER` | Admin |

### New (4 roles) ✅ DONE
| Role String | Who | Maps From |
|---|---|---|
| `SALES` | Standard user | `BASIC` (renamed) |
| `DESIGN` | Advanced user | `DESIGN` (no change) |
| `MANAGER_SALES` | Sales manager | New role |
| `MANAGER_DESIGN` | Design manager / Admin | `MANAGER` (renamed) |

---

## 3. Shared Architecture

All three features are built on **one shared foundation**:

```
DB: SystemConfig table
├── row key: 'role_permissions'   → who can do what, which fields each role can edit
└── row key: 'app_defaults'       → default parameter values for new tabs/BOMs

Backend: configService.js (one service file)
├── getPermissions()              → full permissions config
├── hasPermission(role, key)      → boolean feature flag check
├── canEditTabField(role, field)  → field-level tab edit check
├── canEditBomField(role, field)  → field-level BOM edit check
├── getAppDefaults()              → full defaults config
├── getTabDefaults()              → tab parameter defaults
├── getBomDefaults()              → BOM rate defaults
├── updatePermissions(data)       → save + clear cache
└── updateAppDefaults(data)       → save + clear cache

Backend: configRoutes.js (one route file)
├── GET  /api/config/permissions
├── PUT  /api/config/permissions  (MANAGER_DESIGN only)
├── GET  /api/config/defaults
└── PUT  /api/config/defaults     (MANAGER_DESIGN only)

Frontend: AuthContext.jsx
├── can('canAccessAdmin')              → feature permission check
├── canEditField('buffer', 'tab')      → field-level permission check
└── appDefaults.tabDefaults.buffer     → access to default values

Frontend: AdminPanel.jsx (4 tabs)
├── Users         → existing
├── BOMs          → existing
├── Permissions   → NEW: feature flags table + field-level table
└── App Defaults  → NEW: default values form
```

---

## 4. The Permissions Config Structure

```json
{
  "SALES": {
    "canUpdateMasterItem":  false,
    "canViewAllBoms":       false,
    "canViewSalesBoms":     false,
    "canViewDesignBoms":    false,
    "canEditDefaultNotes":  false,
    "canManageUsers":       false,
    "canAccessAdmin":       false,
    "editableTabFields": [
      "moduleLength", "moduleWidth", "frameThickness",
      "midClamp", "endClampWidth", "railsPerSide",
      "purlinDistance", "seamToSeamDistance", "maxSupportDistance",
      "enabledLengths", "priority"
    ],
    "editableBomFields": []
  },
  "DESIGN": {
    "canUpdateMasterItem":  true,
    "canViewAllBoms":       false,
    "canViewSalesBoms":     false,
    "canViewDesignBoms":    false,
    "canEditDefaultNotes":  false,
    "canManageUsers":       false,
    "canAccessAdmin":       false,
    "editableTabFields": [
      "moduleLength", "moduleWidth", "frameThickness",
      "midClamp", "endClampWidth", "buffer", "railsPerSide",
      "purlinDistance", "seamToSeamDistance", "maxSupportDistance",
      "enabledLengths", "lengthsInput",
      "costPerMm", "costPerJointSet", "joinerLength", "maxPieces", "priority",
      "maxWastePct", "alphaJoint", "betaSmall", "allowUndershootPct", "gammaShort"
    ],
    "editableBomFields": [
      "aluminumRate", "sparePercentage", "moduleWp",
      "perItemCost", "perItemAluminumRate"
    ]
  },
  "MANAGER_SALES": {
    "canUpdateMasterItem":  false,
    "canViewAllBoms":       false,
    "canViewSalesBoms":     true,
    "canViewDesignBoms":    false,
    "canEditDefaultNotes":  false,
    "canManageUsers":       false,
    "canAccessAdmin":       false,
    "editableTabFields": [
      "moduleLength", "moduleWidth", "frameThickness",
      "midClamp", "endClampWidth", "railsPerSide",
      "purlinDistance", "seamToSeamDistance", "maxSupportDistance",
      "enabledLengths", "priority"
    ],
    "editableBomFields": []
  },
  "MANAGER_DESIGN": {
    "canUpdateMasterItem":  true,
    "canViewAllBoms":       true,
    "canViewSalesBoms":     true,
    "canViewDesignBoms":    true,
    "canEditDefaultNotes":  true,
    "canManageUsers":       true,
    "canAccessAdmin":       true,
    "editableTabFields": ["all"],
    "editableBomFields":  ["all"]
  }
}
```

> `["all"]` is the sentinel value for MANAGER_DESIGN — no restrictions. Always locked in the UI.

### Feature Permissions Reference

| Flag | What it gates |
|---|---|
| `canUpdateMasterItem` | "Apply to Future" — update master item DB from BOM |
| `canViewAllBoms` | View every BOM from every user |
| `canViewSalesBoms` | View BOMs created by SALES + MANAGER_SALES role users |
| `canViewDesignBoms` | View BOMs created by DESIGN role users |
| `canEditDefaultNotes` | Edit global default notes & variation template notes |
| `canManageUsers` | Create, delete, reset password, activate/hold users |
| `canAccessAdmin` | Access the Admin Panel at all |

> **BOM visibility combines:** If a role has both `canViewSalesBoms` and `canViewDesignBoms`, they see both pools merged. `canViewAllBoms` overrides all and bypasses filtering entirely.

---

## 5. Implementation Status

### ✅ PHASES A–I — COMPLETE

All 9 phases were implemented across 31 files (29 modified + 2 new).

| Phase | What | Status |
|---|---|---|
| A — DB | SystemConfig model, role rename SQL, seed update | ✅ Done |
| B — Backend Infrastructure | configService.js, configRoutes.js, server.js | ✅ Done |
| C — Middleware | authMiddleware requirePermission(), tabPermissions, bomPermissions dynamic | ✅ Done |
| D — Routes | userRoutes, defaultNotesRoutes, templateRoutes, savedBomRoutes + canViewBoms | ✅ Done |
| E — tabService | createTab uses ?? + configService.getTabDefaults() for all 20 fields | ✅ Done |
| F — Frontend api.js + AuthContext | configAPI, sanitizeTabSettingsForRole, can(), canEditField(), appDefaults | ✅ Done |
| G — Role checks | All 14 frontend files — BASIC/MANAGER string comparisons → can()/canEditField() | ✅ Done |
| H — Defaults | GlobalInputs + SettingsPanel reset uses appDefaults; storage.js getEffectiveDefaults() | ✅ Done |
| I — Admin Panel | PermissionsTab (7 flags + 27 field checkboxes) + AppDefaultsTab visible to MANAGER_DESIGN | ✅ Done |

---

## 6. Post-Deploy Bugs Fixed

### Bug 1 — AdminBOMView crash when opening old BOMs
**Error:** `BOMTable.jsx: Cannot read properties of undefined (reading 'map')` on `tabs.map()`

**Root cause:** Old BOM records in DB were saved before `tabs` was added to `bomData` structure. The `savedBomService` skipped reconstruction (because `profilesMap` existed) and returned raw old data without a `tabs` array. `BOMTable` destructured `tabs` without a default, so `tabs.map()` crashed.

**Fix (2 files):**
- `BOMTable.jsx:56` — added `= []` defaults: `const { tabs = [], panelCounts = {}, bomItems = [], projectInfo = {} } = bomData;`
- `savedBomService.js` — reconstruction condition now also triggers when `tabs` is missing:
  ```js
  const needsReconstruction =
    savedBom?.bomData &&
    (!savedBom.bomData?.profilesMap || !Array.isArray(savedBom.bomData?.tabs)) &&
    Array.isArray(savedBom.bomData?.bomItems) &&
    savedBom.bomData.bomItems.length > 0;
  ```

---

### Bug 2 — BOM creation: Template 404 for old projects
**Error:** `GET /api/bom-templates/BOM%20for%20U%20Cleat%20Long%20Rail 404 (Not Found)`

**Root cause:** Old projects in DB had `longRailVariation` stored as informal display labels (e.g. `"U Cleat Long Rail"`, `"BOM for U Cleat Long Rail"`, `"Cleat Long Rail"`) instead of the exact template names used in the `bomVariationTemplate` table (e.g. `"U Cleat Long Rail - Regular"`).

**DB records affected:**
| Old Value | Count | Fixed To |
|---|---|---|
| `"U Cleat Long Rail"` | 21 | `"U Cleat Long Rail - Regular"` |
| `"BOM for U Cleat Long Rail"` | 3 | `"U Cleat Long Rail - Regular"` |
| `"Cleat Long Rail"` | 1 | `"U Cleat Long Rail - Regular"` |

**Fix (2 parts):**
1. **DB data migration** — ran `updateMany` to fix all 25 old project records
2. **`templateService.js` legacy map** — safety net for old names still embedded in saved `bomData.projectInfo`:
   ```js
   const LEGACY_NAME_MAP = {
     'U Cleat Long Rail': 'U Cleat Long Rail - Regular',
     'BOM for U Cleat Long Rail': 'U Cleat Long Rail - Regular',
     'Cleat Long Rail': 'U Cleat Long Rail - Regular',
   };
   ```

**Remaining known non-matches (no template exists for these):**
- `"L Cleat Long Rail"` — 2 projects — disabled in LONG_RAIL_OPTIONS, no template in DB yet
- `"Mini Rail"` — 1 project — not in options, no template in DB
- `null` — 22 projects — no variation selected, no template expected

---

### Bug 3 — Prisma migration shadow DB failure
**Error:** `Migration 20260106_add_fasteners_and_polymorphic_links failed — Table bom_variation_items doesn't exist`

**Root cause:** The migration does `ALTER TABLE bom_variation_items` but that table was originally created manually (not via a tracked migration). The real DB has it, but Prisma's shadow DB (which replays all migrations from scratch) fails at query #3.

**Workaround applied:** `npx prisma db push` — syncs schema directly to real DB without going through migration replay. App works correctly.

**Permanent fix (not yet done):** Either add a `CREATE TABLE IF NOT EXISTS bom_variation_items` before the ALTER in that migration file, or use `prisma migrate resolve --applied` to mark it as already applied and remove the conflict from history.

---

## 7. Permissions Wiring Audit — What's Done vs Missing

After the full audit (2026-03-26), here is the exact wiring status of every permission:

| Permission | Backend Enforced | Frontend UI Gated | Entry Point for Non-Admin | Status |
|---|---|---|---|---|
| `canAccessAdmin` | ✅ | ✅ AdminRoute guard + HomePage button | N/A (is the gate) | **Fully wired** |
| `canUpdateMasterItem` | ✅ | ✅ ReviewChangesModal column | N/A (used inline in BOMPage) | **Fully wired** |
| `canEditDefaultNotes` | ✅ | ✅ NotesSection edit button | N/A (used inline in BOMPage) | **Fully wired** |
| `canManageUsers` | ✅ API routes | ❌ Users tab always renders for any admin | N/A | **UI gap** |
| `canViewAllBoms` | ✅ API filters | ❌ No button/route for non-admin roles | ❌ Missing | **UI + entry point missing** |
| `canViewSalesBoms` | ✅ API filters | ❌ No button/route for non-admin roles | ❌ Missing | **UI + entry point missing** |
| `canViewDesignBoms` | ✅ API filters | ❌ Never used (default false everywhere) | ❌ Missing | **Unused + UI missing** |
| Tab fields (22) | ✅ tabPermissions middleware | ❌ Fields still render; rejected only on save | N/A | **API-only enforcement** |
| BOM fields (5) | ✅ bomPermissions middleware | ❌ Fields still render; rejected only on save | N/A | **API-only enforcement** |

### Role-by-role what currently works

| Role | What works today | What's broken/missing |
|---|---|---|
| **SALES** | Create/view own BOMs, edit allowed tab fields | Field inputs still render even for restricted fields (no UI hiding) |
| **DESIGN** | All SALES + canUpdateMasterItem | canViewAllBoms / canViewDesignBoms have no entry point if granted. Field UI not hidden. |
| **MANAGER_SALES** | canViewSalesBoms is set — but **has no page to visit**. Cannot reach /admin. | Entire BOM list feature is unreachable. This role is effectively broken for its main purpose. |
| **MANAGER_DESIGN** | Full access, Admin Panel works. | canManageUsers not checked before rendering Users tab (minor — backend still blocks API). |

---

## 8. Next Steps — What Needs to Be Built

### Priority 1 — BOM List entry point for non-admin roles (CRITICAL)

**Affected roles:** MANAGER_SALES (broken today), DESIGN/SALES if granted view permissions

**What to build:**
1. New route `/bom-list` — accessible to any role that has `canViewAllBoms` OR `canViewSalesBoms` OR `canViewDesignBoms`
2. Route guard: if none of those three permissions → redirect to home
3. **Reuse existing components** — `BOMManagementTab` + `AdminBOMView` already exist and work
4. Add a **"BOM List" button on `HomePage`** — visible only when user has any of the three view permissions:
   ```js
   {(can('canViewAllBoms') || can('canViewSalesBoms') || can('canViewDesignBoms')) && (
     <button onClick={() => navigate('/bom-list')}>BOM List</button>
   )}
   ```
5. The `BOMManagementTab` calls the same `/api/saved-boms/all` endpoint — backend already filters by role scope. No backend changes needed.

**Files to touch:**
| File | Change |
|---|---|
| `Router.jsx` | Add `/bom-list` route with permission guard |
| `HomePage.jsx` | Add BOM List button with permission check |
| New: `pages/BOMListPage.jsx` | Thin wrapper that renders `BOMManagementTab` — or just add a route pointing directly to it |

---

### Priority 2 — Gate Users tab in AdminPanel by canManageUsers

**Problem:** Any role with `canAccessAdmin` can see the Users tab. Backend blocks the API calls, but the UI still renders.

**Fix:**
- `AdminPanel.jsx` — wrap the Users tab render with `can('canManageUsers')`
- Also hide the "Users" tab button in the tab bar if the user lacks this permission

**Files:** `AdminPanel.jsx` only

---

### Priority 3 — canViewDesignBoms clarification

**Problem:** This permission is defined but defaults to `false` for all roles and is never actually used anywhere.

**Decision needed:**
- If it means "DESIGN role users can view their own team's BOMs" → wire it up like `canViewSalesBoms` (already handled by backend `getSavedBomsByRoles(['DESIGN'])`)
- If it means "view BOMs where the project variation is Design type" → different meaning entirely
- If it's not needed → remove it from the permissions config to reduce confusion

---

### Priority 4 — Field-level UI hiding (optional / UX improvement)

**Problem:** Restricted fields (buffer, aluminum rate, etc.) still render as editable inputs for SALES users. They get rejected by the API on save, but the UX is confusing.

**Fix:** Use `canEditField()` from AuthContext to disable or hide restricted inputs in:
- `GlobalInputs.jsx` — buffer, lengthsInput
- `SettingsPanel.jsx` — Optimizer/Cost/Advanced sections
- `RailTable.jsx` — per-field checks
- `BOMPage.jsx` — aluminumRate, sparePercentage, moduleWp
- `BOMTableRow.jsx` — perItemCost, perItemAluminumRate

**Note:** This is a UX improvement only. Backend already enforces correctly. Low urgency.

---

## 9. The Permissions Config (Section 4) Fields Reference

### All 27 Controllable Fields

| Group | Field Key | Default: SALES | Default: DESIGN |
|---|---|:---:|:---:|
| Module Parameters | `moduleLength` | ✅ | ✅ |
| Module Parameters | `moduleWidth` | ✅ | ✅ |
| Module Parameters | `frameThickness` | ✅ | ✅ |
| Module Parameters | `midClamp` | ✅ | ✅ |
| Module Parameters | `endClampWidth` | ✅ | ✅ |
| MMS / Structural | `buffer` | ❌ | ✅ |
| MMS / Structural | `railsPerSide` | ✅ | ✅ |
| Site Parameters | `purlinDistance` | ✅ | ✅ |
| Site Parameters | `seamToSeamDistance` | ✅ | ✅ |
| Site Parameters | `maxSupportDistance` | ✅ | ✅ |
| Cut Lengths | `enabledLengths` (toggle on/off) | ✅ | ✅ |
| Cut Lengths | `lengthsInput` (edit the list) | ❌ | ✅ |
| Optimizer / Cost | `costPerMm` | ❌ | ✅ |
| Optimizer / Cost | `costPerJointSet` | ❌ | ✅ |
| Optimizer / Cost | `joinerLength` | ❌ | ✅ |
| Optimizer / Cost | `maxPieces` | ❌ | ✅ |
| Optimizer / Cost | `priority` | ✅ | ✅ |
| Advanced Optimizer | `maxWastePct` | ❌ | ✅ |
| Advanced Optimizer | `alphaJoint` | ❌ | ✅ |
| Advanced Optimizer | `betaSmall` | ❌ | ✅ |
| Advanced Optimizer | `allowUndershootPct` | ❌ | ✅ |
| Advanced Optimizer | `gammaShort` | ❌ | ✅ |
| BOM Rates | `aluminumRate` | ❌ | ✅ |
| BOM Rates | `sparePercentage` | ❌ | ✅ |
| BOM Rates | `moduleWp` | ❌ | ✅ |
| BOM Rates | `perItemCost` | ❌ | ✅ |
| BOM Rates | `perItemAluminumRate` | ❌ | ✅ |

---

## 10. App Defaults Config Structure

Stored as `key = 'app_defaults'` in the `SystemConfig` table:

```json
{
  "tabDefaults": {
    "moduleLength": 2278,
    "moduleWidth": 1134,
    "frameThickness": 35,
    "midClamp": 20,
    "endClampWidth": 40,
    "buffer": 15,
    "purlinDistance": 1700,
    "seamToSeamDistance": 400,
    "maxSupportDistance": 1800,
    "railsPerSide": 2,
    "lengthsInput": "1595, 1798, 2400, 2750, 3600, 4800",
    "maxPieces": 3,
    "maxWastePct": "",
    "alphaJoint": 220,
    "betaSmall": 60,
    "allowUndershootPct": 0,
    "gammaShort": 5,
    "costPerMm": "0.1",
    "costPerJointSet": "50",
    "joinerLength": "100",
    "priority": "cost"
  },
  "bomDefaults": {
    "aluminumRate": 460,
    "hdgRatePerKg": 125,
    "magnelisRatePerKg": 125,
    "moduleWp": 590,
    "sparePercentage": 1.0
  }
}
```

> Changing these does NOT affect existing tabs or BOMs. Only new creations use the updated defaults.

---

## 11. Complete File Change Log

### New Files (2)
| File | Purpose |
|---|---|
| `backend/src/services/configService.js` | All config read/write/cache logic |
| `backend/src/routes/configRoutes.js` | GET/PUT endpoints for permissions and defaults |

### Modified Files (29)

**Backend:**
| File | What Changed |
|---|---|
| `prisma/schema.prisma` | Added `SystemConfig` model, updated `User` role default BASIC→SALES |
| `prisma/seed_auth.js` | Seed user role MANAGER → MANAGER_DESIGN |
| `src/server.js` | Registered `/api/config` routes |
| `src/middleware/authMiddleware.js` | Added `requirePermission` export |
| `src/middleware/tabPermissions.js` | Dynamic field list + dynamic defaults (replaces ADVANCED_ROLES + DEFAULTS) |
| `src/middleware/bomPermissions.js` | Per-field checks + dynamic BOM defaults |
| `src/routes/userRoutes.js` | `authorizeRoles('MANAGER')` → `requirePermission('canManageUsers')` |
| `src/routes/savedBomRoutes.js` | `authorizeRoles('MANAGER')` → canViewBoms scope middleware |
| `src/services/savedBomService.js` | Added `getSavedBomsByRoles(roles)` + fixed reconstruction condition for missing tabs |
| `src/controllers/savedBomController.js` | `getAllSavedBoms` reads `req.bomViewScope` to call correct service method |
| `src/routes/defaultNotesRoutes.js` | `authorizeRoles('MANAGER')` → `requirePermission('canEditDefaultNotes')` |
| `src/routes/templateRoutes.js` | `authorizeRoles('MANAGER')` → `requirePermission('canEditDefaultNotes')` |
| `src/services/tabService.js` | `settings?.x \|\| hardcoded` → `settings?.x ?? tabDefs.x` (20 fields) |

**Frontend:**
| File | What Changed |
|---|---|
| `src/context/AuthContext.jsx` | Load permissions + defaults, expose `can()`, `canEditField()`, `appDefaults` |
| `src/services/api.js` | Added `configAPI`, updated `sanitizeTabSettingsForRole` |
| `src/services/templateService.js` | Added `LEGACY_NAME_MAP` for old `longRailVariation` values |
| `src/Router.jsx` | Admin route guard uses `can('canAccessAdmin')` |
| `src/App.jsx` | Role checks → `can()` calls |
| `src/pages/AdminPanel.jsx` | Role dropdown updated to 4 roles, added Permissions tab + App Defaults tab |
| `src/pages/HomePage.jsx` | Admin link uses `can('canAccessAdmin')` |
| `src/lib/storage.js` | Added `getEffectiveDefaults()` helper |
| `src/components/GlobalInputs.jsx` | `isBasicUser` → `canEditField()`, reset uses `appDefaults` |
| `src/components/RailTable.jsx` | Role checks → `canEditField()` |
| `src/components/ResultCard.jsx` | `userMode` → `canEditField()` |
| `src/components/SettingsPanel.jsx` | `userMode` → `canEditField()`, reset uses `appDefaults` |
| `src/components/BOM/BOMPage.jsx` | `isBasicUser` → `canEditField('...', 'bom')` |
| `src/components/BOM/BOMTable.jsx` | Added `= []` defaults to destructuring to prevent crash on old BOM data |
| `src/components/BOM/BOMTableRow.jsx` | `isBasicUser` → `canEditField('perItemCost', 'bom')` |
| `src/components/BOM/NotesSection.jsx` | `isManager` → `can('canEditDefaultNotes')` |
| `src/components/BOM/ReviewChangesModal.jsx` | `canUpdateMaster` → `can('canUpdateMasterItem')` |
| `src/components/BOM/ShareBOMModal.jsx` | Role filter array updated to 4 new role strings |

**Total: 2 new + 29 modified = 31 files**

---

## 12. Known Remaining Issues

| Issue | Severity | Notes |
|---|---|---|
| MANAGER_SALES has no BOM list entry point | HIGH | Role has `canViewSalesBoms` but can't reach BOM list — see Priority 1 above |
| canManageUsers not gated in AdminPanel UI | MEDIUM | Backend blocks API; UI still renders. See Priority 2 above |
| canViewDesignBoms is unused/dead | LOW | Default false everywhere, no UI hooks it. See Priority 3 above |
| Field inputs render for restricted roles | LOW | API rejects on save. UX improvement only. See Priority 4 above |
| Prisma migration shadow DB conflict | LOW | `db push` workaround applied. `prisma migrate dev` will fail until migration SQL is fixed |
| Old `longRailVariation` in saved bomData | LOW | Legacy map in templateService.js handles it. DB records already fixed. |
