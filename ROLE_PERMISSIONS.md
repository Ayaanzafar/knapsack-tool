# User Role Permissions — Knapsack BOM Tool

There are **3 user roles** in the system: **Basic**, **Design**, and **Manager**.
Each role has a different level of access, described below.

---

## Quick Summary

| | Basic | Design | Manager |
|---|:---:|:---:|:---:|
| Create & manage projects | ✅ | ✅ | ✅ |
| Generate & export BOMs | ✅ | ✅ | ✅ |
| Share BOMs with other users | ✅ | ✅ | ✅ |
| View advanced optimization settings | ❌ | ✅ | ✅ |
| Edit cost & rate fields in BOM | ❌ | ✅ | ✅ |
| Update master item database | ❌ | ✅ | ✅ |
| Edit default BOM notes / templates | ❌ | ❌ | ✅ |
| View all BOMs across all users | ❌ | ❌ | ✅ |
| User management (create, delete, reset password) | ❌ | ❌ | ✅ |
| Access Admin Panel | ❌ | ❌ | ✅ |

---

## Role 1 — Basic

**Intended for:** Field users, data entry operators, or read-mostly users.

Basic users can work with projects and generate BOMs but are **locked out of sensitive cost and optimization settings** to prevent accidental or unauthorized changes.

### What Basic users CAN do:
- Create, view, and edit projects
- Add/edit buildings (tabs) and rows
- Generate BOMs and export to PDF
- Save and view BOMs
- Share BOMs with other users and view BOMs shared with them
- Toggle enabled cut lengths (existing ones only — cannot add new lengths)

### What Basic users CANNOT do:

**Tab / Rail Settings (hidden or disabled):**
- Buffer
- Lengths Input (cannot add or remove cut lengths)
- Cost per mm
- Cost per Joint Set
- Joiner Length
- Max Pieces
- Max Waste %
- Alpha Joint, Beta Small, Gamma Short, Allow Undershoot %

**BOM Fields (read-only):**
- Aluminum Rate (global)
- Spare Percentage
- Module Wp
- Per-item Rate Per Piece override
- Per-item Manual Aluminum Rate override

**Master Data:**
- Cannot use "Apply to Future" (cannot update the master item database)

---

## Role 2 — Design

**Intended for:** Engineers, designers, or technical users who need full control over calculations and costs.

Design users have **all the same access as Basic**, plus they can edit advanced settings, cost fields, and update the master item database.

### What Design users get (on top of Basic):

**Full Tab / Rail Settings access:**
- All advanced optimization parameters (buffer, max waste, alpha joint, etc.)
- Full control over cut lengths input
- Cost per mm, cost per joint set, joiner length

**Full BOM editing:**
- Edit Aluminum Rate (global)
- Edit Spare Percentage
- Edit Module Wp
- Override per-item Rate Per Piece
- Override per-item Manual Aluminum Rate

**Master Data:**
- Can use "Apply to Future" — updates master profiles and fasteners in the database for future BOMs

### What Design users CANNOT do:
- Cannot edit system default notes or BOM variation template notes
- Cannot view all BOMs across all users
- Cannot access the Admin Panel or manage users

---

## Role 3 — Manager (Admin)

**Intended for:** Administrators, project managers, or team leads who need full system control.

Managers have **all the access of Design**, plus full administrative capabilities.

### What Manager users get (on top of Design):

**Default Notes & Templates:**
- Add, edit, and delete global default BOM notes
- Edit default notes for each BOM variation template

**BOM Oversight:**
- View all saved BOMs across every user in the system (`/api/saved-boms/all`)

**User Management (Admin Panel):**
- Create new users (assign any role: Basic, Design, Manager)
- View all users with their roles and statuses
- Activate / deactivate / put users on hold
- Soft-delete users
- Reset any user's password

---

## How Restrictions Are Enforced

Permissions are enforced at **two levels** so they cannot be bypassed:

1. **Backend (API level):** Every API request is checked by role middleware before it is processed. If a Basic user tries to send a restricted field, the server rejects or strips it.

2. **Frontend (UI level):** Restricted fields are hidden or disabled in the interface for Basic users, so the restriction is visible and clear.

---

## Role Assignment

Only a **Manager** can create users and assign roles. Roles can be changed by a Manager at any time from the Admin Panel.

```
Manager → can create/edit/delete → Basic, Design, Manager users
Design  → cannot manage users
Basic   → cannot manage users
```
