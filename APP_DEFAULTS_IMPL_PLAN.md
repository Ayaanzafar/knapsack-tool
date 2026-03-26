# App Defaults Configuration — Implementation Plan

> **Status: READY TO PLAN**
> **Depends on:** `PERMISSIONS_IMPL_PLAN.md` — shares the same `SystemConfig` table and `configRoutes.js`.
> **Scope:** Admin can set default values for all parameters from the Admin Panel. New tabs/BOMs use these defaults. "Reset to Defaults" also uses them.

---

## What We're Building

A new **"App Defaults"** tab in AdminPanel (visible to Manager(Design) only) where all default values can be edited in one place. These become the starting values for every new tab/project/BOM created by any user.

> **Important rule:** Changing defaults does NOT retroactively change existing tabs or BOMs. It only affects NEW creations from that point forward.

---

## All Hardcoded Defaults — Inventory

There are **3 separate locations** in the codebase where defaults live today:

### Location 1 — `knapsack-front/src/lib/storage.js` → `DEFAULT_SETTINGS`
Used as: starting values for new tab UI state, and what "Reset to Defaults" restores.

| Parameter | Current Default |
|---|---|
| moduleLength | 2278 mm |
| moduleWidth | 1134 mm |
| frameThickness | 35 mm |
| midClamp | 20 mm |
| endClampWidth | 40 mm |
| buffer | 15 mm |
| purlinDistance | 1700 mm |
| seamToSeamDistance | 400 mm |
| maxSupportDistance | 1800 mm |
| railsPerSide | 2 |
| lengthsInput | 1595, 1798, 2400, 2750, 3600, 4800 |
| maxPieces | 3 |
| maxWastePct | (empty) |
| alphaJoint | 220 |
| betaSmall | 60 |
| allowUndershootPct | 0 |
| gammaShort | 5 |
| costPerMm | 0.1 |
| costPerJointSet | 50 |
| joinerLength | 100 mm |
| priority | cost |

### Location 2 — `knapsack-front/src/constants/bomDefaults.js` + `backend/src/constants/bomDefaults.js`
Used as: starting values for new BOM fields, and the comparison baseline in `bomPermissions.js` middleware.

| Parameter | Current Default |
|---|---|
| aluminumRate | ₹460/kg |
| hdgRatePerKg | ₹125/kg |
| magnelisRatePerKg | ₹125/kg |
| moduleWp | 590 W |
| sparePercentage | 1.0 % |

### Location 3 — `backend/src/services/tabService.js` (fallback values in `createTab`)
Used as: server-side fallback when the request body omits a setting.

All values from Location 1 are duplicated here as inline `|| default` fallbacks (e.g., `settings?.buffer || 15`).

### Location 4 — `backend/src/middleware/tabPermissions.js` → `DEFAULTS`
Used as: the values force-applied to BASIC users on tab creation.

```js
const DEFAULTS = {
  buffer: 15,
  lengthsInput: '1595, 1798, 2400, 2750, 3600, 4800'
};
```

---

## Config Structure (Stored in `SystemConfig` Table)

Same table being added for permissions (`key = 'role_permissions'`). Add a second row: `key = 'app_defaults'`.

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

---

## Implementation Steps

---

### STEP 1 — DB: No new table needed

The `SystemConfig` table from `PERMISSIONS_IMPL_PLAN.md` Step 1 is reused. Just add a second seed row with `key = 'app_defaults'`. The same migration covers both.

---

### STEP 2 — Backend: Extend Config Service

**File:** `backend/src/services/permissionsService.js` (or rename to `configService.js` to handle both permissions + app defaults)

Add to the existing service:

```
configService
  ├── getPermissions()            → existing
  ├── hasPermission(role, key)    → existing
  ├── getAppDefaults()            → NEW — returns full app_defaults object, cached
  ├── getTabDefaults()            → NEW — returns appDefaults.tabDefaults
  ├── getBomDefaults()            → NEW — returns appDefaults.bomDefaults
  └── updateAppDefaults(data)     → NEW — saves to DB, clears cache
```

Self-seeding: if no `app_defaults` row exists in DB, auto-insert the defaults above on first call.

---

### STEP 3 — Backend: Extend Config Routes

**File:** `backend/src/routes/configRoutes.js` (already being created for permissions)

Add two more endpoints:

```
GET  /api/config/defaults
     → Any authenticated user
     → Returns full app_defaults config
     → Frontend loads on login alongside permissions

PUT  /api/config/defaults
     → MANAGER_DESIGN only
     → Validates all values are within sane ranges (no negative lengths, etc.)
     → Calls configService.updateAppDefaults(body)
     → Returns updated config
```

---

### STEP 4 — Backend: Tab Creation Uses Dynamic Defaults

**File:** `backend/src/services/tabService.js`

The `createTab` method currently does `settings?.buffer || 15`. Change to:

```js
// BEFORE
buffer: parseInt(settings?.buffer || 15),

// AFTER
const tabDefs = await configService.getTabDefaults();
buffer: parseInt(settings?.buffer ?? tabDefs.buffer),
```

Apply this pattern to all 20 setting fields. The key change is using `??` (nullish coalescing) instead of `||` so that `0` is a valid value (important for `allowUndershootPct`).

---

### STEP 5 — Backend: Tab Permissions Uses Dynamic Defaults

**File:** `backend/src/middleware/tabPermissions.js`

The `DEFAULTS` object and `getDefaultEnabledLengths()` are hardcoded. Change to:

```js
// BEFORE
const DEFAULTS = {
  buffer: 15,
  lengthsInput: '1595, 1798, 2400, 2750, 3600, 4800'
};

// AFTER (in sanitizeTabCreateForRole)
const tabDefs = await configService.getTabDefaults();
req.body.settings.buffer = tabDefs.buffer;
req.body.settings.lengthsInput = tabDefs.lengthsInput;
req.body.settings.enabledLengths = buildEnabledLengthsFromInput(tabDefs.lengthsInput);
```

This means when a BASIC user creates a tab, the forced defaults come from admin config, not hardcoded values.

---

### STEP 6 — Backend: BOM Permissions Uses Dynamic Defaults

**File:** `backend/src/middleware/bomPermissions.js`

Currently uses `DEFAULT_ALUMINIUM_RATE_PER_KG`, `DEFAULT_SPARE_PERCENTAGE`, `DEFAULT_MODULE_WP` from the hardcoded constants file for comparison baseline.

Change to:
```js
// BEFORE
const currentAluminumRate = toNullableNumber(currentMeta.aluminumRate) ?? DEFAULT_ALUMINIUM_RATE_PER_KG;

// AFTER
const bomDefs = await configService.getBomDefaults();
const currentAluminumRate = toNullableNumber(currentMeta.aluminumRate) ?? bomDefs.aluminumRate;
```

Apply same for `sparePercentage` and `moduleWp`.

---

### STEP 7 — Frontend: Load App Defaults in AuthContext

**File:** `knapsack-front/src/context/AuthContext.jsx`

After login/getMe, also call `GET /api/config/defaults`. Store in context alongside permissions.

```js
// Add to state
const [appDefaults, setAppDefaults] = useState(null);

// After login, fetch both:
const [permsData, defaultsData] = await Promise.all([
  configAPI.getPermissions(),
  configAPI.getDefaults()
]);
setPermissions(permsData);
setAppDefaults(defaultsData);

// Expose in Provider value:
// { user, permissions, appDefaults, can, login, logout, ... }
```

Add to `api.js`:
```js
export const configAPI = {
  getPermissions: () => ...,
  updatePermissions: (cfg) => ...,
  getDefaults: () => apiClient.get('/config/defaults').then(r => r.data),
  updateDefaults: (cfg) => apiClient.put('/config/defaults', cfg).then(r => r.data),
};
```

---

### STEP 8 — Frontend: Replace Hardcoded Defaults in Components

**File:** `knapsack-front/src/lib/storage.js`

`DEFAULT_SETTINGS` currently stores the hardcoded values AND is used as the fallback for localStorage loading. Change approach:

- Keep `DEFAULT_SETTINGS` as a **factory defaults constant** (used only if API hasn't loaded yet / as a type reference)
- Add a `getEffectiveDefaults(appDefaults)` helper that merges admin config over factory defaults
- Components and hooks that call `loadSettings()` or reference `DEFAULT_SETTINGS` get updated to use the context value instead

**File:** `knapsack-front/src/components/GlobalInputs.jsx`

The `handleResetToDefaults` function:
```js
// BEFORE — resets to hardcoded values
setSettings(prev => ({
  ...prev,
  moduleLength: 2278,
  buffer: 15,
  ...etc
}));

// AFTER — resets to admin-configured defaults
const { appDefaults } = useAuth();
setSettings(prev => ({
  ...prev,
  ...appDefaults.tabDefaults
}));
setModuleWp(appDefaults.bomDefaults.moduleWp);
```

**File:** `knapsack-front/src/components/SettingsPanel.jsx`

`handleReset` currently resets to `DEFAULT_SETTINGS`. Change to use `appDefaults.tabDefaults`.

**File:** `knapsack-front/src/constants/bomDefaults.js`

The exported constants (`DEFAULT_ALUMINIUM_RATE_PER_KG` etc.) are imported directly in BOM components. Long-term, these components should read from `appDefaults.bomDefaults` via context. Short-term, the constants file can stay as factory defaults (fallback) while components prioritize the context value.

---

### STEP 9 — Frontend: App Defaults Tab in AdminPanel

**File:** `knapsack-front/src/pages/AdminPanel.jsx`

Add a fourth tab: **"App Defaults"** (alongside Users, BOMs, Permissions — visible only to Manager(Design)).

#### UI Layout — Grouped by category (mirrors the existing GlobalInputs layout)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  App Defaults                                                            │
│  These values are used when any user creates a new tab or BOM.         │
│  Existing tabs and BOMs are not affected.                               │
│                                                                          │
│  ┌─── BOM Rates & Specs ────────────────────────────────────────────┐   │
│  │  Aluminum Rate (₹/kg)  [460    ]    HDG Rate (₹/kg)  [125    ]  │   │
│  │  Magnelis Rate (₹/kg)  [125    ]    Module Wp (W)    [590    ]  │   │
│  │  Spare Percentage (%)  [1.0    ]                                  │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─── Module Parameters ────────────────────────────────────────────┐   │
│  │  Module Length (mm) [2278]   Module Width (mm) [1134]            │   │
│  │  Frame Thickness(mm)[35  ]   Mid Clamp Gap(mm) [20  ]            │   │
│  │  End Clamp Width(mm)[40  ]                                        │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─── Structural Parameters ────────────────────────────────────────┐   │
│  │  Buffer (mm)      [15  ]    Rails per Side    [2   ]             │   │
│  │  Purlin Distance  [1700]    Seam to Seam      [400 ]             │   │
│  │  Max Support Dist [1800]                                          │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─── Optimizer Settings ───────────────────────────────────────────┐   │
│  │  Default Cut Lengths  [1595, 1798, 2400, 2750, 3600, 4800      ] │   │
│  │  Max Pieces  [3 ]    Cost/mm  [0.1]   Cost/Joint  [50]          │   │
│  │  Joiner Length [100]   Max Waste %  [   ]                        │   │
│  │  α Joint [220]  β Small [60]  Undershoot% [0]  γ Short [5]     │   │
│  │  Priority: ( ) Cost  ( ) Length  ( ) Joints                      │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│         [Reset to Factory Defaults]          [Save App Defaults]        │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Behavior:
- All fields are pre-filled with current admin-configured values (from `appDefaults`)
- "Reset to Factory Defaults" button restores hardcoded factory values (460 rate, 15 buffer, etc.) — does NOT save until "Save" is clicked
- "Save App Defaults" calls `PUT /api/config/defaults`, updates `appDefaults` in context
- After save: show a success message: "Saved. New tabs and BOMs will use these values."
- Input validation: no negative numbers, cut lengths must parse to valid positive integers

---

## What Changes and What Doesn't

| Scenario | Affected? |
|---|---|
| Admin changes aluminum rate default to 480 | New BOMs will open with 480 as default |
| Existing BOM saved with 460 | NOT changed — it keeps 460 |
| Admin changes buffer default to 20 | New tabs created by any user start with buffer=20 |
| Existing tab saved with buffer=15 | NOT changed — it keeps 15 |
| User clicks "Reset to Defaults" in GlobalInputs | Resets to admin-configured defaults (480, 20, etc.) |
| BASIC user creates a new tab | Tab creation middleware uses admin-configured buffer/lengths |

---

## Files Changed Summary

| Layer | File | Change |
|-------|------|--------|
| Backend | `src/services/configService.js` | Extend with `getAppDefaults`, `getBomDefaults`, `getTabDefaults`, `updateAppDefaults` |
| Backend | `src/routes/configRoutes.js` | Add `GET/PUT /api/config/defaults` |
| Backend | `src/services/tabService.js` | Replace `settings?.x \|\| hardcoded` with `settings?.x ?? tabDefs.x` |
| Backend | `src/middleware/tabPermissions.js` | Replace hardcoded `DEFAULTS` with `configService.getTabDefaults()` |
| Backend | `src/middleware/bomPermissions.js` | Replace `DEFAULT_ALUMINIUM_RATE_PER_KG` etc. with `configService.getBomDefaults()` |
| Frontend | `src/context/AuthContext.jsx` | Load `appDefaults` alongside permissions, expose in context |
| Frontend | `src/services/api.js` | Add `configAPI.getDefaults` and `configAPI.updateDefaults` |
| Frontend | `src/components/GlobalInputs.jsx` | `handleResetToDefaults` uses `appDefaults.tabDefaults` |
| Frontend | `src/components/SettingsPanel.jsx` | `handleReset` uses `appDefaults.tabDefaults` |
| Frontend | `src/pages/AdminPanel.jsx` | Add "App Defaults" tab UI |

**Total: 10 files** (0 new files — all extensions of existing files or files already being modified for permissions)

---

## Difficulty Rating

| Step | Difficulty | Notes |
|------|-----------|-------|
| Steps 1–3 — DB + backend service + routes | Low | Extends work already done for permissions, zero new patterns |
| Step 4 — tabService fallbacks | Low | 20 field substitutions, mechanical change |
| Step 5 — tabPermissions DEFAULTS | Low | 3-line change, same async pattern as permissions |
| Step 6 — bomPermissions constants | Low | 3 constant replacements |
| Step 7 — AuthContext + api.js | Low | Parallel fetch alongside permissions fetch |
| Step 8 — Frontend component resets | Low | 2 files, swap hardcoded object for context value |
| Step 9 — Admin UI tab | Medium | New form UI — largest piece of UI work in this feature |

**Overall: Low–Medium** — This is significantly easier than the permissions feature because:
1. No middleware permission gate changes — just value substitution
2. No ~14 component sweeps — only 2 components change (`GlobalInputs`, `SettingsPanel`)
3. The architecture (SystemConfig table, configRoutes, AuthContext pattern) is 100% reused from permissions work

---

## Implementation Order

Do AFTER permissions work (Steps 1–3 of that plan must be done first for the shared table):

1. Extend `configService.js` with app defaults methods (Steps 2–3 here)
2. Update `tabService.js` and the two middleware files (Steps 4–6) — fully isolated, safe to ship
3. Update `AuthContext` + `api.js` (Step 7) — frontend now has defaults from server
4. Update `GlobalInputs` + `SettingsPanel` reset behavior (Step 8)
5. Build Admin UI (Step 9)

---

## Combined Scope with Permissions

If you implement both features together:

| Feature | New files | Modified files |
|---|---|---|
| Permissions config | 2 | 23 |
| App defaults config | 0 | 10 |
| **Shared infrastructure** | | `SystemConfig` table, `configService`, `configRoutes`, `AuthContext`, `api.js` |

The shared infrastructure means you only build it once. The combined effort is much less than doing them separately.
