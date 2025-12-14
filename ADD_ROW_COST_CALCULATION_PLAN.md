# Add Row Cost Calculation Enhancement - Implementation Plan

## Overview
Currently, when adding a new row to the BOM, cost calculation fails if the user doesn't provide a custom length. This plan adds the ability for users to specify either:
1. **Standard Length** (for weight-based cost calculation)
2. **Cost Per Piece** (for direct cost calculation)

Users can enter both values but must select which method to use for calculation via radio buttons.

---

## Current State

### AddRowModal.jsx (Current)
- Fields: Profile, Custom Length (optional), Quantities, Reason
- Custom Length is used for CUT_LENGTH calculation type
- Missing: Standard Length and Cost Per Piece fields

### BOMPage.jsx - handleAddRowConfirm() (Current)
- Creates new item with `length: newItemData.customLength`
- Sets `calculationType` based on whether customLength exists:
  - If customLength → 'CUT_LENGTH'
  - If no customLength → 'ACCESSORY'
- Calls `calculateWeightAndCost(newItem, profile, aluminumRate)`

### calculateWeightAndCost() Logic (Current)
```javascript
// 1. Check if profile.costPerPiece exists → use it
if (profile.costPerPiece && profile.costPerPiece > 0) {
  result.cost = parseFloat(profile.costPerPiece) * item.finalTotal;
  return result;
}

// 2. Otherwise, use weight-based calculation
const lengthToUse = item.length || profile.standardLength;
if (profile.designWeight && profile.designWeight > 0 && lengthToUse) {
  result.wtPerRm = parseFloat(profile.designWeight);
  result.rm = (lengthToUse / 1000) * item.finalTotal;  // mm to meters
  result.wt = result.rm * result.wtPerRm;
  result.cost = result.wt * aluminumRate;
}
```

---

## Required Changes

### 1. AddRowModal.jsx

#### New State Variables
Add these to the component state:
```javascript
const [standardLength, setStandardLength] = useState('');
const [costPerPiece, setCostPerPiece] = useState('');
const [calculationMethod, setCalculationMethod] = useState('standard_length'); // or 'cost_per_piece'
```

#### Reset Logic Update
In the `useEffect` that resets form when modal opens, add:
```javascript
setStandardLength('');
setCostPerPiece('');
setCalculationMethod('standard_length');
```

#### New UI Sections to Add

**Location**: After "Custom Length" section and before "Quantities per Building" section

```jsx
{/* Calculation Method Section */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-3">
    Cost Calculation Method: <span className="text-red-500">*</span>
  </label>

  <div className="space-y-4">
    {/* Radio Button 1: Standard Length */}
    <div className="flex items-start gap-3">
      <input
        type="radio"
        id="calc-standard-length"
        name="calculationMethod"
        value="standard_length"
        checked={calculationMethod === 'standard_length'}
        onChange={(e) => setCalculationMethod(e.target.value)}
        className="mt-1"
      />
      <div className="flex-1">
        <label htmlFor="calc-standard-length" className="text-sm font-medium text-gray-700 cursor-pointer">
          Calculate based on Standard Length (Weight-based)
        </label>
        <div className="mt-2">
          <label className="block text-xs text-gray-600 mb-1">
            Standard Length (mm):
          </label>
          <input
            type="number"
            value={standardLength}
            onChange={(e) => setStandardLength(e.target.value)}
            placeholder="e.g., 6000"
            disabled={calculationMethod !== 'standard_length'}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              calculationMethod !== 'standard_length' ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Cost = (Length/1000) × Quantity × Weight/RM × Aluminum Rate
          </p>
        </div>
      </div>
    </div>

    {/* Radio Button 2: Cost Per Piece */}
    <div className="flex items-start gap-3">
      <input
        type="radio"
        id="calc-cost-per-piece"
        name="calculationMethod"
        value="cost_per_piece"
        checked={calculationMethod === 'cost_per_piece'}
        onChange={(e) => setCalculationMethod(e.target.value)}
        className="mt-1"
      />
      <div className="flex-1">
        <label htmlFor="calc-cost-per-piece" className="text-sm font-medium text-gray-700 cursor-pointer">
          Calculate based on Cost Per Piece (Direct cost)
        </label>
        <div className="mt-2">
          <label className="block text-xs text-gray-600 mb-1">
            Cost Per Piece (₹):
          </label>
          <input
            type="number"
            value={costPerPiece}
            onChange={(e) => setCostPerPiece(e.target.value)}
            placeholder="e.g., 25.50"
            step="0.01"
            disabled={calculationMethod !== 'cost_per_piece'}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              calculationMethod !== 'cost_per_piece' ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Cost = Cost Per Piece × Quantity
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### Validation in handleAdd()
Update validation to check calculation method:
```javascript
const handleAdd = () => {
  if (!selectedProfile) {
    alert('Please select a profile');
    return;
  }

  if (!reason.trim()) {
    alert('Please provide a reason for adding this item');
    return;
  }

  const totalQty = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  if (totalQty === 0) {
    alert('Please enter at least one quantity');
    return;
  }

  // NEW VALIDATION: Check calculation method requirements
  if (calculationMethod === 'standard_length') {
    if (!standardLength || parseFloat(standardLength) <= 0) {
      alert('Please enter a valid Standard Length for weight-based calculation');
      return;
    }
  } else if (calculationMethod === 'cost_per_piece') {
    if (!costPerPiece || parseFloat(costPerPiece) <= 0) {
      alert('Please enter a valid Cost Per Piece');
      return;
    }
  }

  onAdd({
    profileSerialNumber: selectedProfile,
    quantities: quantities,
    customLength: customLength ? parseInt(customLength) : null,
    standardLength: standardLength ? parseInt(standardLength) : null,  // NEW
    costPerPiece: costPerPiece ? parseFloat(costPerPiece) : null,      // NEW
    calculationMethod: calculationMethod,                               // NEW
    reason: reason
  });

  onClose();
};
```

#### Note about Custom Length vs Standard Length
- **Custom Length**: For items that need to be cut to a specific length (CUT_LENGTH type)
- **Standard Length**: For accessories/profiles used at their standard/default length
- These are DIFFERENT fields and both can exist

---

### 2. BOMPage.jsx - handleAddRowConfirm()

#### Update Item Creation Logic
```javascript
const handleAddRowConfirm = (newItemData) => {
  const profile = profiles.find(p => p.serialNumber === newItemData.profileSerialNumber);
  if (!profile) {
    alert('Profile not found');
    return;
  }

  // Validate addAfterRow
  const maxRow = bomData.bomItems.length;
  const insertAfter = Math.max(0, Math.min(addAfterRow, maxRow));

  // Calculate totals
  const totalQty = Object.values(newItemData.quantities).reduce((sum, qty) => sum + qty, 0);
  const spareQty = Math.ceil(totalQty * (sparePercentage / 100));
  const finalTotal = totalQty + spareQty;

  // Determine calculation type
  let calculationType = 'ACCESSORY';
  if (newItemData.customLength) {
    calculationType = 'CUT_LENGTH';
  }

  // Create new item with user-provided cost data
  const newItem = {
    sn: insertAfter + 1,
    profileSerialNumber: newItemData.profileSerialNumber,
    sunrackCode: profile.preferredRmCode || profile.sunrackCode,
    profileImage: profile.profileImagePath,
    itemDescription: profile.genericName,
    material: profile.material,
    length: newItemData.customLength || newItemData.standardLength,  // UPDATED: Use custom or standard
    uom: profile.uom,
    calculationType: calculationType,
    quantities: newItemData.quantities,
    totalQuantity: totalQty,
    spareQuantity: spareQty,
    finalTotal: finalTotal,
    userEdits: {
      addedManually: true,
      reason: newItemData.reason,
      // Store user's calculation preferences
      userProvidedStandardLength: newItemData.standardLength || null,
      userProvidedCostPerPiece: newItemData.costPerPiece || null,
      calculationMethod: newItemData.calculationMethod
    }
  };

  // Create a modified profile object with user overrides
  const profileForCalculation = {
    ...profile,
    // Override profile values with user-provided values if they exist
    standardLength: newItemData.standardLength || profile.standardLength,
    costPerPiece: newItemData.costPerPiece || profile.costPerPiece
  };

  // IMPORTANT: Force the calculation method
  // If user selected cost_per_piece, temporarily modify profile to prioritize it
  if (newItemData.calculationMethod === 'cost_per_piece' && newItemData.costPerPiece) {
    profileForCalculation.costPerPiece = parseFloat(newItemData.costPerPiece);
  } else if (newItemData.calculationMethod === 'standard_length') {
    // If standard length selected, ensure costPerPiece doesn't interfere
    // Set costPerPiece to null/0 to force weight-based calculation
    profileForCalculation.costPerPiece = null;
  }

  // Calculate weight and cost
  const weightCost = calculateWeightAndCost(newItem, profileForCalculation, aluminumRate);
  newItem.wtPerRm = weightCost.wtPerRm;
  newItem.rm = weightCost.rm;
  newItem.wt = weightCost.wt;
  newItem.cost = weightCost.cost;
  newItem.costPerPiece = weightCost.costPerPiece;

  // Insert into array at the specified position
  const updatedItems = [...bomData.bomItems];
  updatedItems.splice(insertAfter, 0, newItem);

  // Renumber all S.N
  updatedItems.forEach((item, index) => {
    item.sn = index + 1;
  });

  // Add to change log with calculation method
  const newChangeLog = [...changeLog, {
    type: 'ADD_ROW',
    itemName: newItem.itemDescription,
    rowNumber: insertAfter + 1,
    reason: newItemData.reason,
    calculationMethod: newItemData.calculationMethod,
    timestamp: new Date().toISOString()
  }];

  setBomData({ ...bomData, bomItems: updatedItems });
  setChangeLog(newChangeLog);
  setShowAddModal(false);

  // Reset addAfterRow to new last row
  setAddAfterRow(updatedItems.length);
};
```

---

### 3. calculateWeightAndCost() - No Changes Needed

The existing `calculateWeightAndCost()` function already handles both cases correctly:
1. If `profile.costPerPiece` exists and > 0 → uses cost per piece
2. Otherwise → uses weight-based calculation with `item.length || profile.standardLength`

By modifying the `profileForCalculation` object before passing it to this function, we control which calculation method is used.

---

## Database Persistence

### Backend - bomReconstructionService.js

The minimal BOM format already stores `userEdits`, so the user-provided values will be persisted:

```javascript
// In convertToMinimalBOM()
return {
  sn: item.sn,
  profileSerialNumber: profileSerialNumber,
  calculationType: item.calculationType,
  length: item.length || null,
  quantities: item.quantities || {},
  userEdits: item.userEdits || null,  // This stores userProvidedStandardLength, userProvidedCostPerPiece, calculationMethod
  formulaKey: item.formulaKey || null
};
```

When reconstructing, if `userEdits.calculationMethod` exists, the same logic should be applied.

---

## Edge Cases & Validation

### 1. Both Fields Filled But No Radio Selected
- Default to 'standard_length' method
- Or require explicit selection before enabling "Add Item" button

### 2. User Switches Radio After Filling Field
- Keep both field values
- Only the selected method's value is used for calculation

### 3. Custom Length vs Standard Length
- If Custom Length is filled → always use CUT_LENGTH calculation type
- If only Standard Length is filled → use ACCESSORY type with standard length
- Custom Length takes precedence for `item.length` field

### 4. Profile Already Has costPerPiece
- User can override with modal's costPerPiece value
- User's selection via radio button determines which is used

### 5. Zero or Negative Values
- Validate that length and cost per piece are > 0
- Show error messages for invalid inputs

---

## Testing Checklist

After implementation, test these scenarios:

### Test 1: Standard Length Calculation
1. Enable edit mode
2. Click "Add Row"
3. Select a profile (e.g., aluminum profile)
4. Select "Calculate based on Standard Length"
5. Enter Standard Length: 6000 mm
6. Enter quantities
7. Verify: Cost = (6000/1000) × quantity × designWeight × aluminumRate

### Test 2: Cost Per Piece Calculation
1. Enable edit mode
2. Click "Add Row"
3. Select a profile (e.g., fastener)
4. Select "Calculate based on Cost Per Piece"
5. Enter Cost Per Piece: ₹25.50
6. Enter quantities (total = 100)
7. Verify: Cost = 25.50 × 100 = ₹2550

### Test 3: Both Fields Filled
1. Fill both Standard Length AND Cost Per Piece
2. Select "Standard Length" → verify weight-based calculation
3. (Optional) Edit row and switch to "Cost Per Piece" → verify direct cost

### Test 4: Save and Reload
1. Add row with custom calculation
2. Click "Done Editing" to save
3. Refresh page
4. Verify the added row still has correct cost calculations

### Test 5: Custom Length + Standard Length
1. Enter Custom Length: 5500
2. Enter Standard Length: 6000
3. Verify: Custom Length is used (item.length = 5500)
4. Verify: calculationType = 'CUT_LENGTH'

---

## UI/UX Notes

1. **Radio Button Styling**: Ensure radio buttons are clearly visible and clickable
2. **Disabled Input Styling**: Gray out the input field when its radio button is not selected
3. **Helper Text**: Show formulas below each input to clarify what calculation will be used
4. **Field Labels**: Use clear labels with asterisks for required fields
5. **Validation Messages**: Use specific error messages (not generic "fill all fields")

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `AddRowModal.jsx` | Add 3 new state vars, add UI section with radio buttons and 2 inputs, update validation |
| `BOMPage.jsx` | Modify `handleAddRowConfirm()` to create `profileForCalculation` object with user overrides |
| `calculateWeightAndCost()` | **No changes needed** - already handles both cases |
| Backend | **No changes needed** - `userEdits` already persists custom data |

---

## Implementation Priority

1. **High Priority**: Modal UI changes (radio buttons, inputs, validation)
2. **High Priority**: Frontend logic to pass calculation data
3. **Medium Priority**: Save/load persistence testing
4. **Low Priority**: Change log enhancements to show calculation method

---

## Notes for AI Agent

- Remove all `console.log()` statements added for debugging in `handleAddRowConfirm()`
- Ensure proper TypeScript/PropTypes if project uses them
- Match existing code style (spacing, quotes, component structure)
- Test with both aluminum profiles (weight-based) and fasteners (cost-based)
- The key insight: **Don't modify calculateWeightAndCost()**, instead modify the profile object before passing it
