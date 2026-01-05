# BOM Variation Template Integration - Analysis & Plan

**Date:** 2026-01-05
**Status:** Analysis Complete - Ready for Implementation Plan

---

## Executive Summary

After analyzing your codebase, I have a complete understanding of the current BOM flow. **The good news**: We can integrate variation-based templates **WITHOUT breaking** your existing BOM creation and editing functionality. The templates will simply **filter which items appear** based on the selected variation.

---

## Current System Analysis

### 1. **Project Creation Flow** ✅ ANALYZED

**File:** `knapsack-front/src/pages/CreateProjectPage.jsx`

```javascript
// User selects variation in dropdown (line 462, 743-749)
const [longRailVariation, setLongRailVariation] = useState('');

// Variation is saved to project (line 534)
const newProject = await projectAPI.create({
  name,
  clientName,
  projectId,
  longRailVariation,  // ← Saved in projects table
  userId: user.id
});
```

**What happens:**
1. User selects variation from `LongRailDropdown` component
2. Variation name stored in `projects.long_rail_variation` field
3. Project created and user navigates to `/app`

---

### 2. **BOM Generation Flow** ✅ ANALYZED

**File:** `knapsack-front/src/services/bomCalculations.js`

#### Current Process:

**Step 1: Fetch ALL Master Items** (line 276)
```javascript
const response = await fetch(`${API_URL}/api/bom/master-items`, { headers });
const allProfiles = await response.json();
```

**What it returns:** (from `backend/src/services/bomService.js` line 6-35)
```javascript
{
  serialNumber: "1",
  sunrackCode: "MA-43",
  itemDescription: "Long Rail",
  genericName: "40mm Long Rail",
  material: "AA 6063",
  standardLength: 6000,
  uom: "Nos",
  designWeight: 1.234,
  formulas: [
    { formulaKey: "LONG_RAIL", calculationLevel: 1, ... }
  ],
  rmCodes: [...],
  preferredRmCode: "MA-43"
}
```

**Step 2: Generate BOM Items** (line 134-254)

```javascript
export async function generateBOMItems(bomData, activeCutLengths, profilesMap, aluminumRate) {
  // 1. Add Long Rails (lines 144-188)
  activeCutLengths.forEach(cutLength => {
    // Creates BOM item for each cut length
  });

  // 2. Add Hardware Items from Database (lines 190-252)
  Object.values(profilesMap).forEach(profile => {
    if (profile.formulas && profile.formulas.length > 0) {
      // Add items that have formulas
      hardwareItems.push({ ...profile, formulaKey: formula.formulaKey });
    }
  });

  // 3. Calculate quantities using formulas
  hardwareItems.forEach(item => {
    const qty = tabQuantities[tabName][item.formulaKey] || 0;
    // ... creates BOM item if qty > 0
  });
}
```

**Currently: ALL items with formulas are included** (no filtering by variation)

---

### 3. **Formula System** ✅ ANALYZED

**Location:** Formulas are defined in **TWO PLACES**:

#### A. **Frontend (Hardcoded)** - `bomCalculations.js` lines 15-41
```javascript
export const BOM_FORMULAS = {
  // Level 1
  LONG_RAIL: (tabCalc, cutLength) => tabCalc.cutLengths[cutLength] || 0,
  RAIL_JOINTER: (tabCalc) => tabCalc.joints,
  END_CLAMP: (tabCalc) => tabCalc.endClamps,
  MID_CLAMP: (tabCalc) => tabCalc.midClamps,

  // Level 2
  U_CLEAT: (tabCalc) => tabCalc.sb1 + tabCalc.sb2,
  RAIL_NUTS: (tabCalc, calculated) => calculated.END_CLAMP + calculated.MID_CLAMP,

  // Level 3
  M8x60_BOLT: (tabCalc, calculated) => calculated.U_CLEAT,
  M8x20_BOLT: (tabCalc, calculated) => calculated.END_CLAMP + calculated.MID_CLAMP,

  // ... more formulas
};
```

#### B. **Database** - `bom_formulas` table
```sql
SELECT * FROM bom_formulas;
-- Links formula_key to bom_master_items
-- Example:
-- item_serial_number: "2"
-- formula_key: "U_CLEAT"
-- calculation_level: 2
```

**Current Issue:** Formulas are **hardcoded**. They don't vary by variation type!

---

### 4. **BOM Display & Editing** ✅ ANALYZED

**File:** `knapsack-front/src/components/BOM/BOMTable.jsx`

- BOM items are displayed in a table
- Items can be drag/dropped to reorder (lines 19-44 - using @dnd-kit)
- Edit mode allows quantity/profile changes
- **Important**: Items are passed as `bomData.bomItems` array

**Current behavior:** Displays ALL items returned from generation

---

## Current Problems

### ❌ Problem 1: ALL Items Always Show
**Current:** When generating BOM, ALL items with formulas appear regardless of variation selected

**Example:**
- User selects "U Cleat Regular - Asbestos"
- BOM still shows SDS screws (which shouldn't be there for asbestos)
- BOM missing MA-52 Asbestos Curved Base

### ❌ Problem 2: Hardcoded Formulas
**Current:** `BOM_FORMULAS` object has hardcoded formula names

**Issue:** Different variations may need different formulas:
- Regular: Uses SB1/SB2 screws
- Asbestos: No SB1/SB2 screws, uses MA-52 instead
- Seam Clamp: Uses seam clamp formulas

### ❌ Problem 3: No Template Matching
**Current:** No connection between `project.longRailVariation` and which items to display

---

## Integration Solution (NON-BREAKING)

### 🎯 Goal
Filter BOM items based on selected variation **WITHOUT changing:**
- ✅ Existing BOM generation logic
- ✅ Existing formula calculations
- ✅ Existing edit functionality
- ✅ Existing saved BOMs

---

## Implementation Plan

### Phase 1: Filter Items by Template (Minimal Changes)

#### Step 1.1: Add Template Lookup Function

**New File:** `knapsack-front/src/services/templateService.js`

```javascript
import { API_URL } from './config';

/**
 * Fetch variation template from database
 * @param {string} variationName - e.g. "U Cleat Long Rail - Regular"
 * @returns {Promise<Object>} Template with items and defaultNotes
 */
export async function getVariationTemplate(variationName) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/bom-templates/${encodeURIComponent(variationName)}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}
```

#### Step 1.2: Create Backend API for Templates

**New File:** `backend/src/routes/templateRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken, checkPasswordChange } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticateToken);
router.use(checkPasswordChange);

// GET /api/bom-templates/:variationName
router.get('/:variationName', async (req, res, next) => {
  try {
    const { variationName } = req.params;

    const template = await prisma.bomVariationTemplate.findUnique({
      where: { variationName: decodeURIComponent(variationName) }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

**Register in:** `backend/src/app.js`
```javascript
const templateRoutes = require('./routes/templateRoutes');
app.use('/api/bom-templates', templateRoutes);
```

#### Step 1.3: Update BOM Generation to Filter Items

**Modify:** `knapsack-front/src/services/bomCalculations.js`

**Add import:**
```javascript
import { getVariationTemplate } from './templateService';
```

**Modify `generateCompleteBOM` function** (around line 264):

```javascript
export async function generateCompleteBOM(bomData, activeCutLengths, aluminumRate = DEFAULT_ALUMINIUM_RATE_PER_KG) {
  // Fetch all profiles from API
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let allProfiles = [];
  try {
    const response = await fetch(`${API_URL}/api/bom/master-items`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch master items: ${response.status} ${response.statusText}`);
    }
    allProfiles = await response.json();
  } catch (error) {
    console.error('Error fetching master items:', error);
  }

  // ✅ NEW: Fetch variation template
  const variationName = bomData.projectInfo.longRailVariation;
  let template = null;

  if (variationName) {
    try {
      template = await getVariationTemplate(variationName);
    } catch (error) {
      console.error('Error fetching template:', error);
      // Continue without template (fallback to all items)
    }
  }

  // Create profilesMap
  const profilesMap = {};
  if (Array.isArray(allProfiles)) {
    allProfiles.forEach(profile => {
      profilesMap[profile.serialNumber] = profile;
    });
  }

  // ✅ NEW: Pass template to generateBOMItems
  const bomItems = await generateBOMItems(
    bomData,
    activeCutLengths,
    profilesMap,
    aluminumRate,
    template  // ← NEW parameter
  );

  return {
    projectInfo: bomData.projectInfo,
    tabs: bomData.tabs,
    panelCounts: bomData.panelCounts,
    bomItems: bomItems,
    aluminumRate: aluminumRate,
    defaultNotes: template?.defaultNotes || []  // ✅ NEW: Include default notes
  };
}
```

**Modify `generateBOMItems` function** (around line 134):

```javascript
export async function generateBOMItems(
  bomData,
  activeCutLengths,
  profilesMap,
  aluminumRate = DEFAULT_ALUMINIUM_RATE_PER_KG,
  template = null  // ✅ NEW parameter
) {
  const bomItems = [];
  let serialNumber = 1;

  // Calculate quantities for each tab
  const tabQuantities = {};
  bomData.tabs.forEach(tabName => {
    tabQuantities[tabName] = calculateTabQuantities(bomData.tabCalculations[tabName]);
  });

  // ✅ NEW: Create a Set of allowed item codes from template
  let allowedItems = null;
  if (template && template.items) {
    allowedItems = new Set();
    template.items.forEach(item => {
      if (item.sunrackCode) {
        // Normalize codes (remove spaces for comparison)
        const normalizedCode = item.sunrackCode.replace(/\s+/g, '').toUpperCase();
        allowedItems.add(normalizedCode);
      }
      // Also add by description for fasteners (no code)
      if (item.itemDescription) {
        allowedItems.add(item.itemDescription.trim());
      }
    });
  }

  // ✅ NEW: Helper function to check if item is allowed
  function isItemAllowed(sunrackCode, itemDescription) {
    // If no template, allow all items (backward compatibility)
    if (!allowedItems) return true;

    // Check by sunrack code
    if (sunrackCode) {
      const normalizedCode = sunrackCode.replace(/\s+/g, '').toUpperCase();
      if (allowedItems.has(normalizedCode)) return true;
    }

    // Check by description (for fasteners)
    if (itemDescription && allowedItems.has(itemDescription.trim())) {
      return true;
    }

    return false;
  }

  // 1. Add Long Rails for each active cut length
  const profileSerialNumbers = Object.values(bomData.tabProfiles);
  const primaryProfileSerialNumber = profileSerialNumbers[0] || '26';
  const selectedProfile = profilesMap[primaryProfileSerialNumber];

  activeCutLengths.forEach(cutLength => {
    const quantities = {};
    let totalQty = 0;

    bomData.tabs.forEach(tabName => {
      const qty = bomData.tabCalculations[tabName].cutLengths[cutLength] || 0;
      quantities[tabName] = qty;
      totalQty += qty;
    });

    if (totalQty > 0) {
      const sunrackCode = selectedProfile?.preferredRmCode || selectedProfile?.sunrackCode || 'MA-43';

      // ✅ NEW: Check if Long Rail is allowed in this variation
      if (isItemAllowed(sunrackCode, selectedProfile?.genericName)) {
        const item = {
          sn: serialNumber++,
          sunrackCode: sunrackCode,
          profileImage: selectedProfile?.profileImagePath || '/assets/bom-profiles/MA-43.png',
          itemDescription: selectedProfile?.genericName || '40mm Long Rail',
          material: selectedProfile?.material || 'AA 6000 T5/T6',
          length: cutLength,
          uom: 'Nos',
          calculationType: 'CUT_LENGTH',
          profileSerialNumber: primaryProfileSerialNumber,
          quantities: quantities,
          totalQuantity: totalQty,
          spareQuantity: Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER),
          finalTotal: totalQty + Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER)
        };

        const weightCost = calculateWeightAndCost(item, profilesMap, aluminumRate);
        item.wtPerRm = weightCost.wtPerRm;
        item.rm = weightCost.rm;
        item.wt = weightCost.wt;
        item.cost = weightCost.cost;

        bomItems.push(item);
      }
    }
  });

  // 2. Build hardware items from database (items with formulas)
  const hardwareItems = [];

  Object.values(profilesMap).forEach(profile => {
    if (profile.formulas && profile.formulas.length > 0) {
      // ✅ NEW: Check if item is allowed before adding
      const sunrackCode = profile.preferredRmCode || profile.sunrackCode;

      if (isItemAllowed(sunrackCode, profile.genericName)) {
        profile.formulas.forEach(formula => {
          hardwareItems.push({
            sunrackCode: profile.sunrackCode,
            preferredRmCode: profile.preferredRmCode,
            profileImagePath: profile.profileImagePath,
            itemDescription: profile.genericName,
            material: profile.material,
            length: profile.standardLength,
            uom: profile.uom,
            formulaKey: formula.formulaKey,
            costPerPiece: profile.costPerPiece
          });
        });
      }
    }
  });

  // Rest of the function remains the same...
  hardwareItems.forEach(item => {
    const quantities = {};
    let totalQty = 0;

    bomData.tabs.forEach(tabName => {
      const qty = tabQuantities[tabName][item.formulaKey] || 0;
      quantities[tabName] = qty;
      totalQty += qty;
    });

    if (totalQty > 0) {
      const displayCode = item.preferredRmCode || item.sunrackCode;

      const bomItem = {
        sn: serialNumber++,
        sunrackCode: displayCode,
        profileImage: item.profileImagePath || null,
        itemDescription: item.itemDescription,
        material: item.material,
        length: item.length,
        uom: item.uom,
        calculationType: 'ACCESSORY',
        formulaKey: item.formulaKey,
        costPerPiece: item.costPerPiece,
        quantities: quantities,
        totalQuantity: totalQty,
        spareQuantity: Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER),
        finalTotal: totalQty + Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER)
      };

      const weightCost = calculateWeightAndCost(bomItem, profilesMap, aluminumRate);
      bomItem.wtPerRm = weightCost.wtPerRm;
      bomItem.rm = weightCost.rm;
      bomItem.wt = weightCost.wt;
      bomItem.cost = weightCost.cost;

      bomItems.push(bomItem);
    }
  });

  return bomItems;
}
```

---

## What This Achieves

### ✅ Benefits

1. **No Breaking Changes**
   - Existing BOMs still work (no template = show all items)
   - Formula calculations unchanged
   - Edit functionality unchanged
   - Save/load functionality unchanged

2. **Variation-Based Filtering**
   - Template lookup by variation name
   - Items filtered based on template.items array
   - Only allowed items appear in BOM

3. **Backward Compatible**
   - If no template found → shows all items (current behavior)
   - If variation not set → shows all items
   - Old projects continue to work

4. **Future-Ready**
   - Easy to add default notes later
   - Template-based formula mapping possible
   - Can extend templates with more metadata

---

## Testing Plan

### Test 1: Existing Projects (Backward Compatibility)
1. Open existing project (before templates)
2. Generate BOM
3. ✅ Should show all items as before

### Test 2: New Project - Regular Variation
1. Create new project with "U Cleat Long Rail - Regular"
2. Generate BOM
3. ✅ Should show 13 items (as per template)
4. ✅ Should include SDS screws

### Test 3: New Project - Asbestos Variation
1. Create new project with "U Cleat Long Rail - Regular - Asbestos"
2. Generate BOM
3. ✅ Should show 12 items (as per template)
4. ✅ Should include MA-52 Asbestos Curved Base
5. ✅ Should NOT include SDS 4.8, 5.5mm screws

### Test 4: BOM Editing
1. Generate BOM with template
2. Enter edit mode
3. ✅ Should allow quantity changes
4. ✅ Should allow profile changes
5. ✅ Should allow drag/drop reordering

---

## Files to Create/Modify

### NEW Files:
1. ✅ `knapsack-front/src/services/templateService.js` - Template API calls
2. ✅ `backend/src/routes/templateRoutes.js` - Template API endpoints

### MODIFY Files:
1. ✅ `knapsack-front/src/services/bomCalculations.js`
   - Add template parameter to functions
   - Add filtering logic
2. ✅ `backend/src/app.js`
   - Register template routes

### NO CHANGES NEEDED:
- ❌ BOM display components (BOMTable.jsx)
- ❌ BOM edit functionality
- ❌ Formula calculations
- ❌ Save/load logic
- ❌ Database schema (already created)

---

## Summary

### Current State:
- ❌ All items always show regardless of variation
- ❌ Variation dropdown has no effect on BOM
- ❌ No template matching

### After Integration:
- ✅ Items filtered by variation template
- ✅ Variation dropdown controls which items appear
- ✅ Template-based item filtering
- ✅ **NO breaking changes** to existing functionality
- ✅ Backward compatible with old BOMs
- ✅ Ready for default notes feature

---

## Next Steps

1. ✅ Create backend template API endpoint
2. ✅ Create frontend template service
3. ✅ Update BOM generation with filtering logic
4. ✅ Test with all 8 variations
5. ⏳ (Future) Add default notes display
6. ⏳ (Future) Add notes editing with "Future vs This BOM" dialog

---

**Ready to Proceed?**

The plan is designed to be **non-breaking** and **backward compatible**. Existing BOMs will continue to work, and new BOMs will automatically filter items based on the selected variation.

**Estimated Changes:** ~150 lines of code
**Risk Level:** LOW (fallback to current behavior if template not found)
**Testing Effort:** 2-3 hours

