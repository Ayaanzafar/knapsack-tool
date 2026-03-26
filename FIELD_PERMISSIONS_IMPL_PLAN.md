# Field-Level Edit Permissions — Implementation Plan

> **Status: READY TO PLAN**
> **Depends on:** `PERMISSIONS_IMPL_PLAN.md` — this feature extends/replaces `canEditAdvancedTab` and `canEditBomRates`.
> **Scope:** Manager(Design) can decide which specific input fields each role is allowed to edit.

---

## What We're Building

Right now, field access is controlled by two coarse-grained switches:
- `canEditAdvancedTab` → locks/unlocks a group of 11 tab fields together
- `canEditBomRates` → locks/unlocks a group of 5 BOM fields together

This feature **replaces those two switches** with a field-by-field toggle table in the Admin Panel. Manager(Design) can say "SALES can edit buffer but not costPerMm" if they want.

---

## All Controllable Fields — Inventory

Every field that appears in `GlobalInputs`, `SettingsPanel`, and BOM rate inputs.

### Tab Fields — Group A: Module Parameters
| Field Key | Label | Default: SALES | Default: DESIGN |
|---|---|:---:|:---:|
| `moduleLength` | Module Length (mm) | ✅ | ✅ |
| `moduleWidth` | Module Width (mm) | ✅ | ✅ |
| `frameThickness` | Frame Thickness (mm) | ✅ | ✅ |
| `midClamp` | Mid Clamp Gap (mm) | ✅ | ✅ |
| `endClampWidth` | End Clamp Width (mm) | ✅ | ✅ |

### Tab Fields — Group B: MMS / Structural
| Field Key | Label | Default: SALES | Default: DESIGN |
|---|---|:---:|:---:|
| `buffer` | Buffer after End Clamp (mm) | ❌ | ✅ |
| `railsPerSide` | Rails per Side | ✅ | ✅ |

### Tab Fields — Group C: Site Parameters
| Field Key | Label | Default: SALES | Default: DESIGN |
|---|---|:---:|:---:|
| `purlinDistance` | Purlin to Purlin Distance (mm) | ✅ | ✅ |
| `seamToSeamDistance` | Seam to Seam (mm) | ✅ | ✅ |
| `maxSupportDistance` | Max Support Distance (mm) | ✅ | ✅ |

### Tab Fields — Group D: Cut Lengths
| Field Key | Label | Default: SALES | Default: DESIGN |
|---|---|:---:|:---:|
| `enabledLengths` | Toggle individual cut lengths on/off | ✅ | ✅ |
| `lengthsInput` | Add/remove cut lengths (edit the list itself) | ❌ | ✅ |

### Tab Fields — Group E: Optimizer / Cost Settings
| Field Key | Label | Default: SALES | Default: DESIGN |
|---|---|:---:|:---:|
| `costPerMm` | Cost per mm | ❌ | ✅ |
| `costPerJointSet` | Cost per Joint Set | ❌ | ✅ |
| `joinerLength` | Joiner Length (mm) | ❌ | ✅ |
| `maxPieces` | Max Pieces | ❌ | ✅ |
| `priority` | Priority (Cost / Length / Joints) | ✅ | ✅ |

### Tab Fields — Group F: Advanced Optimizer
| Field Key | Label | Default: SALES | Default: DESIGN |
|---|---|:---:|:---:|
| `maxWastePct` | Max Waste % | ❌ | ✅ |
| `alphaJoint` | α Joint Penalty | ❌ | ✅ |
| `betaSmall` | β Small Penalty | ❌ | ✅ |
| `allowUndershootPct` | Allow Undershoot % | ❌ | ✅ |
| `gammaShort` | γ Shortage Penalty | ❌ | ✅ |

### BOM Fields
| Field Key | Label | Default: SALES | Default: DESIGN |
|---|---|:---:|:---:|
| `aluminumRate` | Aluminum Rate (₹/kg) | ❌ | ✅ |
| `sparePercentage` | Spare Percentage (%) | ❌ | ✅ |
| `moduleWp` | Module Wp (W) | ❌ | ✅ |
| `perItemCost` | Per-item cost override | ❌ | ✅ |
| `perItemAluminumRate` | Per-item aluminum rate override | ❌ | ✅ |

**Total: 27 controllable fields** across tab settings and BOM.

> MANAGER_DESIGN always has all 27 fields editable — locked in the UI, cannot be changed.

---

## Config Structure

This extends the existing `role_permissions` config (same `SystemConfig` table). The two coarse-grained switches `canEditAdvancedTab` and `canEditBomRates` are **removed** and replaced by `editableTabFields` and `editableBomFields` arrays.

Updated `role_permissions` structure:

```json
{
  "SALES": {
    "canUpdateMasterItem":  false,
    "canViewAllBoms":       false,
    "canEditDefaultNotes":  false,
    "canManageUsers":       false,
    "canAccessAdmin":       false,
    "editableTabFields": [
      "moduleLength", "moduleWidth", "frameThickness",
      "midClamp", "endClampWidth",
      "railsPerSide",
      "purlinDistance", "seamToSeamDistance", "maxSupportDistance",
      "enabledLengths", "priority"
    ],
    "editableBomFields": []
  },
  "DESIGN": {
    "canUpdateMasterItem":  true,
    "canViewAllBoms":       false,
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
    "canEditDefaultNotes":  false,
    "canManageUsers":       false,
    "canAccessAdmin":       false,
    "editableTabFields": [
      "moduleLength", "moduleWidth", "frameThickness",
      "midClamp", "endClampWidth",
      "railsPerSide",
      "purlinDistance", "seamToSeamDistance", "maxSupportDistance",
      "enabledLengths", "priority"
    ],
    "editableBomFields": []
  },
  "MANAGER_DESIGN": {
    "canUpdateMasterItem":  true,
    "canViewAllBoms":       true,
    "canEditDefaultNotes":  true,
    "canManageUsers":       true,
    "canAccessAdmin":       true,
    "editableTabFields": ["all"],
    "editableBomFields":  ["all"]
  }
}
```

> `"editableTabFields": ["all"]` is the special sentinel that means "no restrictions". Only used for MANAGER_DESIGN and is always locked.

---

## How the Permission Check Works (Backend)

### Old logic (current):
```
if role is in ADVANCED_ROLES → allow everything
else → deny all fields in ADVANCED_ONLY_SETTINGS_FIELDS
```

### New logic (dynamic):
```
load editableTabFields for this role
for each field being changed in the request:
  if field NOT in editableTabFields → deny with FORBIDDEN_FIELD
```

This is actually **simpler** than the current code because `tabPermissions.js` already loops through each field individually to validate it — we just change the condition from "is this field in the hardcoded advanced list" to "is this field NOT in the role's allowed list".

---

## Implementation Steps

---

### STEP 1 — No new DB schema needed

`SystemConfig` table (from `PERMISSIONS_IMPL_PLAN.md`) is reused. The `role_permissions` row just gets a new shape — arrays replace two boolean flags.

---

### STEP 2 — Update `permissionsService.js`

Add two new helpers:

```js
// Returns array of editable tab field keys for a role, or ['all']
async getEditableTabFields(role)

// Returns array of editable BOM field keys for a role, or ['all']
async getEditableBomFields(role)

// Returns true if role can edit this specific field
async canEditTabField(role, fieldKey)
async canEditBomField(role, fieldKey)
```

Implementation of `canEditTabField`:
```js
const fields = await this.getEditableTabFields(role);
if (fields.includes('all')) return true;
return fields.includes(fieldKey);
```

---

### STEP 3 — Update `tabPermissions.js` (backend)

**`enforceTabUpdatePermissions`** — replace the hardcoded `ADVANCED_ONLY_SETTINGS_FIELDS` check:

```js
// BEFORE — checks if role is in a hardcoded set
const ADVANCED_ROLES = new Set(['DESIGN', 'MANAGER']);
if (ADVANCED_ROLES.has(role)) return next();
// then loops through ADVANCED_ONLY_SETTINGS_FIELDS...

// AFTER — checks each field against the dynamic config
for (const field of Object.keys(settings)) {
  const allowed = await permissionsService.canEditTabField(role, field);
  if (!allowed && /* field value actually changed */) {
    return forbiddenField(res, field);
  }
}
```

**`sanitizeTabCreateForRole`** — replace hardcoded `DEFAULTS`:

```js
// AFTER — strips fields the role cannot edit on creation
const editableFields = await permissionsService.getEditableTabFields(role);
for (const field of ALL_TAB_SETTINGS_FIELDS) {
  if (!editableFields.includes('all') && !editableFields.includes(field)) {
    // Reset to admin-configured default
    req.body.settings[field] = tabDefaults[field];
  }
}
```

---

### STEP 4 — Update `bomPermissions.js` (backend)

**`enforceBomUpdatePermissions`** — replace `ADVANCED_ROLES.has(role)` checks with field-level:

```js
// BEFORE
if (ADVANCED_ROLES.has(role)) return next();
// then checks aluminumRate, sparePercentage, moduleWp, manualAluminumRate, costPerPiece

// AFTER
const canEditAlRate  = await permissionsService.canEditBomField(role, 'aluminumRate');
const canEditSpare   = await permissionsService.canEditBomField(role, 'sparePercentage');
const canEditModuleWp = await permissionsService.canEditBomField(role, 'moduleWp');
// ...then use these booleans in the existing comparison logic
```

**`forbidBasicMasterItemMutation`** — unchanged, still tied to `canUpdateMasterItem` feature permission.

---

### STEP 5 — Update `permissionsService.js` `hasPermission()` (Frontend Impact)

Remove `canEditAdvancedTab` and `canEditBomRates` from feature permissions.
Add `canEditTabField(fieldKey)` and `canEditBomField(fieldKey)` to the frontend `can()` helper.

**`AuthContext.jsx`** — extend the `can()` helper:

```js
// Existing feature permissions (boolean flags)
const can = (permissionKey) => {
  return permissions[user.role]?.[permissionKey] === true;
};

// NEW — field-level check
const canEditField = (fieldKey, fieldGroup = 'tab') => {
  const key = fieldGroup === 'bom' ? 'editableBomFields' : 'editableTabFields';
  const fields = permissions[user.role]?.[key] ?? [];
  return fields.includes('all') || fields.includes(fieldKey);
};
```

---

### STEP 6 — Update Frontend Components

Replace the coarse-grained checks with `canEditField()` calls.

**`GlobalInputs.jsx`** — currently uses `isBasicUser` to disable buffer:

```jsx
// BEFORE
const isBasicUser = user?.role === 'BASIC';
<NumberInputWithSpinner disabled={isBasicUser} />

// AFTER
const { canEditField } = useAuth();
<NumberInputWithSpinner disabled={!canEditField('buffer')} />
```

Apply to all fields that currently have an `isBasicUser` or `userMode === 'advanced'` guard:
- `buffer` in GlobalInputs
- `lengthsInput` (edit cut lengths section)
- All fields in SettingsPanel's Advanced card
- All Cost Settings fields in SettingsPanel
- BOM rate fields (aluminumRate, sparePercentage, moduleWp)
- Per-item cost and per-item aluminum rate override inputs in BOMTableRow

**`api.js` — `sanitizeTabSettingsForRole`:**

```js
// BEFORE
const sanitizeTabSettingsForRole = (settings, role) => {
  if (role !== 'BASIC') return settings;
  // strip fields...
};

// AFTER — reads field list from permissions config
const sanitizeTabSettingsForRole = (settings, editableTabFields) => {
  if (editableTabFields.includes('all')) return settings;
  const sanitized = { ...settings };
  for (const key of Object.keys(sanitized)) {
    if (!editableTabFields.includes(key)) delete sanitized[key];
  }
  return sanitized;
};
```

---

### STEP 7 — Admin Panel UI — Field Permissions Table

**File:** `knapsack-front/src/pages/AdminPanel.jsx`

In the existing **Permissions tab** (from `PERMISSIONS_IMPL_PLAN.md`), the current table shows 7 feature permission rows. Extend it with a second section below for field-level control.

#### UI Concept

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Permissions Tab                                                         │
│                                                                          │
│  ── Feature Permissions ─────────────────────────────────────────────  │
│  (same 5-row table from PERMISSIONS_IMPL_PLAN — canViewAllBoms etc.)    │
│                                                                          │
│  ── Field-Level Edit Control ────────────────────────────────────────  │
│  Control which input fields each role can edit.                         │
│                                                                          │
│  ▼ Module Parameters                                                     │
│  ┌──────────────────────────┬────────┬────────┬──────────┬──────────┐  │
│  │ Field                    │ Sales  │ Design │ Mgr(S)   │ Mgr(D)   │  │
│  ├──────────────────────────┼────────┼────────┼──────────┼──────────┤  │
│  │ Module Length            │  [✓]   │  [✓]   │   [✓]   │  [✓] 🔒  │  │
│  │ Module Width             │  [✓]   │  [✓]   │   [✓]   │  [✓] 🔒  │  │
│  │ Frame Thickness          │  [✓]   │  [✓]   │   [✓]   │  [✓] 🔒  │  │
│  │ Mid Clamp Gap            │  [✓]   │  [✓]   │   [✓]   │  [✓] 🔒  │  │
│  │ End Clamp Width          │  [✓]   │  [✓]   │   [✓]   │  [✓] 🔒  │  │
│  └──────────────────────────┴────────┴────────┴──────────┴──────────┘  │
│                                                                          │
│  ▼ MMS / Structural                                                      │
│  ┌──────────────────────────┬────────┬────────┬──────────┬──────────┐  │
│  │ Buffer after End Clamp   │  [ ]   │  [✓]   │   [ ]   │  [✓] 🔒  │  │
│  │ Rails per Side           │  [✓]   │  [✓]   │   [✓]   │  [✓] 🔒  │  │
│  └──────────────────────────┴────────┴────────┴──────────┴──────────┘  │
│                                                                          │
│  ▼ Cut Lengths                                                           │
│  ┌──────────────────────────┬────────┬────────┬──────────┬──────────┐  │
│  │ Toggle lengths on/off    │  [✓]   │  [✓]   │   [✓]   │  [✓] 🔒  │  │
│  │ Edit lengths list        │  [ ]   │  [✓]   │   [ ]   │  [✓] 🔒  │  │
│  └──────────────────────────┴────────┴────────┴──────────┴──────────┘  │
│                                                                          │
│  ▼ Optimizer / Cost Settings  (collapsed by default)                    │
│  ▼ Advanced Optimizer         (collapsed by default)                    │
│  ▼ BOM Rate Fields            (collapsed by default)                    │
│                                                                          │
│                                              [Save Permissions]          │
└─────────────────────────────────────────────────────────────────────────┘
```

**UX details:**
- Groups are collapsible — less overwhelming
- MANAGER_DESIGN column is always all-checked with lock icon, toggles disabled
- Single "Save Permissions" button saves both the feature flags AND the field arrays together (one API call)

---

## Files Changed Summary

| File | Change |
|---|---|
| `backend/src/services/permissionsService.js` | Add `canEditTabField`, `canEditBomField`, `getEditableTabFields`, `getEditableBomFields` |
| `backend/src/middleware/tabPermissions.js` | Replace `ADVANCED_ONLY_SETTINGS_FIELDS` loop with dynamic field check |
| `backend/src/middleware/bomPermissions.js` | Replace `ADVANCED_ROLES` check with per-field `canEditBomField` calls |
| `knapsack-front/src/context/AuthContext.jsx` | Add `canEditField(fieldKey, group)` alongside existing `can()` |
| `knapsack-front/src/services/api.js` | Update `sanitizeTabSettingsForRole` to use field list |
| `knapsack-front/src/components/GlobalInputs.jsx` | Replace `isBasicUser` with `canEditField('buffer')` etc. |
| `knapsack-front/src/components/SettingsPanel.jsx` | Replace `userMode === 'advanced'` with `canEditField` per field |
| `knapsack-front/src/components/BOM/BOMTableRow.jsx` | Replace `isBasicUser` with `canEditField('perItemCost', 'bom')` etc. |
| `knapsack-front/src/pages/AdminPanel.jsx` | Extend Permissions tab with the field-level table section |

**Total: 9 files** — all already being modified for the permissions feature. Zero new files needed.

---

## Difficulty Rating

| Step | Difficulty | Notes |
|---|---|---|
| Steps 1–2 — Service helpers | Low | 4 helper functions, same pattern |
| Step 3 — tabPermissions middleware | Low–Medium | Replaces the existing loop logic, cleaner than before |
| Step 4 — bomPermissions middleware | Low | 3 field checks already exist, just make them conditional |
| Step 5 — AuthContext canEditField | Low | 10-line addition to existing helper |
| Step 6 — Frontend components (4 files) | Low | Swap `isBasicUser` → `canEditField('x')` per field |
| Step 7 — Admin Panel UI table extension | Medium | More rows, collapsible groups, same toggle pattern |

**Overall: Low–Medium** — This is simpler than the base permissions feature because:
- Same infrastructure, same patterns, no new files
- The backend middleware is actually **simpler** after this change (no more hardcoded field lists)
- The frontend changes are mechanical (`isBasicUser` → `canEditField('buffer')`)
- The Admin UI is just extending the permissions table already being built

---

## Combined Picture of All Three Plans

At this point you have three layered features that all share the same infrastructure:

```
SystemConfig table (one DB table, multiple keys)
├── key: 'role_permissions'  →  feature flags + editableFields arrays
└── key: 'app_defaults'      →  default values for all parameters

configService (one backend service)
├── getPermissions / hasPermission / canEditTabField / canEditBomField
└── getAppDefaults / getTabDefaults / getBomDefaults

configRoutes (one route file)
├── GET/PUT /api/config/permissions
└── GET/PUT /api/config/defaults

AuthContext (one frontend context)
├── can('canAccessAdmin')         — feature permission
├── canEditField('buffer')        — field-level permission
└── appDefaults.tabDefaults.buffer — default values

AdminPanel (one page, 4 tabs)
├── Users
├── BOMs
├── Permissions  (feature flags + field-level table)
└── App Defaults (default values form)
```

Everything builds on the same foundation. Implement in order:
1. `PERMISSIONS_IMPL_PLAN.md` — base feature (permissions + field-level)
2. `APP_DEFAULTS_IMPL_PLAN.md` — defaults config (mostly reuse)
3. `ROLE_CHANGE_PLAN.md` — the 4-role rename (can be done alongside #1)
