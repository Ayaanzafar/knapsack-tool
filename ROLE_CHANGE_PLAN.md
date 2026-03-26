# Role Change Plan — Knapsack BOM Tool

> **Status: PENDING** — Awaiting manager decision on Manager(Sales) permissions before implementation begins.
> **Discussion Date:** 2026-03-23

---

## Overview

The role system is being restructured from **3 roles** to **4 roles**.

### Current Roles (Before)
| Role | Description |
|------|-------------|
| `BASIC` | Standard user with limited access |
| `DESIGN` | Advanced user with full BOM/design access |
| `MANAGER` | Admin user with full system access |

### New Roles (After)
| New Role | DB String (proposed) | Maps From | Change Type |
|----------|----------------------|-----------|-------------|
| Sales | `SALES` | `BASIC` | Rename only |
| Design | `DESIGN` | `DESIGN` | No change |
| Manager(Sales) | `MANAGER_SALES` | _(new)_ | Brand new — permissions TBD |
| Manager(Design) | `MANAGER_DESIGN` | `MANAGER` | Rename only, same admin rights |

> **Note:** `MANAGER_DESIGN` replaces `MANAGER` completely. All admin rights currently held by `MANAGER` will belong to `MANAGER_DESIGN`.

---

## What is Decided

### Sales (was BASIC) — rename only
Same restrictions as current BASIC. Only the role string changes.

**Cannot do:**
- Edit advanced tab settings (buffer, cut lengths, max waste %, alpha joint, etc.)
- Edit BOM global fields (aluminum rate, spare %, module Wp)
- Override per-item cost / aluminum rate
- Update master item database ("Apply to Future")
- Access admin panel
- Manage users

### Design — no change
Permissions remain exactly the same.

### Manager(Design) (was MANAGER) — rename only
Same rights as current MANAGER. Only the role string changes.

**Has full access to everything:**
- All Design-level permissions
- Edit default BOM notes and variation template notes
- View all BOMs across all users
- Admin panel access
- Create, edit, delete, activate/deactivate users (all roles)
- Reset any user's password

---

## What is NOT Yet Decided

### Manager(Sales) — PENDING MANAGER APPROVAL

This is a **brand new role** with no existing equivalent. Permissions need to be confirmed.

Fill in the table below after discussion with manager:

| Permission | Sales | **Manager(Sales)** | Design | Manager(Design) |
|---|:---:|:---:|:---:|:---:|
| Create / edit projects & BOMs | ✅ | ❓ | ✅ | ✅ |
| Advanced BOM fields (aluminum rate, spare %, module Wp) | ❌ | ❓ | ✅ | ✅ |
| Advanced tab settings (buffer, cut lengths, costs, etc.) | ❌ | ❓ | ✅ | ✅ |
| Override per-item cost / aluminum rate | ❌ | ❓ | ✅ | ✅ |
| Update master item database ("Apply to Future") | ❌ | ❓ | ✅ | ✅ |
| Edit default BOM notes / template notes | ❌ | ❓ | ❌ | ✅ |
| View all BOMs (across all users) | ❌ | ❓ | ❌ | ✅ |
| Access Admin Panel | ❌ | ❓ | ❌ | ✅ |
| Manage users (create, delete, reset password) | ❌ | ❓ | ❌ | ✅ |
| Manage Sales users only | ❌ | ❓ | ❌ | ✅ |
| Share BOMs with other users | ✅ | ❓ | ✅ | ✅ |

**Likely options discussed:**
- **Option A:** Sales + view all Sales-team BOMs + manage Sales users only (no Design access)
- **Option B:** Same as Manager(Design) but focused on sales team (full admin rights)

---

## Implementation Scope (Once Permissions are Decided)

### Files That Need Changes (~20 files, 70+ occurrences)

#### Backend — Middleware (3 files)
| File | What Changes |
|------|-------------|
| `backend/src/middleware/authMiddleware.js` | Update `ADVANCED` pseudo-role expansion to include new manager roles |
| `backend/src/middleware/tabPermissions.js` | Update `ADVANCED_ROLES` set — does `MANAGER_SALES` belong here? |
| `backend/src/middleware/bomPermissions.js` | Update `ADVANCED_ROLES` set — same question |

#### Backend — Routes (6 files)
| File | What Changes |
|------|-------------|
| `backend/src/routes/userRoutes.js` | `authorizeRoles('MANAGER')` → which new manager role(s)? |
| `backend/src/routes/savedBomRoutes.js` | `authorizeRoles('MANAGER')` on `/all` route |
| `backend/src/routes/defaultNotesRoutes.js` | `authorizeRoles('MANAGER')` on POST/PUT/DELETE |
| `backend/src/routes/templateRoutes.js` | `authorizeRoles('MANAGER')` on PUT |
| `backend/src/routes/bomRoutes.js` | `authorizeRoles('ADVANCED')` on formula/master-item routes |

#### Backend — Schema & Seed (2 files)
| File | What Changes |
|------|-------------|
| `backend/prisma/schema.prisma` | Default role comment: `// SALES, DESIGN, MANAGER_SALES, MANAGER_DESIGN` |
| `backend/prisma/seed_auth.js` | Update seed user role from `MANAGER` to `MANAGER_DESIGN` |

#### Frontend — Components & Pages (12 files)
| File | What Changes |
|------|-------------|
| `knapsack-front/src/Router.jsx` | `roles={['MANAGER']}` → `['MANAGER_DESIGN']` or both managers? |
| `knapsack-front/src/App.jsx` | `role === 'BASIC'` → `role === 'SALES'` |
| `knapsack-front/src/services/api.js` | `role !== 'BASIC'` → `role !== 'SALES'` |
| `knapsack-front/src/pages/AdminPanel.jsx` | Dropdown options, default role value, role badge colors |
| `knapsack-front/src/pages/HomePage.jsx` | `role === 'MANAGER'` → manager check |
| `knapsack-front/src/components/GlobalInputs.jsx` | `isBasicUser`, `userMode` checks |
| `knapsack-front/src/components/RailTable.jsx` | Multiple `role === 'BASIC'` checks |
| `knapsack-front/src/components/ResultCard.jsx` | `userMode` role check |
| `knapsack-front/src/components/SettingsPanel.jsx` | `userMode` role check |
| `knapsack-front/src/components/BOM/BOMPage.jsx` | `isBasicUser` check |
| `knapsack-front/src/components/BOM/BOMTableRow.jsx` | `isBasicUser` check |
| `knapsack-front/src/components/BOM/NotesSection.jsx` | `isManager` check |
| `knapsack-front/src/components/BOM/ReviewChangesModal.jsx` | `canUpdateMaster` check |
| `knapsack-front/src/components/BOM/ShareBOMModal.jsx` | Role filter array `['ALL', 'BASIC', 'DESIGN', 'MANAGER']` |

#### Database — One-time Migration SQL
```sql
-- Rename BASIC users to SALES
UPDATE users SET role = 'SALES' WHERE role = 'BASIC';

-- Rename MANAGER users to MANAGER_DESIGN
UPDATE users SET role = 'MANAGER_DESIGN' WHERE role = 'MANAGER';

-- DESIGN users: no change needed
```

---

## Key Design Questions for the Dev Meeting

Before starting implementation, confirm answers to:

1. **What string do we store in DB for the new roles?**
   - Proposed: `SALES`, `DESIGN`, `MANAGER_SALES`, `MANAGER_DESIGN`

2. **Does Manager(Sales) get advanced BOM editing (rates, costs)?**

3. **Does Manager(Sales) access the Admin Panel?**

4. **Can Manager(Sales) manage users — all users, or only Sales users?**

5. **Does Manager(Sales) belong to the `ADVANCED_ROLES` group (same as Design + Manager)?**

6. **Does the `ADVANCED` pseudo-role in `authMiddleware.js` expand to include `MANAGER_SALES`?**

---

## Difficulty Rating

| Change | Difficulty | Reason |
|--------|-----------|--------|
| BASIC → SALES rename | Low | Find & replace across ~15 files |
| MANAGER → MANAGER_DESIGN rename | Low | Find & replace across ~10 files |
| DESIGN unchanged | None | Nothing to do |
| Manager(Sales) — new role | Medium–High | Need to define permissions + update all middleware + add DB migration |
| DB migration for existing users | Low | Two simple UPDATE statements |

**Overall: Medium difficulty** — straightforward once Manager(Sales) permissions are defined. No architectural changes needed. The `ADVANCED` pseudo-role pattern already makes it easy to add new roles to grouped permission checks.

---

## Next Steps

- [ ] Manager to confirm Manager(Sales) permissions (fill in the table above)
- [ ] Agree on DB string values for new roles
- [ ] Run one-time DB migration SQL on server
- [ ] Update all ~20 files
- [ ] Test all 4 roles end-to-end
- [ ] Update `ROLE_PERMISSIONS.md` to reflect new role names and permissions
