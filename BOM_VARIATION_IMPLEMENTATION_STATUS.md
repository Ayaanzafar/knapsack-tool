# BOM Variation Implementation - Progress & Plan

**Date:** 2026-01-03
**Status:** In Progress - Phase 1 (Infrastructure Setup Completed)

---

## Table of Contents
1. [Final Goal](#final-goal)
2. [What We've Completed](#what-weve-completed)
3. [Current Situation](#current-situation)
4. [What We Need to Do Next](#what-we-need-to-do-next)
5. [Implementation Phases](#implementation-phases)
6. [Key Decisions Made](#key-decisions-made)

---

## Final Goal

### Vision
Enable the knapsack BOM system to support **multiple Long Rail variations** where each variation has its own **specific set of BOM items** with different:
- Aluminum profiles (rails, cleats, bases)
- Fasteners and hardware
- Item ordering and organization

### Target
- **23 total variations** (8 implemented first, 15 later)
- Each variation displays only relevant items
- Items linked to master Sunrack profile catalog
- Images for all profiles
- Proper formulas and calculations

### User Experience
When user selects "U Cleat Long Rail - Asbestos":
- BOM shows: Long Rail, U Cleat, **Asbestos Curved Base**, hardware
- When user selects "L Cleat Long Rail - Regular":
- BOM shows: Long Rail, **L Cleat**, different hardware

Currently ALL variations show the same items - this needs to change!

---

## What We've Completed

### ✅ Phase 1: Master Data Infrastructure (COMPLETED)

#### 1. Sunrack Profiles Master Table
**Created:** `sunrack_profiles` table

**What it contains:**
- 140 aluminum profiles
- All manufacturer codes (Regal/MA, Excellence/EX, VARN/SR, RC/SU, SNALCO/SN, etc.)
- Profile descriptions and generic names
- Design weights (kg/RM)
- Profile images (12 uploaded so far)

**Files:**
- Schema: `backend/prisma/schema.prisma` (lines 222-254)
- Import script: `backend/scripts/importSunrackProfiles.js`
- Data source: `backend/All Profiles - 05-12-2025 - Product Codes.xlsx`

#### 2. Profile Image Management
**Created:** Image mapping and upload system

**What we have:**
- Mapping scripts for all 140 profiles
- 12 images uploaded for first 8 variations
- Auto-update script for database paths

**Files:**
- Mapping generator: `backend/scripts/generateImageMapping.js`
- Variation profiles: `backend/scripts/getVariationProfiles.js`
- Update script: `backend/scripts/updateProfileImages.js`
- Image folder: `backend/assets/profile-images/`

**Mapping files generated:**
- `IMAGE_FILENAME_MAPPING.txt` - Full list (140 profiles)
- `IMAGE_FILENAME_MAPPING.csv` - Excel format
- `IMAGE_FILENAME_MAPPING.json` - Machine readable
- `VARIATION_PROFILES_NEEDED.txt` - Only 12 needed for first 8 variations

#### 3. Database Schema Updates
**Added:** Foreign key relationship

**Changes:**
- `bom_master_items.sunrack_profile_id` field added
- Relation: `BomMasterItem -> SunrackProfile`
- Purpose: Link aluminum items to master catalog, leave fasteners standalone

**Files:**
- Schema: `backend/prisma/schema.prisma` (lines 133, 137, 248)
- Link script: `backend/scripts/linkBomToProfiles.js` (created but not executed yet)

#### 4. Analysis & Documentation
**Created:**
- Excel analysis of 8 variations
- Profile code mapping (MA, SR, SN, etc.)
- Item categorization (profiles vs fasteners)

**Files:**
- Original plan: `BOM_VARIATION_TEMPLATE_PLAN.md`
- This status doc: `BOM_VARIATION_IMPLEMENTATION_STATUS.md`

---

## Current Situation

### ✅ What's Working
1. **Sunrack profiles database** - 140 profiles imported with all codes
2. **Image system** - 12 images uploaded and linked
3. **Database structure** - Foreign key ready for linking
4. **Scripts** - All automation scripts created and tested

### ⚠️ Current Issues

#### Issue #1: BOM Master Items Need Cleanup
**Problem:**
- Database has 149 BOM items with codes like `SRC-001`, `SRC-026`, etc.
- These are NOT real Sunrack codes (likely test/old data)
- Seed file has correct 15 items with proper codes (MA-43, MA-110, etc.)

**Current State:**
```
Database:     149 items (SRC-001 to SRC-140 + 9 fasteners)  ❌ Wrong!
Seed file:    15 items (MA-43, MA-110, etc.)                 ✅ Correct!
```

**Solution Needed:**
1. Clean database (delete all BOM items)
2. Re-seed with 15 correct items from seed.js
3. Add NEW items needed for variations (MA-52, MA-57, MA-100, MA-102, SN-5306, etc.)

#### Issue #2: Missing Items for Variations
**What we have:** 15 items (only supports "U Cleat Regular" variation)

**What we need for first 8 variations:**
- MA-52 - Asbestos Curved Base (variation 2)
- MA-57 - Seam Clamp (variation 3, 6)
- MA-100 - Long Rail 60mm (variation 4, 5, 6, 8)
- MA-102 - Rail Jointer 60mm (variation 4, 5, 6, 8)
- SN-5306 - External U Cleat Large (variation 7, 8)
- MA-44 - Internal U Cleat (variation 7, 8)
- Additional fasteners (different SDS sizes, grub screws, etc.)

#### Issue #3: No Template System Yet
**Current:** All variations use same 15 items

**Needed:** Template configuration that maps:
```
"U Cleat Regular" → [MA-43, MA-110, MA-72, SR-03, MA-35, MA-46, + fasteners]
"U Cleat Asbestos" → [MA-43, MA-110, MA-52, MA-72, SR-03, MA-35, MA-46, + fasteners]
```

#### Issue #4: BOM Generation Logic
**Current:** `bomCalculations.js` generates ALL items regardless of variation

**Needed:** Filter and order items based on variation template

---

## What We Need to Do Next

### 📋 Immediate Next Steps (In Order)

#### Step 1: Clean & Re-seed BOM Master Items ⚡ **CRITICAL**
**Tasks:**
1. Delete all BOM items from database
2. Run seed.js to add 15 correct base items
3. Verify they have correct codes (MA-43, MA-110, etc.)

**Scripts to run:**
```bash
# Delete existing items
cd backend
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.bomMasterItem.deleteMany().then(() => p.$disconnect());"

# Re-seed
node prisma/seed.js
```

#### Step 2: Add New Master Items for Variations
**Tasks:**
1. Update `seed.js` to add new items needed for 8 variations:
   - MA-52 (Asbestos Curved Base)
   - MA-57 (Seam Clamp)
   - MA-100 (Long Rail 60mm)
   - MA-102 (Rail Jointer 60mm)
   - SN-5306 (External U Cleat)
   - MA-44 (Internal U Cleat)
   - New fasteners (M8 bolts different sizes, grub screws, different SDS screws)

2. Add formulas for new items
3. Run seed script
4. Verify all items created correctly

**File to modify:**
- `backend/prisma/seed.js`

#### Step 3: Link BOM Items to Sunrack Profiles
**Tasks:**
1. Run linking script: `node scripts/linkBomToProfiles.js`
2. Verify aluminum items linked to profiles
3. Verify fasteners remain unlinked (NULL profile ID)

**Expected Result:**
```
MA-43   → Linked to sunrack_profiles S.No 26
MA-110  → Linked to sunrack_profiles S.No 100
SR-03   → Linked to sunrack_profiles S.No 56
MA-52   → Linked to sunrack_profiles S.No 34
Bolts   → NULL (standalone fasteners)
```

#### Step 4: Create BOM Variation Templates
**Tasks:**
1. Create new file: `knapsack-front/src/constants/bomVariationTemplates.js`
2. Define templates for first 2 variations:
   - "U Cleat Long Rail - Regular"
   - "U Cleat Long Rail - Regular - Asbestos"

**Template structure:**
```javascript
export const BOM_VARIATION_TEMPLATES = {
  "U Cleat Long Rail - Regular": {
    items: [
      { code: 'MA-43', type: 'PROFILE' },   // Long Rail
      { code: 'MA-110', type: 'PROFILE' },  // U Cleat
      { code: 'MA-72', type: 'PROFILE' },   // Rail Jointer
      { code: 'SR-03', type: 'PROFILE' },   // End Clamp
      { code: 'MA-35', type: 'PROFILE' },   // Mid Clamp
      { code: 'MA-46', type: 'PROFILE' },   // Rail Nuts
      // Fasteners by serial number
      { serialNumber: '7', type: 'FASTENER' },  // M8x60 Bolt
      { serialNumber: '8', type: 'FASTENER' },  // M8x20 Bolt
      // ... etc
    ],
    order: 'standard'  // Cut lengths first, then hardware
  },

  "U Cleat Long Rail - Regular - Asbestos": {
    items: [
      { code: 'MA-43', type: 'PROFILE' },
      { code: 'MA-110', type: 'PROFILE' },
      { code: 'MA-52', type: 'PROFILE' },   // NEW: Asbestos Base
      { code: 'MA-72', type: 'PROFILE' },
      { code: 'SR-03', type: 'PROFILE' },
      { code: 'MA-35', type: 'PROFILE' },
      { code: 'MA-46', type: 'PROFILE' },
      // Different fasteners (no SDS 4.8, 5.5)
      { serialNumber: '7', type: 'FASTENER' },
      { serialNumber: '8', type: 'FASTENER' },
      // ...
    ],
    order: 'standard'
  }
};
```

#### Step 5: Update BOM Generation Logic
**Tasks:**
1. Modify `knapsack-front/src/services/bomCalculations.js`
2. Import variation templates
3. Filter items based on selected variation
4. Order items according to template

**Changes needed:**
```javascript
// In generateBOMItems function
import { BOM_VARIATION_TEMPLATES } from '../constants/bomVariationTemplates';

export function generateBOMItems(bomData, allProfiles) {
  const variation = bomData.projectInfo.longRailVariation;
  const template = BOM_VARIATION_TEMPLATES[variation];

  // Generate items as before
  const allItems = [...cutLengthItems, ...hardwareItems];

  // NEW: Filter by template
  const filteredItems = filterItemsByTemplate(allItems, template);

  // NEW: Order by template
  const orderedItems = orderItemsByTemplate(filteredItems, template);

  return orderedItems;
}
```

**File to modify:**
- `knapsack-front/src/services/bomCalculations.js` (lines 134-254)

#### Step 6: Test First 2 Variations
**Tasks:**
1. Create new project with "U Cleat Regular"
   - Verify BOM shows correct 13 items
   - Verify order is correct
   - Verify calculations work

2. Create new project with "U Cleat Asbestos"
   - Verify BOM shows correct 12 items (includes MA-52)
   - Verify Asbestos Base appears
   - Verify calculations work

3. Test BOM print preview
4. Test BOM save/load

#### Step 7: Implement Remaining 6 Variations
**Tasks:**
1. Add templates for variations 3-8
2. Test each variation
3. Fix any issues

#### Step 8: Enable All 8 Variations
**Tasks:**
1. Update `knapsack-front/src/constants/longRailVariation.js`
2. Remove `disabled: true` from first 8 variations
3. Final testing

---

## Implementation Phases

### Phase 1: Infrastructure Setup ✅ DONE
- [x] Create sunrack_profiles table
- [x] Import 140 profiles
- [x] Set up image system
- [x] Add foreign key relationship
- [x] Create automation scripts

### Phase 2: Data Cleanup & Seeding 🔄 IN PROGRESS
- [ ] Clean BOM master items
- [ ] Re-seed with correct 15 items
- [ ] Add new items for variations
- [ ] Link items to profiles
- [ ] Verify all connections

### Phase 3: Template System 📝 NEXT
- [ ] Create template configuration file
- [ ] Define templates for first 2 variations
- [ ] Create template utility functions

### Phase 4: BOM Generation Updates 🔧 PENDING
- [ ] Update bomCalculations.js
- [ ] Implement filtering logic
- [ ] Implement ordering logic
- [ ] Update backend services if needed

### Phase 5: Testing & Validation ✅ PENDING
- [ ] Test variation 1 (U Cleat Regular)
- [ ] Test variation 2 (U Cleat Asbestos)
- [ ] Test all 8 variations
- [ ] Test print preview
- [ ] Test save/load

### Phase 6: Rollout 🚀 PENDING
- [ ] Enable all 8 variations in dropdown
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Document for users

### Phase 7: Remaining Variations (Future) 📅 FUTURE
- [ ] Define templates for variations 9-23
- [ ] Add any missing profiles
- [ ] Test and enable

---

## Key Decisions Made

### ✅ Decision 1: Two-Table Approach
**Decision:** Keep aluminum profiles separate from fasteners

**Rationale:**
- Profiles have manufacturer codes → `sunrack_profiles` table
- Fasteners don't have codes → Stay in `bom_master_items` only
- Link via optional foreign key

**Benefits:**
- Single source of truth for profiles
- Automatic updates (images, weights) from master catalog
- Fasteners remain simple and standalone

### ✅ Decision 2: Image Naming Priority
**Decision:** Use code priority system for image filenames

**Priority Order:**
1. Regal (MA) - 98 profiles
2. Excellence (EX) - 15 profiles
3. VARN (SR) - 6 profiles
4. RC (SU) - 4 profiles
5. SNALCO (SN) - 9 profiles
6. Others

**Example:**
- Profile has MA-43 → Save as `MA-43.png`
- Profile has only SR-03 → Save as `SR-03.png`

### ✅ Decision 3: Incremental Implementation
**Decision:** Implement 2 variations first, then 6, then rest

**Phases:**
- First 2: U Cleat Regular, U Cleat Asbestos
- Next 6: Remaining U Cleat + Double U Cleat variations
- Later: L Cleat (9 variations) + C45 (3 variations)

**Benefits:**
- Test and validate approach early
- Fix issues before scaling
- Deliver value incrementally

### ✅ Decision 4: Template-Based System
**Decision:** Use configuration templates instead of database tables

**Rationale:**
- Faster development
- Easier to modify
- Clear and maintainable
- Can migrate to DB later if needed

**Structure:**
```javascript
BOM_VARIATION_TEMPLATES = {
  "Variation Name": {
    items: [...],
    order: 'standard'
  }
}
```

---

## File Structure Reference

### Backend Files
```
backend/
├── prisma/
│   ├── schema.prisma              # Database schema (updated)
│   └── seed.js                    # Seed file (needs update)
├── scripts/
│   ├── importSunrackProfiles.js   # Import 140 profiles ✅
│   ├── generateImageMapping.js    # Generate image mappings ✅
│   ├── getVariationProfiles.js    # Get needed profiles ✅
│   ├── updateProfileImages.js     # Update image paths ✅
│   └── linkBomToProfiles.js       # Link BOM to profiles ⏸️
├── assets/
│   └── profile-images/            # 12 images uploaded ✅
├── All Profiles - 05-12-2025 - Product Codes.xlsx  # Master data
├── Long Rail MMS Variants_8_types.xlsx             # Variation specs
├── IMAGE_FILENAME_MAPPING.txt     # Full mapping (140)
├── VARIATION_PROFILES_NEEDED.txt  # Needed for 8 vars (12)
└── BOM_VARIATION_IMPLEMENTATION_STATUS.md  # This file
```

### Frontend Files
```
knapsack-front/
├── src/
│   ├── constants/
│   │   ├── longRailVariation.js           # Variation definitions
│   │   └── bomVariationTemplates.js       # TODO: Create this
│   ├── services/
│   │   ├── bomCalculations.js             # TODO: Update this
│   │   └── bomDataCollection.js           # Reference only
│   └── components/
│       └── BOM/
│           └── BOMTable.jsx               # Display (may need updates)
```

---

## Database Schema

### Current Tables

#### `sunrack_profiles` ✅
```
Columns:
- id (PK)
- sNo (unique)
- regalCode, excellenceCode, varnCode, rcCode, snalcoCode, etc.
- profileImage (path to image file)
- profileDescription (detailed)
- genericName (short name)
- designWeight (kg/RM)
- timestamps

Records: 140 profiles
Images: 12 uploaded
```

#### `bom_master_items` ⚠️
```
Columns:
- id (PK)
- serialNumber (unique)
- sunrackCode
- itemDescription
- genericName
- designWeight
- material, standardLength, uom, category
- profileImagePath (deprecated - use sunrackProfile.profileImage)
- selectedRmVendor, costPerPiece, itemType
- sunrackProfileId (FK to sunrack_profiles) ← NEW
- timestamps

Current Records: 149 (needs cleanup!)
Should Have: ~25 items (15 base + 10 new for variations)
```

#### `bom_formulas`
```
Links formulas to BOM items
No changes needed
```

---

## Next Session Plan

### Start Here:
1. **Clean BOM master items** (delete all)
2. **Re-seed database** (15 correct items)
3. **Add new items** (for variations 2-8)
4. **Link to profiles** (run linking script)

### Then:
5. Create template configuration
6. Update BOM generation logic
7. Test first 2 variations

### Questions to Resolve:
- Should we update seed.js to pull data from sunrack_profiles automatically?
- Do we need to handle End Clamp mismatch (MA-109 vs SR-03)?
- Should fasteners have item_type field set properly?

---

## Success Criteria

Implementation is complete when:

✅ All 8 variations have working templates
✅ Each variation shows correct items
✅ Items appear in correct order
✅ Aluminum items linked to sunrack_profiles
✅ Images display correctly
✅ Calculations produce correct quantities
✅ Print preview works for all variations
✅ Save/load works correctly
✅ All 8 variations enabled in dropdown
✅ No breaking changes to existing "U Cleat Regular" projects

---

**Last Updated:** 2026-01-03 21:30
**Next Review:** After completing Step 3 (Linking)
**Owner:** Development Team
**Priority:** HIGH - Core functionality for variation support
