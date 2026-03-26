# Master Implementation Plan — Roles, Permissions & App Defaults
### Knapsack BOM Tool

> **Last Updated:** 2026-03-25
> **Status:** Ready to implement
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

### Current (3 roles)
| Role String | Who |
|---|---|
| `BASIC` | Standard user |
| `DESIGN` | Advanced user |
| `MANAGER` | Admin |

### New (4 roles)
| Role String | Who | Maps From |
|---|---|---|
| `SALES` | Standard user | `BASIC` (rename) |
| `DESIGN` | Advanced user | `DESIGN` (no change) |
| `MANAGER_SALES` | Sales manager | New role (starts restricted, configurable) |
| `MANAGER_DESIGN` | Design manager / Admin | `MANAGER` (rename) |

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

Two `canEdit*` boolean flags from the original plan are **replaced** by field arrays (from Field Permissions plan). This is the final shape of `role_permissions`:

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
| `canViewAllBoms` | View every BOM from every user in Admin BOM tab |
| `canViewSalesBoms` | View BOMs created by SALES-role users only |
| `canViewDesignBoms` | View BOMs created by DESIGN-role users only |
| `canEditDefaultNotes` | Edit global default notes & variation template notes |
| `canManageUsers` | Create, delete, reset password, activate/hold users |
| `canAccessAdmin` | Access the Admin Panel at all |

> **BOM visibility combines:** If a role has both `canViewSalesBoms` and `canViewDesignBoms`, they see both pools merged. `canViewAllBoms` overrides all three and bypasses filtering entirely.

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

## 5. The App Defaults Config Structure

Stored as `key = 'app_defaults'` in the same `SystemConfig` table:

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

> Changing these does NOT affect existing tabs or BOMs. Only new creations use the updated defaults. "Reset to Defaults" button in GlobalInputs also uses these values.

---

## 6. Implementation Steps — In Order

---

### PHASE A — Database

#### A1. Run DB Migration SQL (one-time, on server)

```sql
-- Rename BASIC users to SALES
UPDATE users SET role = 'SALES' WHERE role = 'BASIC';

-- Rename MANAGER users to MANAGER_DESIGN
UPDATE users SET role = 'MANAGER_DESIGN' WHERE role = 'MANAGER';

-- DESIGN users: no change needed
-- MANAGER_SALES: new role, no existing users to migrate
```

#### A2. Add SystemConfig Table

**File:** `backend/prisma/schema.prisma`

Add at the bottom:
```prisma
model SystemConfig {
  key       String   @id @db.VarChar(100)
  value     Json
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("system_config")
}
```

Also update the `User` model role comment:
```prisma
// Before
role String @default("BASIC") @db.VarChar(20) // BASIC, DESIGN, MANAGER

// After
role String @default("SALES") @db.VarChar(20) // SALES, DESIGN, MANAGER_SALES, MANAGER_DESIGN
```

Run:
```bash
npx prisma migrate dev --name add_system_config_and_rename_roles
npx prisma generate
```

#### A3. Update Seed File

**File:** `backend/prisma/seed_auth.js`

Change seed user role from `MANAGER` → `MANAGER_DESIGN`.

---

### PHASE B — Backend: Shared Infrastructure

#### B1. Create `configService.js`

**New file:** `backend/src/services/configService.js`

Full API of the service:

```
configService
  ├── _cache = { permissions: null, defaults: null }
  │
  ├── // Permissions
  ├── getPermissions()                   → full role_permissions object (cached)
  ├── hasPermission(role, key)           → boolean (e.g. canManageUsers)
  ├── canEditTabField(role, fieldKey)    → boolean (checks editableTabFields array)
  ├── canEditBomField(role, fieldKey)    → boolean (checks editableBomFields array)
  ├── updatePermissions(data)            → saves to DB, clears permissions cache
  │
  ├── // App Defaults
  ├── getAppDefaults()                   → full app_defaults object (cached)
  ├── getTabDefaults()                   → appDefaults.tabDefaults
  ├── getBomDefaults()                   → appDefaults.bomDefaults
  └── updateAppDefaults(data)            → saves to DB, clears defaults cache
```

**Self-seeding:** If `role_permissions` row is missing, auto-insert the default config from Section 4. If `app_defaults` row is missing, auto-insert defaults from Section 5. No manual seed step needed — works on first API call.

**Caching:** Module-level `_cache` object. Cleared on each `update*` call. No DB hit on every request.

#### B2. Create `configRoutes.js`

**New file:** `backend/src/routes/configRoutes.js`

```
GET  /api/config/permissions
     → authenticateToken (any logged-in user)
     → Returns full permissions config
     → Frontend loads on login

PUT  /api/config/permissions
     → authenticateToken + authorizeRoles('MANAGER_DESIGN')
     → Server-side safety: reject if MANAGER_DESIGN.canManageUsers === false
     → Server-side safety: reject if MANAGER_DESIGN.canAccessAdmin === false
     → Calls configService.updatePermissions(req.body)
     → Returns updated config

GET  /api/config/defaults
     → authenticateToken (any logged-in user)
     → Returns full app_defaults config
     → Frontend loads on login

PUT  /api/config/defaults
     → authenticateToken + authorizeRoles('MANAGER_DESIGN')
     → Validates values are within sane ranges (no negative lengths, etc.)
     → Calls configService.updateAppDefaults(req.body)
     → Returns updated config
```

#### B3. Register Routes

**File:** `backend/src/server.js`

```js
const configRoutes = require('./routes/configRoutes');
app.use('/api/config', configRoutes);
```

---

### PHASE C — Backend: Middleware Updates

#### C1. `authMiddleware.js` — Add `requirePermission`

**File:** `backend/src/middleware/authMiddleware.js`

Add new export alongside existing `authorizeRoles`:

```js
const configService = require('../services/configService');

exports.requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    const role = req.user?.role;
    const allowed = await configService.hasPermission(role, permissionKey);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });
    next();
  };
};
```

#### C2. `tabPermissions.js` — Dynamic field list + dynamic defaults

**File:** `backend/src/middleware/tabPermissions.js`

**`enforceTabUpdatePermissions`:**
```js
// BEFORE
const ADVANCED_ROLES = new Set(['DESIGN', 'MANAGER']);
if (ADVANCED_ROLES.has(role)) return next();
// ...loops through ADVANCED_ONLY_SETTINGS_FIELDS

// AFTER
const editableFields = await configService.getEditableTabFields(role) // from canEditTabField
// For each field being changed, check if it's in editableFields
for (const field of Object.keys(settings)) {
  const allowed = await configService.canEditTabField(role, field);
  if (!allowed && /* value actually changed vs stored */) {
    return forbiddenField(res, field);
  }
}
```

**`sanitizeTabCreateForRole`:**
```js
// BEFORE
const DEFAULTS = { buffer: 15, lengthsInput: '...' };
req.body.settings.buffer = DEFAULTS.buffer;

// AFTER
const tabDefs = await configService.getTabDefaults();
const editableFields = await configService.getEditableTabFields(role);
for (const field of ALL_TAB_SETTINGS_FIELDS) {
  if (!editableFields.includes('all') && !editableFields.includes(field)) {
    req.body.settings[field] = tabDefs[field]; // reset to admin-configured default
  }
}
```

#### C3. `bomPermissions.js` — Dynamic field checks + dynamic defaults

**File:** `backend/src/middleware/bomPermissions.js`

**`enforceBomUpdatePermissions`:**
```js
// BEFORE
const ADVANCED_ROLES = new Set(['DESIGN', 'MANAGER']);
if (ADVANCED_ROLES.has(role)) return next();
// ...checks aluminumRate, sparePercentage, moduleWp vs DEFAULT_*

// AFTER — per-field checks with dynamic defaults as baseline
const bomDefs = await configService.getBomDefaults();
const canEditAlRate = await configService.canEditBomField(role, 'aluminumRate');
const canEditSpare  = await configService.canEditBomField(role, 'sparePercentage');
const canEditWp     = await configService.canEditBomField(role, 'moduleWp');

const currentAluminumRate = toNullableNumber(currentMeta.aluminumRate) ?? bomDefs.aluminumRate;
// ...then use the same existing comparison logic, gated by the boolean above
```

`forbidBasicMasterItemMutation` → unchanged in structure, just check `canUpdateMasterItem` via `configService.hasPermission(role, 'canUpdateMasterItem')`.

---

### PHASE D — Backend: Route Updates

Replace `authorizeRoles('MANAGER')` with `requirePermission(key)` in 4 route files:

| File | Current | Replace with |
|---|---|---|
| `src/routes/userRoutes.js` | `authorizeRoles('MANAGER')` | `requirePermission('canManageUsers')` |
| `src/routes/savedBomRoutes.js` | `authorizeRoles('MANAGER')` on `/all` | Custom `canViewBoms` middleware (see below) |
| `src/routes/defaultNotesRoutes.js` | `authorizeRoles('MANAGER')` on POST/PUT/DELETE | `requirePermission('canEditDefaultNotes')` |
| `src/routes/templateRoutes.js` | `authorizeRoles('MANAGER')` on PUT | `requirePermission('canEditDefaultNotes')` |

#### Special case: `savedBomRoutes.js` — BOM View Scope Middleware

The `/all` route cannot use a single `requirePermission` call because three separate flags (`canViewAllBoms`, `canViewSalesBoms`, `canViewDesignBoms`) all grant access — just with different scopes. Use a custom inline middleware instead:

```js
// savedBomRoutes.js
const canViewBoms = async (req, res, next) => {
  const role = req.user?.role;
  const canAll    = await configService.hasPermission(role, 'canViewAllBoms');
  const canSales  = await configService.hasPermission(role, 'canViewSalesBoms');
  const canDesign = await configService.hasPermission(role, 'canViewDesignBoms');

  if (!canAll && !canSales && !canDesign)
    return res.status(403).json({ error: 'Access denied' });

  if (canAll) {
    req.bomViewScope = 'all';
  } else {
    const roles = [];
    if (canSales)  roles.push('SALES');
    if (canDesign) roles.push('DESIGN');
    req.bomViewRoles = roles; // e.g. ['SALES'], ['DESIGN'], or ['SALES', 'DESIGN']
  }
  next();
};

router.get('/all', canViewBoms, savedBomController.getAllSavedBoms);
```

#### `savedBomService.js` — Add Filtered Method

```js
// New method alongside existing getAllSavedBoms()
async getSavedBomsByRoles(roles) {
  return prisma.savedBom.findMany({
    where: { user: { role: { in: roles } } }, // Prisma supports array natively
    include: {
      project: { select: { id: true, name: true, clientName: true, projectId: true, longRailVariation: true, createdAt: true } },
      user:    { select: { id: true, username: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });
}
```

#### `savedBomController.js` — Read Scope

```js
async getAllSavedBoms(req, res) {
  const savedBoms = req.bomViewScope === 'all'
    ? await savedBomService.getAllSavedBoms()
    : await savedBomService.getSavedBomsByRoles(req.bomViewRoles);
  res.json(savedBoms);
}
```

> **Frontend — zero changes needed.** `BOMManagementTab.jsx` calls the same `GET /api/saved-boms/all` endpoint and just displays whatever the server returns. The filtering is 100% server-side.

---

### PHASE E — Backend: Tab Service Defaults

**File:** `backend/src/services/tabService.js`

`createTab` currently uses hardcoded `||` fallbacks. Replace with dynamic defaults using `??` (nullish coalescing, so `0` is valid):

```js
// BEFORE
buffer: parseInt(settings?.buffer || 15),
alphaJoint: parseInt(settings?.alphaJoint || 220),
// ...same pattern for all 20 fields

// AFTER
const tabDefs = await configService.getTabDefaults();
buffer: parseInt(settings?.buffer ?? tabDefs.buffer),
alphaJoint: parseInt(settings?.alphaJoint ?? tabDefs.alphaJoint),
// ...same pattern for all 20 fields
```

---

### PHASE F — Frontend: AuthContext + api.js

**File:** `knapsack-front/src/services/api.js`

Add `configAPI` alongside existing API objects:
```js
export const configAPI = {
  getPermissions: () => apiClient.get('/config/permissions').then(r => r.data),
  updatePermissions: (cfg) => apiClient.put('/config/permissions', cfg).then(r => r.data),
  getDefaults: () => apiClient.get('/config/defaults').then(r => r.data),
  updateDefaults: (cfg) => apiClient.put('/config/defaults', cfg).then(r => r.data),
};
```

Also update `sanitizeTabSettingsForRole` to use the field list instead of hardcoded role check:
```js
// BEFORE
const sanitizeTabSettingsForRole = (settings, role) => {
  if (role !== 'BASIC') return settings;
  // strip advanced fields...
};

// AFTER
const sanitizeTabSettingsForRole = (settings, editableTabFields) => {
  if (editableTabFields.includes('all')) return settings;
  const sanitized = { ...settings };
  for (const key of Object.keys(sanitized)) {
    if (!editableTabFields.includes(key)) delete sanitized[key];
  }
  return sanitized;
};
```

**File:** `knapsack-front/src/context/AuthContext.jsx`

On login and on `initAuth`, fetch permissions and defaults in parallel:

```js
const [permissions, setPermissions] = useState(null);
const [appDefaults, setAppDefaults] = useState(null);

// In initAuth, after setUser(userData):
const [permsData, defaultsData] = await Promise.all([
  configAPI.getPermissions(),
  configAPI.getDefaults()
]);
setPermissions(permsData);
setAppDefaults(defaultsData);

// Feature permission check
const can = (permissionKey) => {
  if (!user || !permissions) return false;
  return permissions[user.role]?.[permissionKey] === true;
};

// Field-level permission check
const canEditField = (fieldKey, fieldGroup = 'tab') => {
  if (!user || !permissions) return false;
  const key = fieldGroup === 'bom' ? 'editableBomFields' : 'editableTabFields';
  const fields = permissions[user.role]?.[key] ?? [];
  return fields.includes('all') || fields.includes(fieldKey);
};

// Expose: { user, permissions, appDefaults, can, canEditField, login, logout, refreshUser, loading, isAuthenticated }
```

---

### PHASE G — Frontend: Replace Hardcoded Role Checks (14 files)

Replace all hardcoded role string comparisons with `can()` and `canEditField()` from AuthContext.

#### Full Mapping

| File | Old check | New check |
|---|---|---|
| `Router.jsx` | `roles={['MANAGER']}` | `can('canAccessAdmin')` in ProtectedRoute |
| `App.jsx` | `role === 'BASIC'` | `!can('canUpdateMasterItem')` or relevant key |
| `services/api.js` | `role !== 'BASIC'` in sanitize | `editableTabFields` from context (done in Phase F) |
| `pages/AdminPanel.jsx` | Role dropdown `BASIC/DESIGN/MANAGER` | Update to `SALES/DESIGN/MANAGER_SALES/MANAGER_DESIGN` |
| `pages/HomePage.jsx` | `role === 'MANAGER'` (admin link) | `can('canAccessAdmin')` |
| `components/GlobalInputs.jsx` | `isBasicUser` → buffer disabled | `!canEditField('buffer')` |
| `components/GlobalInputs.jsx` | `isBasicUser` → lengthsInput hidden | `!canEditField('lengthsInput')` |
| `components/RailTable.jsx` | `role === 'BASIC'` checks | `canEditField(fieldKey)` per field |
| `components/ResultCard.jsx` | `userMode === 'advanced'` | `canEditField('costPerMm')` or similar |
| `components/SettingsPanel.jsx` | `userMode === 'advanced'` for Advanced card | `canEditField('maxWastePct')` or any advanced field |
| `components/SettingsPanel.jsx` | `userMode === 'advanced'` for Cost Settings | `canEditField('costPerMm')` |
| `components/BOM/BOMPage.jsx` | `isBasicUser` for BOM rate fields | `canEditField('aluminumRate', 'bom')` |
| `components/BOM/BOMTableRow.jsx` | `isBasicUser` for per-item cost | `canEditField('perItemCost', 'bom')` |
| `components/BOM/NotesSection.jsx` | `isManager` | `can('canEditDefaultNotes')` |
| `components/BOM/ReviewChangesModal.jsx` | `canUpdateMaster` | `can('canUpdateMasterItem')` |
| `components/BOM/ShareBOMModal.jsx` | `['ALL', 'BASIC', 'DESIGN', 'MANAGER']` | `['ALL', 'SALES', 'DESIGN', 'MANAGER_SALES', 'MANAGER_DESIGN']` |

---

### PHASE H — Frontend: Replace Hardcoded Defaults in Components

**File:** `knapsack-front/src/components/GlobalInputs.jsx`

`handleResetToDefaults` — replace hardcoded values with context:
```js
// BEFORE
setSettings(prev => ({ ...prev, moduleLength: 2278, buffer: 15, ...etc }));

// AFTER
const { appDefaults } = useAuth();
setSettings(prev => ({ ...prev, ...appDefaults.tabDefaults }));
setModuleWp(appDefaults.bomDefaults.moduleWp);
```

**File:** `knapsack-front/src/components/SettingsPanel.jsx`

`handleReset` — replace `DEFAULT_SETTINGS` with `appDefaults.tabDefaults`.

**File:** `knapsack-front/src/lib/storage.js`

Keep `DEFAULT_SETTINGS` as factory fallback (used only if the API hasn't loaded yet). Add helper:
```js
export const getEffectiveDefaults = (appDefaults) =>
  appDefaults?.tabDefaults
    ? { ...DEFAULT_SETTINGS, ...appDefaults.tabDefaults }
    : DEFAULT_SETTINGS;
```

---

### PHASE I — Frontend: Admin Panel UI (New Tabs)

**File:** `knapsack-front/src/pages/AdminPanel.jsx`

Add two new tabs, visible only to `user.role === 'MANAGER_DESIGN'`:

---

#### Tab 3 — Permissions

Two sections on one tab:

**Section A — Feature Permissions** (7 rows × 4 role columns):

```
┌──────────────────────┬────────┬────────┬──────────────┬──────────┐
│ Permission           │ Sales  │ Design │ Mgr (Sales)  │ Mgr (Des)│
├──────────────────────┼────────┼────────┼──────────────┼──────────┤
│ Update Master DB     │  [ ]   │  [✓]   │     [ ]      │  [✓] 🔒  │
│ View All BOMs        │  [ ]   │  [ ]   │     [ ]      │  [✓] 🔒  │
│ View Sales BOMs      │  [ ]   │  [ ]   │     [✓]      │  [✓] 🔒  │
│ View Design BOMs     │  [ ]   │  [ ]   │     [ ]      │  [✓] 🔒  │
│ Edit Default Notes   │  [ ]   │  [ ]   │     [ ]      │  [✓] 🔒  │
│ Manage Users         │  [ ]   │  [ ]   │     [ ]      │  [✓] 🔒  │
│ Access Admin Panel   │  [ ]   │  [ ]   │     [ ]      │  [✓] 🔒  │
└──────────────────────┴────────┴────────┴──────────────┴──────────┘
```

> Note: "View All BOMs" overrides the two scoped rows. If "View All BOMs" is checked, the Sales/Design rows are ignored. Consider greying them out in the UI when "View All BOMs" is on.

**Section B — Field-Level Edit Control** (27 rows × 4 columns, grouped and collapsible):

```
▼ Module Parameters
  Module Length    [✓] [✓] [✓] [🔒]
  Module Width     [✓] [✓] [✓] [🔒]
  Frame Thickness  [✓] [✓] [✓] [🔒]
  Mid Clamp Gap    [✓] [✓] [✓] [🔒]
  End Clamp Width  [✓] [✓] [✓] [🔒]

▼ MMS / Structural
  Buffer           [ ] [✓] [ ] [🔒]
  Rails per Side   [✓] [✓] [✓] [🔒]

▼ Site Parameters
  Purlin Distance  [✓] [✓] [✓] [🔒]
  Seam to Seam     [✓] [✓] [✓] [🔒]
  Max Support Dist [✓] [✓] [✓] [🔒]

▼ Cut Lengths
  Toggle on/off    [✓] [✓] [✓] [🔒]
  Edit list        [ ] [✓] [ ] [🔒]

▶ Optimizer / Cost Settings  (collapsed by default)
▶ Advanced Optimizer          (collapsed by default)
▶ BOM Rate Fields             (collapsed by default)

                                      [Save Permissions]
```

**Safety rules (also enforced server-side):**
- `MANAGER_DESIGN` column is always all-checked, all toggles disabled
- `MANAGER_DESIGN.canManageUsers` and `canAccessAdmin` are always `true` — protected against lockout

---

#### Tab 4 — App Defaults

```
┌──────────────────────────────────────────────────────────────────┐
│  App Defaults                                                     │
│  Used when any user creates a new tab or BOM.                    │
│  Existing tabs and BOMs are NOT affected.                        │
│                                                                  │
│  ┌─ BOM Rates & Specs ─────────────────────────────────────┐    │
│  │  Aluminum Rate (₹/kg) [460]   HDG Rate (₹/kg)  [125]   │    │
│  │  Magnelis Rate (₹/kg) [125]   Module Wp (W)     [590]   │    │
│  │  Spare Percentage (%) [1.0]                              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─ Module Parameters ─────────────────────────────────────┐    │
│  │  Module Length [2278]    Module Width     [1134]         │    │
│  │  Frame Thickness [35]    Mid Clamp Gap    [20]           │    │
│  │  End Clamp Width [40]                                    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─ Structural Parameters ─────────────────────────────────┐    │
│  │  Buffer (mm)     [15]    Rails per Side   [2]            │    │
│  │  Purlin Distance [1700]  Seam to Seam     [400]          │    │
│  │  Max Support     [1800]                                  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─ Optimizer Settings ────────────────────────────────────┐    │
│  │  Cut Lengths  [1595, 1798, 2400, 2750, 3600, 4800]      │    │
│  │  Max Pieces [3]  Cost/mm [0.1]  Cost/Joint [50]         │    │
│  │  Joiner Length [100]    Max Waste % [  ]                 │    │
│  │  α [220]  β [60]  Undershoot% [0]  γ [5]               │    │
│  │  Priority: (●) Cost  ( ) Length  ( ) Joints             │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│       [Reset to Factory Defaults]      [Save App Defaults]      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Complete Files Changed

### New Files (3)
| File | Purpose |
|---|---|
| `backend/src/services/configService.js` | All config read/write/cache logic |
| `backend/src/routes/configRoutes.js` | GET/PUT endpoints for permissions and defaults |
| `backend/prisma/migrations/*/migration.sql` | Auto-generated by `prisma migrate dev` |

### Modified Files (27)

**Backend:**
| File | What Changes |
|---|---|
| `prisma/schema.prisma` | Add `SystemConfig` model, update `User` role comment |
| `prisma/seed_auth.js` | Seed user role `MANAGER` → `MANAGER_DESIGN` |
| `src/server.js` | Register `/api/config` routes |
| `src/middleware/authMiddleware.js` | Add `requirePermission` export |
| `src/middleware/tabPermissions.js` | Dynamic field list + dynamic defaults (replaces `ADVANCED_ROLES` + `DEFAULTS`) |
| `src/middleware/bomPermissions.js` | Per-field checks + dynamic BOM defaults (replaces `ADVANCED_ROLES` + hardcoded constants) |
| `src/routes/userRoutes.js` | `authorizeRoles('MANAGER')` → `requirePermission('canManageUsers')` |
| `src/routes/savedBomRoutes.js` | Replace `authorizeRoles('MANAGER')` with `canViewBoms` scope middleware |
| `src/services/savedBomService.js` | Add `getSavedBomsByRoles(roles)` method with `where: { user: { role: { in: roles } } }` |
| `src/controllers/savedBomController.js` | `getAllSavedBoms` reads `req.bomViewScope` to call correct service method |
| `src/routes/defaultNotesRoutes.js` | `authorizeRoles('MANAGER')` → `requirePermission('canEditDefaultNotes')` |
| `src/routes/templateRoutes.js` | `authorizeRoles('MANAGER')` → `requirePermission('canEditDefaultNotes')` |
| `src/services/tabService.js` | `settings?.x \|\| hardcoded` → `settings?.x ?? tabDefs.x` (20 fields) |

**Frontend:**
| File | What Changes |
|---|---|
| `src/context/AuthContext.jsx` | Load permissions + defaults, expose `can()`, `canEditField()`, `appDefaults` |
| `src/services/api.js` | Add `configAPI`, update `sanitizeTabSettingsForRole` |
| `src/Router.jsx` | Admin route guard uses `can('canAccessAdmin')` |
| `src/App.jsx` | Role checks → `can()` calls |
| `src/pages/AdminPanel.jsx` | Role dropdown updated, add Permissions tab + App Defaults tab |
| `src/pages/HomePage.jsx` | Admin link uses `can('canAccessAdmin')` |
| `src/lib/storage.js` | Add `getEffectiveDefaults()` helper |
| `src/components/GlobalInputs.jsx` | `isBasicUser` → `canEditField()`, reset uses `appDefaults` |
| `src/components/RailTable.jsx` | Role checks → `canEditField()` |
| `src/components/ResultCard.jsx` | `userMode` → `canEditField()` |
| `src/components/SettingsPanel.jsx` | `userMode` → `canEditField()`, reset uses `appDefaults` |
| `src/components/BOM/BOMPage.jsx` | `isBasicUser` → `canEditField('...', 'bom')` |
| `src/components/BOM/BOMTableRow.jsx` | `isBasicUser` → `canEditField('perItemCost', 'bom')` |
| `src/components/BOM/NotesSection.jsx` | `isManager` → `can('canEditDefaultNotes')` |
| `src/components/BOM/ReviewChangesModal.jsx` | `canUpdateMaster` → `can('canUpdateMasterItem')` |
| `src/components/BOM/ShareBOMModal.jsx` | Role filter array updated for 4 new role strings |

**Total: 3 new + 29 modified = 32 files**

---

## 8. Implementation Order

Execute phases in this order. Each phase is safe to ship independently — no phase breaks the app mid-way.

```
Phase A  →  DB migration (SQL on server) + Prisma schema + seed file
Phase B  →  configService + configRoutes + server.js registration
Phase C  →  Middleware: authMiddleware, tabPermissions, bomPermissions
Phase D  →  Route files: 4 route files updated
Phase E  →  tabService: dynamic defaults for createTab
Phase F  →  Frontend: api.js configAPI + AuthContext
Phase G  →  Frontend: replace all hardcoded role checks (14 files)
Phase H  →  Frontend: replace hardcoded defaults in reset functions
Phase I  →  Frontend: Admin Panel — Permissions tab + App Defaults tab
```

> **Safe stopping point after Phase B:** Backend is fully dynamic, defaults match current behavior exactly. Old frontend still works because nothing is broken, just not yet using the new endpoints.

> **Safe stopping point after Phase D:** All backend auth is dynamic. Deploy and test backend before touching frontend.

---

## 9. Difficulty Summary

| Phase | Effort | Notes |
|---|---|---|
| A — DB | Low | SQL + one Prisma model |
| B — Infrastructure | Low | New patterns but not complex |
| C — Middleware | Medium | Async changes, but logic is cleaner after |
| D — Routes | Low | 4-line changes per file |
| E — tabService | Low | Mechanical substitution, 20 fields |
| F — AuthContext | Low | Parallel fetch + two helper functions |
| G — Role checks (14 files) | Medium | Repetitive but mechanical |
| H — Default resets | Low | 2 files, swap one object reference |
| I — Admin Panel UI | Medium | Most UI work is in field-level table |

**Overall: Medium** — The only genuinely non-trivial parts are the middleware async changes (Phase C) and building the collapsible field-level table UI (Phase I). Everything else is structured, mechanical work.

---

## 10. What Manager(Design) Gets

After this is built, Manager(Design) can:

1. **Go to Admin Panel → Permissions tab**
   - Toggle which features each role has (View All BOMs, Manage Users, etc.)
   - Toggle which specific input fields each role can edit (buffer, aluminum rate, etc.)
   - Hit Save → changes take effect immediately, no deployment needed

2. **Go to Admin Panel → App Defaults tab**
   - Change any default value (aluminum rate, buffer, cut lengths, module dimensions, etc.)
   - Hit Save → all new tabs/BOMs created by any user will use these values
   - "Reset to Factory Defaults" button restores the original hardcoded values

3. **Configure Manager(Sales) permissions independently** without waiting for a dev
   - Start from SALES-equivalent (fully restricted)
   - Gradually grant access: maybe give them `canViewAllBoms`, `canManageUsers`, and a few BOM fields
   - No code change, no deployment, instant effect
