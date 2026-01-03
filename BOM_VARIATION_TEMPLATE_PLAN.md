# BOM Variation Template Implementation Plan

**Date:** 2026-01-03
**Status:** Planning Phase - Ready for Implementation

---

## Table of Contents
1. [Current System Analysis](#current-system-analysis)
2. [Problem Statement](#problem-statement)
3. [Proposed Solution](#proposed-solution)
4. [Implementation Plan](#implementation-plan)
5. [Next Steps](#next-steps)
6. [Questions to Resolve](#questions-to-resolve)

---

## Current System Analysis

### Where BOM Items Are Defined

**Primary Location:** `backend/prisma/seed.js:10-176`

Currently, there are **15 master BOM items** hardcoded:

| Serial # | Item Description | Sunrack Code |
|----------|-----------------|--------------|
| 1 | Long Rail | MA-43 |
| 2 | U Cleat | MA-110 |
| 3 | Rail Jointer | MA-72 |
| 4 | End Clamps | MA-109 |
| 5 | Mid Clamps | MA-35 |
| 6 | Rail Nuts | MA-46 |
| 7 | M8x60 Bolt | - |
| 8 | M8x20 Bolt | - |
| 9 | M8 Hex Nuts | - |
| 10 | M8 Plain Washer | - |
| 11 | M8 Spring Washer | - |
| 12 | SDS 4.2x13mm | - |
| 13 | SDS 5.5x63mm | - |
| 14 | Rubber Pad | - |
| 15 | Blind Rivets | - |

**Database Schema:** `backend/prisma/schema.prisma:113-138` (BomMasterItem model)

### Current BOM Item Ordering

**Location:** `knapsack-front/src/services/bomCalculations.js:134-254`

**Two-part ordering structure:**

1. **Cut Lengths (Long Rails)** - Lines 144-188
   - Appear FIRST in BOM
   - Sorted in **ascending order** by length (e.g., 2.2m, 2.7m, 3.2m)
   - One BOM line per active cut length
   - Uses profile from `bomData.tabProfiles[tabName]`

2. **Hardware/Accessories** - Lines 190-252
   - Appear AFTER cut lengths
   - Ordered by **serial number** (1, 2, 3... 15)
   - Generated from database formulas
   - Only items with quantity > 0 are included

**Database retrieval:** `backend/src/services/bomService.js:9`
```javascript
orderBy: { serialNumber: 'asc' }
```

### Long Rail Variations

**Definition:** `knapsack-front/src/constants/longRailVariation.js`

**20 variations defined:**

#### U Cleat Types (6 variations)
1. ✅ U Cleat Long Rail - Regular **(ENABLED)**
2. U Cleat Long Rail - Regular - Asbestos (disabled)
3. U Cleat Long Rail - Regular - Seam Clamp (disabled)
4. U Cleat Long Rail - Large Span/Height (disabled)
5. U Cleat Long Rail - Large Span - Asbestos (disabled)
6. U Cleat Long Rail - Large Height - Seam Clamp (disabled)

#### Double U Cleat Types (2 variations)
7. Double U Cleat Long Rail -160mm Height (disabled)
8. Double U Cleat Long Rail -180mm Height (disabled)

#### L Cleat Types (9 variations)
9. L Cleat Long Rail - Regular (disabled)
10. L Cleat Long Rail - Regular - Asbestos (disabled)
11. L Cleat Long Rail - Regular - Seam Clamp (disabled)
12. L Cleat Long Rail - Large Cleat (disabled)
13. L Cleat Long Rail - Large span (disabled)
14. L Cleat Long Rail - Large Height - Asbestos (disabled)
15. L Cleat Long Rail - Large Height - Seam Clamp (disabled)
16. L Cleat Long Rail - Large Cleat - Asbestos (disabled)
17. L Cleat Long Rail - Large Cleat - Seam Clamp (disabled)

#### C45 Types (3 variations)
18. C45 Long Rail (disabled)
19. C45 Long Rail - Asbestos (disabled)
20. C45 Long Rail - Seam Clamp (disabled)

**Current Usage:**
- Selected in `CreateProjectPage.jsx:455` when creating project
- Stored in `Project.longRailVariation` field (schema.prisma:19)
- **Currently only used as a LABEL** - doesn't affect BOM items
- Displayed in BOM header/title

### Key Finding: The Problem

**Current Limitation:** All 20 variations use the SAME 15 BOM items with SAME formulas.

The `longRailVariation` field is only displayed as text in the BOM title but doesn't change:
- Which items appear in the BOM
- What order items appear
- What formulas are used

This needs to change!

---

## Problem Statement

### Current Situation
When a user selects different long rail variations (U Cleat, L Cleat, Double U Cleat, C45, etc.), they all get the same BOM items.

### Desired Behavior
- **Different variations should have different BOM items**
  - Example: L Cleat should show "L Cleat" instead of "U Cleat"
  - Example: Asbestos variations should include safety items
  - Example: Seam Clamp variations should have different hardware

- **Item order should vary slightly** based on variation
  - Upper items (cut lengths) stay the same
  - Lower items (hardware) stay the same
  - Middle items change based on variation type

- **Preliminary calculations stay the same** (Rail Table calculations don't change)

- **Only BOM page items change**

---

## Proposed Solution

### Architecture: Layered Template System

Create a **Base Template + Inheritance** configuration system.

#### Why This Approach?
✅ Avoids repetition - Define common items once per base type
✅ Easy to maintain - Change base affects all related variations
✅ Clear structure - Easy to see what's different
✅ Scalable - Easy to add new variations
✅ Type safety - Can validate all 20 variations

### Template Structure

```javascript
// File: knapsack-front/src/constants/bomVariationTemplates.js

export const BOM_VARIATION_TEMPLATES = {
  // Base templates for 4 main types
  baseTemplates: {
    "U_CLEAT_BASE": {
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      cutLengthsPosition: "top",
      hardwareOrder: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    },

    "L_CLEAT_BASE": {
      items: [1, 16, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 17, 15],
      cutLengthsPosition: "top",
      hardwareOrder: [16, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 17, 15]
    },

    "DOUBLE_U_CLEAT_BASE": {
      items: [1, 2, 19, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      cutLengthsPosition: "top",
      hardwareOrder: [2, 19, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    },

    "C45_BASE": {
      items: [1, 20, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      cutLengthsPosition: "top",
      hardwareOrder: [20, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    }
  },

  // Specific variations inherit from base and add/modify
  variations: {
    "U Cleat Long Rail - Regular": {
      base: "U_CLEAT_BASE"
    },

    "U Cleat Long Rail - Regular - Asbestos": {
      base: "U_CLEAT_BASE",
      additionalItems: [18],  // Safety pad for asbestos
      insertAfter: 15
    },

    "U Cleat Long Rail - Large Span/Height": {
      base: "U_CLEAT_BASE",
      replaceItems: { 2: 21 },  // Replace U cleat with Large U cleat
      additionalItems: [22]      // Extra support bracket
    },

    "L Cleat Long Rail - Regular": {
      base: "L_CLEAT_BASE"
    },

    // ... map all 20 variations
  }
};
```

### Template Resolution Logic

When generating BOM:
1. Get `project.longRailVariation`
2. Look up variation in `BOM_VARIATION_TEMPLATES.variations`
3. Get base template
4. Apply modifications (additionalItems, replaceItems, etc.)
5. Filter BOM items to only show template items
6. Order items according to template order

---

## Implementation Plan

### Phase 1: Data Collection & Preparation

**Status:** 🔴 NOT STARTED - Waiting for Excel file

#### Tasks:
- [ ] **Extract Excel data** from manager's template file (covers first 8 variations)
  - Convert Excel → CSV or share file path
  - Parse item descriptions, serial numbers, and order for each variation
  - Document what items are different between variations

- [ ] **Identify missing master items**
  - Check which items in Excel don't exist in current 15 master items
  - List new items needed (L Cleat, Large U Cleat, safety items, etc.)
  - Determine serial numbers for new items (16, 17, 18...)

- [ ] **Define remaining 12 variations** (if not in Excel)
  - Work with manager or infer from naming patterns
  - Document item lists for variations 9-20

### Phase 2: Database Schema Updates

#### Tasks:
- [ ] **Add new master items** to `backend/prisma/seed.js`
  - Add L Cleat, Large U Cleat, C45 brackets, etc.
  - Assign serial numbers (16+)
  - Set properties: sunrackCode, itemDescription, material, UOM, etc.

- [ ] **Create formulas for new items** in seed file
  - Define calculation formulas for new items
  - Set calculationLevel for dependency resolution
  - Link formulas to master items

- [ ] **Run migration**
  ```bash
  npx prisma db push
  node prisma/seed.js
  ```

### Phase 3: Template Configuration

#### Tasks:
- [ ] **Create template config file**
  - File: `knapsack-front/src/constants/bomVariationTemplates.js`
  - Define 4 base templates (U_CLEAT, L_CLEAT, DOUBLE_U_CLEAT, C45)
  - Map all 20 variations to base templates with modifications

- [ ] **Add template utilities**
  - Function: `getTemplateForVariation(variationName)`
  - Function: `resolveTemplate(variation)` - applies inheritance
  - Function: `filterItemsByTemplate(allItems, template)`
  - Function: `orderItemsByTemplate(items, template)`

### Phase 4: BOM Generation Updates

#### Files to Modify:

**1. `knapsack-front/src/services/bomCalculations.js`**

**Current behavior:** Lines 134-254
- Generates all items (cut lengths + all hardware)
- Orders by serial number

**New behavior:**
```javascript
import { getTemplateForVariation, filterItemsByTemplate } from '../constants/bomVariationTemplates';

export function generateBOMItems(bomData, allProfiles) {
  const variation = bomData.projectInfo.longRailVariation;
  const template = getTemplateForVariation(variation);

  // Generate items as before
  const allItems = [...cutLengthItems, ...hardwareItems];

  // NEW: Filter by template
  const filteredItems = filterItemsByTemplate(allItems, template);

  // NEW: Order by template
  const orderedItems = orderItemsByTemplate(filteredItems, template);

  return orderedItems;
}
```

**2. `backend/src/services/bomService.js`**

**Current:** Returns all 15 master items

**Update:** Filter based on variation when needed
```javascript
async getAllMasterItems(variationName = null) {
  const items = await prisma.bomMasterItem.findMany({
    where: { isActive: true },
    orderBy: { serialNumber: 'asc' },
    include: { formulas: true, rmCodes: true }
  });

  // If variation specified, filter by template
  if (variationName) {
    const template = getTemplateForVariation(variationName);
    return items.filter(item => template.items.includes(item.serialNumber));
  }

  return items;
}
```

### Phase 5: Testing

#### Test Cases:
- [ ] Create project with "U Cleat Long Rail - Regular" → Verify BOM has U Cleat items
- [ ] Create project with "L Cleat Long Rail - Regular" → Verify BOM has L Cleat items
- [ ] Create project with "Asbestos" variation → Verify safety items included
- [ ] Create project with "Double U Cleat" → Verify double height items
- [ ] Verify BOM ordering matches template specification
- [ ] Verify calculations still work correctly
- [ ] Test BOM print preview with different variations
- [ ] Verify saved BOMs load correctly

### Phase 6: Enable All Variations

**Current:** Only "U Cleat Long Rail - Regular" enabled

**Update:** `knapsack-front/src/constants/longRailVariation.js`
```javascript
export const LONG_RAIL_OPTIONS = [
  { value: "U Cleat Long Rail - Regular", label: "U Cleat Long Rail - Regular" },
  { value: "U Cleat Long Rail - Regular - Asbestos", label: "U Cleat Long Rail - Regular - Asbestos" }, // Remove disabled: true
  // ... enable all 20 variations
];
```

---

## Next Steps

### Immediate Actions (Tomorrow)

1. **Share Excel file**
   - Option A: Save Excel in project folder and share path
   - Option B: Convert to CSV and share path
   - Option C: Copy-paste data

2. **Review extracted data**
   - Verify item lists for first 8 variations
   - Identify new master items needed
   - Confirm item ordering requirements

3. **Approve template structure**
   - Review proposed base templates
   - Confirm inheritance approach works
   - Suggest modifications if needed

### Implementation Sequence

```
Day 1: Extract Excel → Create template config for first 8 variations
Day 2: Add new master items → Update database seed
Day 3: Implement template utilities → Update BOM generation logic
Day 4: Testing → Bug fixes
Day 5: Complete remaining 12 variations → Final testing
```

---

## Questions to Resolve

### Critical Questions (Need answers before implementation)

1. **Excel Data Structure**
   - What columns are in the Excel? (Variation Name, Serial #, Item Description, Order, etc.?)
   - Does it include item properties (material, UOM, sunrack code)?
   - Does it specify formulas for new items?

2. **New Master Items**
   - Which items in Excel templates are NOT in current 15 master items?
   - Do we need to create: L Cleat, Large U Cleat, C45 brackets, safety items?
   - What are the properties for these new items?

3. **Item Ordering**
   - You mentioned "upper and lower items are same, middle varies" - can you clarify?
   - Should cut lengths ALWAYS be at top?
   - Which items are "fixed position" vs "variable position"?

4. **Formulas**
   - Do different variations use different formulas for same item?
   - Or do formulas stay same, just different items are selected?

5. **Remaining 12 Variations**
   - Are they covered in Excel or need to be defined separately?
   - Should we infer from patterns or wait for specification?

### Nice-to-Have Information

- Are there any items that appear in ALL variations?
- Are there items unique to only one variation?
- Should we support "custom variations" in future?
- Do we need to migrate existing BOMs when enabling new variations?

---

## File References

### Key Files to Modify
- `backend/prisma/seed.js` - Add new master items
- `knapsack-front/src/constants/bomVariationTemplates.js` - **NEW FILE** - Template config
- `knapsack-front/src/services/bomCalculations.js:134-254` - BOM generation
- `backend/src/services/bomService.js:6-14` - Master item retrieval
- `knapsack-front/src/constants/longRailVariation.js` - Enable disabled variations

### Key Files for Reference
- `backend/prisma/schema.prisma:113-138` - BomMasterItem model
- `backend/prisma/schema.prisma:19` - Project.longRailVariation
- `knapsack-front/src/services/bomDataCollection.js` - Data collection
- `knapsack-front/src/components/BOM/BOMTable.jsx` - Display
- `knapsack-front/src/pages/CreateProjectPage.jsx:455` - Variation selection

---

## Technical Notes

### BOM Data Flow

```
1. User selects variation → CreateProjectPage
2. Variation saved to Project table → backend/projectService.js
3. User creates BOM → BOMPage
4. Template loaded → bomVariationTemplates.js
5. Master items filtered → bomService.js
6. Calculations applied → bomCalculations.js
7. Items ordered by template → bomCalculations.js
8. BOM displayed → BOMTable.jsx
```

### Calculation Hierarchy (Stays Same)

```
Level 1: Direct from tab data
  - LONG_RAIL, RAIL_JOINTER, END_CLAMP, MID_CLAMP

Level 2: Depends on Level 1
  - U_CLEAT, RAIL_NUTS

Level 3: Bolt calculations
  - M8x60_BOLT, M8x20_BOLT

Level 4: Washers and nuts
  - M8_HEX_NUTS, M8_PLAIN_WASHER, M8_SPRING_WASHER

Level 5: Other hardware
  - SDS items, RUBBER_PAD, BLIND_RIVETS
```

This hierarchy is maintained regardless of variation type.

---

## Success Criteria

Implementation is complete when:

✅ All 20 variations have defined templates
✅ Each variation shows correct BOM items
✅ Items appear in correct order per variation
✅ All 20 variations are enabled in dropdown
✅ Existing "U Cleat Regular" projects still work
✅ BOM calculations produce correct quantities
✅ Print preview works for all variations
✅ Database properly stores new master items
✅ No breaking changes to existing functionality

---

## Related Documents

- `BOM_REFACTORING_PLAN.md` - Previous BOM refactoring documentation
- `backend/prisma/schema.prisma` - Database schema
- `knapsack-front/src/constants/longRailVariation.js` - Variation definitions

---

**Last Updated:** 2026-01-03
**Next Review:** After Excel data extraction
**Owner:** Development Team
**Status:** Planning Phase - Awaiting Excel Template Data
