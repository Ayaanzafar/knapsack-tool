# Dynamic Role Permissions — Implementation Plan

> **Status: READY TO IMPLEMENT**
> **Scope:** Add a Permissions tab to AdminPanel where Manager(Design) can configure what each role can do.
> **Prerequisite:** The 4-role rename (BASIC→SALES, MANAGER→MANAGER_DESIGN, new MANAGER_SALES) should be done first, but can be done together in one pass.

---

## What We're Building

A single **permissions config** row stored in the DB. Manager(Design) edits it via a new **Permissions tab** in the Admin Panel. Every role check in the backend middleware and frontend components reads from this config instead of hardcoded strings.

---

## The 7 Permission Keys

These are derived directly from what the current code gates behind role checks:

| Key | What it controls | Current: BASIC/SALES | Current: DESIGN | Current: MANAGER |
|-----|-----------------|:--------------------:|:---------------:|:----------------:|
| `canEditAdvancedTab` | Buffer, cut lengths, costs, maxPieces, waste%, joint settings | ❌ | ✅ | ✅ |
| `canEditBomRates` | Aluminum rate, spare %, module Wp, per-item cost/rate overrides | ❌ | ✅ | ✅ |
| `canUpdateMasterItem` | "Apply to Future" (update master DB from BOM) | ❌ | ✅ | ✅ |
| `canViewAllBoms` | View all BOMs across all users (Admin BOM tab) | ❌ | ❌ | ✅ |
| `canEditDefaultNotes` | Edit global default notes & variation template notes | ❌ | ❌ | ✅ |
| `canManageUsers` | Create, delete, reset password, activate/hold users | ❌ | ❌ | ✅ |
| `canAccessAdmin` | Access the Admin Panel page at all | ❌ | ❌ | ✅ |

These 7 keys cover **every** single role check in the codebase.

---

## Default Config (Matches Exact Current Behavior)

```json
{
  "SALES": {
    "canEditAdvancedTab":   false,
    "canEditBomRates":      false,
    "canUpdateMasterItem":  false,
    "canViewAllBoms":       false,
    "canEditDefaultNotes":  false,
    "canManageUsers":       false,
    "canAccessAdmin":       false
  },
  "DESIGN": {
    "canEditAdvancedTab":   true,
    "canEditBomRates":      true,
    "canUpdateMasterItem":  true,
    "canViewAllBoms":       false,
    "canEditDefaultNotes":  false,
    "canManageUsers":       false,
    "canAccessAdmin":       false
  },
  "MANAGER_SALES": {
    "canEditAdvancedTab":   false,
    "canEditBomRates":      false,
    "canUpdateMasterItem":  false,
    "canViewAllBoms":       false,
    "canEditDefaultNotes":  false,
    "canManageUsers":       false,
    "canAccessAdmin":       false
  },
  "MANAGER_DESIGN": {
    "canEditAdvancedTab":   true,
    "canEditBomRates":      true,
    "canUpdateMasterItem":  true,
    "canViewAllBoms":       true,
    "canEditDefaultNotes":  true,
    "canManageUsers":       true,
    "canAccessAdmin":       true
  }
}
```

> Manager(Design) starts with MANAGER_SALES as a copy of SALES. They can raise it to whatever they decide.

---

## Implementation Steps

---

### STEP 1 — DB: Add `SystemConfig` Table

**File:** `backend/prisma/schema.prisma`

Add this model at the bottom:

```prisma
// System Config Table — Stores global system configuration as key-value pairs
model SystemConfig {
  key       String   @id @db.VarChar(100)
  value     Json
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("system_config")
}
```

Then run:
```bash
npx prisma migrate dev --name add_system_config
npx prisma generate
```

---

### STEP 2 — Backend: Permissions Service

**New file:** `backend/src/services/permissionsService.js`

This service:
- Loads the permissions config from DB on first request
- Caches it in memory (clears cache when admin updates it)
- Exposes `hasPermission(role, permissionKey)` for middleware use
- Exposes `getAll()` for the API endpoint

```
permissionsService
  ├── _cache = null              (in-memory cache)
  ├── getAll()                   → returns full config object
  ├── hasPermission(role, key)   → returns boolean
  ├── update(newConfig)          → saves to DB + clears cache
  └── _load()                    → private, fetches from DB or seeds defaults
```

**Default seeding logic:** If `system_config` has no row with key `role_permissions`, auto-insert the default config from above. This means no manual DB seed step needed — it self-initializes on first use.

---

### STEP 3 — Backend: New Config Routes

**New file:** `backend/src/routes/configRoutes.js`

```
GET  /api/config/permissions
     → Any authenticated user
     → Returns full permissions config
     → Frontend loads this on login

PUT  /api/config/permissions
     → MANAGER_DESIGN only (checked by authorizeRoles)
     → Validates that MANAGER_DESIGN.canAccessAdmin and
       MANAGER_DESIGN.canManageUsers cannot be set to false
       (prevents self-lockout)
     → Calls permissionsService.update(body)
     → Returns updated config
```

**Register in:** `backend/src/server.js`
```js
app.use('/api/config', configRoutes);
```

---

### STEP 4 — Backend: Update Middleware (3 files)

#### 4a. `backend/src/middleware/authMiddleware.js`

The `authorizeRoles` function currently only handles hardcoded role strings. We need a new async variant for permission-key-based checks.

Add new export alongside existing `authorizeRoles`:

```
exports.requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    const role = req.user?.role;
    const allowed = await permissionsService.hasPermission(role, permissionKey);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });
    next();
  };
};
```

> Keep `authorizeRoles('MANAGER_DESIGN')` on the `PUT /api/config/permissions` route since that never changes. Use `requirePermission` for the 5 other gates.

#### 4b. `backend/src/middleware/bomPermissions.js`

Change:
```js
// BEFORE
const ADVANCED_ROLES = new Set(['DESIGN', 'MANAGER']);
if (ADVANCED_ROLES.has(role)) return next();

// AFTER
const allowed = await permissionsService.hasPermission(role, 'canEditBomRates');
if (allowed) return next();
```

Same change for `forbidBasicMasterItemMutation` → use `canUpdateMasterItem`.

#### 4c. `backend/src/middleware/tabPermissions.js`

Change:
```js
// BEFORE
const ADVANCED_ROLES = new Set(['DESIGN', 'MANAGER']);
if (ADVANCED_ROLES.has(role)) return next();

// AFTER
const allowed = await permissionsService.hasPermission(role, 'canEditAdvancedTab');
if (allowed) return next();
```

#### 4d. Update Route Files (use `requirePermission`)

| Route file | Current check | Replace with |
|---|---|---|
| `userRoutes.js` | `authorizeRoles('MANAGER')` | `requirePermission('canManageUsers')` |
| `savedBomRoutes.js` | `authorizeRoles('MANAGER')` on `/all` | `requirePermission('canViewAllBoms')` |
| `defaultNotesRoutes.js` | `authorizeRoles('MANAGER')` on POST/PUT/DELETE | `requirePermission('canEditDefaultNotes')` |
| `templateRoutes.js` | `authorizeRoles('MANAGER')` on PUT | `requirePermission('canEditDefaultNotes')` |

> `bomRoutes.js` uses `authorizeRoles('ADVANCED')` — this is already handled by the middleware change in 4b/4c above.

---

### STEP 5 — Frontend: Load Permissions in AuthContext

**File:** `knapsack-front/src/context/AuthContext.jsx`

After `authAPI.getMe()` succeeds, also fetch the permissions config. Store in context.

```js
// Add to state
const [permissions, setPermissions] = useState(null);

// In initAuth, after setUser(userData):
const permsData = await configAPI.getPermissions();
setPermissions(permsData);

// Expose a helper
const can = (permissionKey) => {
  if (!user || !permissions) return false;
  return permissions[user.role]?.[permissionKey] === true;
};

// Add to Provider value:
// { user, permissions, can, login, logout, refreshUser, loading, isAuthenticated }
```

Add `configAPI` to `services/api.js`:
```js
export const configAPI = {
  getPermissions: () => apiClient.get('/config/permissions').then(r => r.data),
  updatePermissions: (config) => apiClient.put('/config/permissions', config).then(r => r.data),
};
```

---

### STEP 6 — Frontend: Replace Hardcoded Role Checks (~12 files)

Replace every component-level role check with `can()` from AuthContext.

#### Mapping of current checks to new `can()` calls:

| Current check | Replace with |
|---|---|
| `role === 'BASIC'` or `role !== 'DESIGN'` (blocking advanced fields) | `!can('canEditBomRates')` |
| `isBasicUser` (BOM rate/cost fields) | `!can('canEditBomRates')` |
| `role === 'BASIC'` (tab settings panel) | `!can('canEditAdvancedTab')` |
| `userMode` check in SettingsPanel/ResultCard | `can('canEditAdvancedTab')` |
| `canUpdateMaster` (ReviewChangesModal) | `can('canUpdateMasterItem')` |
| `isManager` (NotesSection default notes) | `can('canEditDefaultNotes')` |
| `role === 'MANAGER'` (HomePage admin link) | `can('canAccessAdmin')` |
| `roles={['MANAGER']}` (Router.jsx admin route) | `can('canAccessAdmin')` — see note below |

> **Router.jsx note:** The route guard currently uses `roles` prop. Change to use `can('canAccessAdmin')` from context, or pass a `permission` prop instead of `role` to the `ProtectedRoute` component.

**Files to update:**
1. `knapsack-front/src/Router.jsx`
2. `knapsack-front/src/App.jsx`
3. `knapsack-front/src/services/api.js` (the `sanitizeTabSettingsForRole` function)
4. `knapsack-front/src/pages/AdminPanel.jsx` (role dropdown options)
5. `knapsack-front/src/pages/HomePage.jsx`
6. `knapsack-front/src/components/GlobalInputs.jsx`
7. `knapsack-front/src/components/RailTable.jsx`
8. `knapsack-front/src/components/ResultCard.jsx`
9. `knapsack-front/src/components/SettingsPanel.jsx`
10. `knapsack-front/src/components/BOM/BOMPage.jsx`
11. `knapsack-front/src/components/BOM/BOMTableRow.jsx`
12. `knapsack-front/src/components/BOM/NotesSection.jsx`
13. `knapsack-front/src/components/BOM/ReviewChangesModal.jsx`
14. `knapsack-front/src/components/BOM/ShareBOMModal.jsx` (role filter array)

---

### STEP 7 — Frontend: Permissions Tab in AdminPanel

**File:** `knapsack-front/src/pages/AdminPanel.jsx`

Add a third tab: **"Permissions"** (visible only to Manager(Design), i.e. `can('canAccessAdmin') && user.role === 'MANAGER_DESIGN'`).

#### UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Permissions                                                         │
│  Configure what each role can do. Changes take effect immediately.  │
│                                                                      │
│  ┌──────────────────────┬────────┬────────┬──────────────┬──────────┐│
│  │ Permission           │ Sales  │ Design │ Mgr (Sales)  │ Mgr (Des)││
│  ├──────────────────────┼────────┼────────┼──────────────┼──────────┤│
│  │ Edit Advanced Tab    │  [ ]   │  [✓]   │     [ ]      │  [✓] 🔒  ││ (locked if always-true)
│  │ Edit BOM Rates       │  [ ]   │  [✓]   │     [ ]      │  [✓] 🔒  ││
│  │ Update Master DB     │  [ ]   │  [✓]   │     [ ]      │  [✓] 🔒  ││
│  │ View All BOMs        │  [ ]   │  [ ]   │     [✓]      │  [✓] 🔒  ││
│  │ Edit Default Notes   │  [ ]   │  [ ]   │     [ ]      │  [✓] 🔒  ││
│  │ Manage Users         │  [ ]   │  [ ]   │     [ ]      │  [✓] 🔒  ││ (always locked)
│  │ Access Admin Panel   │  [ ]   │  [ ]   │     [ ]      │  [✓] 🔒  ││ (always locked)
│  └──────────────────────┴────────┴────────┴──────────────┴──────────┘│
│                                                                      │
│  [🔒] = Cannot be changed (prevents lockout)                        │
│                                         [Save Permissions]           │
└─────────────────────────────────────────────────────────────────────┘
```

#### Rules to enforce in the UI:
- `MANAGER_DESIGN.canManageUsers` → always `true`, toggle disabled
- `MANAGER_DESIGN.canAccessAdmin` → always `true`, toggle disabled
- After save: show a success toast. Permissions take effect immediately for any new requests (no page reload needed by users — context updates on next navigation or on next login).

---

## Safety Rules (Server-Side Enforced)

In `PUT /api/config/permissions`:

```js
// Prevent MANAGER_DESIGN from locking themselves out
if (body.MANAGER_DESIGN?.canManageUsers === false) return 400;
if (body.MANAGER_DESIGN?.canAccessAdmin === false) return 400;
```

This is enforced server-side regardless of what the UI sends.

---

## Files Changed Summary

| Layer | File | Change |
|-------|------|--------|
| DB | `prisma/schema.prisma` | Add `SystemConfig` model |
| DB | migration | Auto-generated by `prisma migrate dev` |
| Backend | `src/services/permissionsService.js` | **NEW** — cache + DB read/write |
| Backend | `src/routes/configRoutes.js` | **NEW** — GET/PUT endpoints |
| Backend | `src/server.js` | Register config routes |
| Backend | `src/middleware/authMiddleware.js` | Add `requirePermission` export |
| Backend | `src/middleware/bomPermissions.js` | Replace `ADVANCED_ROLES` with `hasPermission()` |
| Backend | `src/middleware/tabPermissions.js` | Replace `ADVANCED_ROLES` with `hasPermission()` |
| Backend | `src/routes/userRoutes.js` | Use `requirePermission('canManageUsers')` |
| Backend | `src/routes/savedBomRoutes.js` | Use `requirePermission('canViewAllBoms')` |
| Backend | `src/routes/defaultNotesRoutes.js` | Use `requirePermission('canEditDefaultNotes')` |
| Backend | `src/routes/templateRoutes.js` | Use `requirePermission('canEditDefaultNotes')` |
| Frontend | `src/context/AuthContext.jsx` | Load permissions, expose `can()` helper |
| Frontend | `src/services/api.js` | Add `configAPI`, update `sanitizeTabSettingsForRole` |
| Frontend | `src/pages/AdminPanel.jsx` | Add Permissions tab UI + update role dropdown |
| Frontend | `src/Router.jsx` | Use `can('canAccessAdmin')` |
| Frontend | `src/App.jsx` | Use `can()` |
| Frontend | `src/pages/HomePage.jsx` | Use `can('canAccessAdmin')` |
| Frontend | `src/components/GlobalInputs.jsx` | Use `can('canEditBomRates')` |
| Frontend | `src/components/RailTable.jsx` | Use `can('canEditAdvancedTab')` |
| Frontend | `src/components/ResultCard.jsx` | Use `can('canEditAdvancedTab')` |
| Frontend | `src/components/SettingsPanel.jsx` | Use `can('canEditAdvancedTab')` |
| Frontend | `src/components/BOM/BOMPage.jsx` | Use `can('canEditBomRates')` |
| Frontend | `src/components/BOM/BOMTableRow.jsx` | Use `can('canEditBomRates')` |
| Frontend | `src/components/BOM/NotesSection.jsx` | Use `can('canEditDefaultNotes')` |
| Frontend | `src/components/BOM/ReviewChangesModal.jsx` | Use `can('canUpdateMasterItem')` |
| Frontend | `src/components/BOM/ShareBOMModal.jsx` | Update role filter array |

**Total: 25 files** (3 new, 22 modified)

---

## Difficulty Rating

| Step | Difficulty | Notes |
|------|-----------|-------|
| Step 1 — DB schema + migration | Low | One model, one migration command |
| Step 2 — permissionsService | Low | Simple DB read + in-memory cache |
| Step 3 — Config routes | Low | Two endpoints, straightforward |
| Step 4 — Middleware updates | Medium | 3 middleware + 4 route files, async change |
| Step 5 — AuthContext + api.js | Low | Fetch + store + expose `can()` |
| Step 6 — Frontend 14 files | Medium | Mechanical find & replace per mapping table above |
| Step 7 — Permissions Tab UI | Medium | New UI component with toggle table + save |

**Overall: Medium** — No architectural changes, no new patterns. The bulk is mechanical replacement work in Step 6, which is repetitive but not complex.

---

## Implementation Order

Do in this exact order to avoid breaking things midway:

1. DB migration (Step 1)
2. `permissionsService.js` + `configRoutes.js` + register in server (Steps 2 & 3)
3. Middleware updates (Step 4) — backend is now fully dynamic, old frontend still works because defaults match current behavior
4. AuthContext + api.js (Step 5)
5. Frontend component updates (Step 6)
6. Permissions tab UI (Step 7)
7. Test all 4 roles end-to-end

> Steps 1–3 can be done and deployed without touching the frontend at all. The defaults exactly replicate current behavior, so nothing breaks.

---

## What Manager(Design) Can Do After This

Go to Admin Panel → Permissions tab → toggle what MANAGER_SALES can do → Save.

No code change needed. No deployment needed. The change takes effect immediately for any new API requests. Users currently logged in will see the change on their next page load.
