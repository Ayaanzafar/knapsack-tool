# BOM Edit Mode & Change Log Implementation Plan

## Overview
This document outlines the complete implementation plan for BOM storage, edit functionality, and change tracking with audit trail.

---

## Phase 1: BOM Storage in Database

### 1.1 Backend API Endpoints

#### 1.1.1 Save BOM
- **Endpoint**: `POST /api/bom/save`
- **Request Body**:
```json
{
  "projectId": 123,
  "bomData": {
    "projectInfo": {...},
    "tabs": [...],
    "bomItems": [...],
    "profilesMap": {...},
    "aluminumRate": 527.85
  }
}
```
- **Response**:
```json
{
  "bomId": 456,
  "message": "BOM saved successfully"
}
```

#### 1.1.2 Get All BOMs for a Project
- **Endpoint**: `GET /api/bom/project/:projectId`
- **Response**:
```json
{
  "boms": [
    {
      "id": 456,
      "generatedAt": "2025-12-14T10:30:00",
      "version": 1,
      "hasChanges": false
    },
    {
      "id": 457,
      "generatedAt": "2025-12-14T11:45:00",
      "version": 2,
      "hasChanges": true
    }
  ]
}
```

#### 1.1.3 Get Specific BOM by ID
- **Endpoint**: `GET /api/bom/:bomId`
- **Response**:
```json
{
  "id": 456,
  "projectId": 123,
  "bomData": {...},
  "changeLog": [...],
  "generatedAt": "2025-12-14T10:30:00"
}
```

#### 1.1.4 Update BOM
- **Endpoint**: `PUT /api/bom/:bomId`
- **Request Body**:
```json
{
  "bomData": {...},
  "changeLog": [...]
}
```

### 1.2 Database Schema Updates

#### Update `generated_boms` table:
```prisma
model GeneratedBom {
  id          Int      @id @default(autoincrement())
  projectId   Int      @map("project_id")
  generatedAt DateTime @default(now()) @map("generated_at")
  bomData     Json     @map("bom_data")          // Complete BOM data
  changeLog   Json?    @map("change_log")        // NEW: Array of changes
  version     Int      @default(1)                // NEW: Version number
  isLatest    Boolean  @default(true)             // NEW: Mark latest version
  generatedBy Int?     @map("generated_by")       // NEW: User ID (future)
  updatedAt   DateTime @updatedAt @map("updated_at") // NEW: Last update time

  project Project @relation(fields: [projectId], references: [id])

  @@map("generated_boms")
}
```

### 1.3 Frontend Changes

#### 1.3.1 Save BOM on Generation
**File**: `knapsack-front/src/components/BOM/CreateBOMButton.jsx`

```javascript
const handleCreateBOM = async () => {
  // ... existing code ...
  const completeBOM = await generateCompleteBOM(bomData, activeCutLengths);

  // NEW: Save to database
  const savedBOM = await saveBOMToDatabase(projectId, completeBOM);

  // Navigate with bomId instead of bomData
  navigate('/bom', { state: { bomId: savedBOM.bomId } });
};
```

#### 1.3.2 Load BOM from Database
**File**: `knapsack-front/src/components/BOM/BOMPage.jsx`

```javascript
useEffect(() => {
  if (location.state?.bomId) {
    // NEW: Fetch BOM from database
    fetchBOMFromDatabase(location.state.bomId).then(data => {
      setBomData(data.bomData);
      setChangeLog(data.changeLog || []);
    });
  } else if (location.state?.bomData) {
    // Fallback: Direct BOM data (for backward compatibility)
    setBomData(location.state.bomData);
  } else {
    navigate('/');
  }
}, [location.state, navigate]);
```

#### 1.3.3 BOM Service Functions
**File**: `knapsack-front/src/services/bomService.js` (NEW FILE)

```javascript
export async function saveBOMToDatabase(projectId, bomData) {
  const response = await fetch(`${API_URL}/api/bom/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, bomData })
  });
  return response.json();
}

export async function fetchBOMFromDatabase(bomId) {
  const response = await fetch(`${API_URL}/api/bom/${bomId}`);
  return response.json();
}

export async function updateBOMInDatabase(bomId, bomData, changeLog) {
  const response = await fetch(`${API_URL}/api/bom/${bomId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bomData, changeLog })
  });
  return response.json();
}
```

---

## Phase 2: Edit Mode Features

### 2.1 Edit Quantity Columns (Per Tab/Building)

#### 2.1.1 UI Changes
**File**: `knapsack-front/src/components/BOM/BOMTableRow.jsx`

**Current Display** (Read Mode):
```jsx
{tabs.map((tabName) => (
  <td key={tabName}>{quantities[tabName] || 0}</td>
))}
```

**New Display** (Edit Mode):
```jsx
{tabs.map((tabName) => (
  <td key={tabName}>
    {editMode ? (
      <input
        type="number"
        value={quantities[tabName] || 0}
        onChange={(e) => handleQuantityChange(tabName, e.target.value)}
        className="w-16 px-2 py-1 border rounded"
      />
    ) : (
      <span>{quantities[tabName] || 0}</span>
    )}
  </td>
))}
```

#### 2.1.2 Auto-Update Logic

When quantity changes:
1. **Update quantities object** for that tab
2. **Recalculate totalQuantity** = sum of all tab quantities
3. **Recalculate spareQuantity** = totalQuantity × (sparePercentage / 100)
4. **Recalculate finalTotal** = totalQuantity + spareQuantity
5. **Recalculate weight & cost** using finalTotal
6. **Trigger change log modal** to capture reason

```javascript
const handleQuantityChange = (itemIndex, tabName, newValue) => {
  const oldValue = bomData.bomItems[itemIndex].quantities[tabName];

  // Update quantities
  const updatedItems = [...bomData.bomItems];
  updatedItems[itemIndex].quantities[tabName] = parseInt(newValue) || 0;

  // Recalculate totals
  const totalQty = Object.values(updatedItems[itemIndex].quantities)
    .reduce((sum, qty) => sum + qty, 0);

  updatedItems[itemIndex].totalQuantity = totalQty;
  updatedItems[itemIndex].spareQuantity = Math.ceil(totalQty * (sparePercentage / 100));
  updatedItems[itemIndex].finalTotal = totalQty + updatedItems[itemIndex].spareQuantity;

  // Recalculate weight and cost
  const weightCost = calculateWeightAndCost(
    updatedItems[itemIndex],
    profilesMap,
    aluminumRate
  );
  updatedItems[itemIndex].wt = weightCost.wt;
  updatedItems[itemIndex].cost = weightCost.cost;

  // Show reason modal
  showReasonModal({
    type: 'EDIT_QUANTITY',
    itemName: updatedItems[itemIndex].itemDescription,
    rowNumber: itemIndex + 1,
    tabName: tabName,
    oldValue: oldValue,
    newValue: newValue,
    onConfirm: (reason) => {
      // Add to change log
      addChangeLog({
        type: 'EDIT_QUANTITY',
        itemName: updatedItems[itemIndex].itemDescription,
        rowNumber: itemIndex + 1,
        tabName: tabName,
        oldValue: oldValue,
        newValue: newValue,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      // Update state
      setBomData({ ...bomData, bomItems: updatedItems });
    }
  });
};
```

### 2.2 Edit Spare Quantity & Percentage

#### 2.2.1 Add Spare Percentage Input (Global)
**File**: `knapsack-front/src/components/BOM/BOMPage.jsx`

Add input field next to Aluminum Rate:

```jsx
<div className="flex items-center gap-3">
  <label className="text-sm font-semibold text-gray-700">
    Spare Percentage (%):
  </label>
  <input
    type="number"
    value={sparePercentage}
    onChange={(e) => handleSparePercentageChange(e.target.value)}
    step="0.1"
    min="0"
    max="100"
    className="w-24 px-3 py-2 border rounded-lg"
  />
</div>
```

#### 2.2.2 Edit Spare Quantity (Per Item)
**File**: `knapsack-front/src/components/BOM/BOMTableRow.jsx`

Make spare quantity editable in edit mode:

```jsx
<td>
  {editMode ? (
    <input
      type="number"
      value={spareQuantity}
      onChange={(e) => handleSpareQuantityChange(item.sn, e.target.value)}
      className="w-20 px-2 py-1 border rounded bg-green-50"
    />
  ) : (
    <span>{spareQuantity}</span>
  )}
</td>
```

#### 2.2.3 Auto-Update on Spare Percentage Change

When global spare percentage changes:
```javascript
const handleSparePercentageChange = (newPercentage) => {
  const percentage = parseFloat(newPercentage) || 0;

  // Update all items
  const updatedItems = bomData.bomItems.map(item => {
    const newSpareQty = Math.ceil(item.totalQuantity * (percentage / 100));
    const newFinalTotal = item.totalQuantity + newSpareQty;

    // Recalculate weight and cost
    const weightCost = calculateWeightAndCost(
      { ...item, finalTotal: newFinalTotal },
      profilesMap,
      aluminumRate
    );

    return {
      ...item,
      spareQuantity: newSpareQty,
      finalTotal: newFinalTotal,
      wt: weightCost.wt,
      cost: weightCost.cost
    };
  });

  // Show reason modal
  showReasonModal({
    type: 'CHANGE_SPARE_PERCENTAGE',
    oldValue: sparePercentage,
    newValue: percentage,
    onConfirm: (reason) => {
      addChangeLog({
        type: 'CHANGE_SPARE_PERCENTAGE',
        oldValue: sparePercentage,
        newValue: percentage,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      setSparePercentage(percentage);
      setBomData({ ...bomData, bomItems: updatedItems });
    }
  });
};
```

### 2.3 Add New Row

#### 2.3.1 UI - Add Button
**File**: `knapsack-front/src/components/BOM/BOMTableRow.jsx`

Add "+" button in edit mode:

```jsx
{editMode && (
  <td className="border px-2 py-2">
    <button
      onClick={() => onAddRow(item.sn)}
      className="text-green-600 hover:text-green-800"
      title="Add item after this row"
    >
      <svg className="w-5 h-5">
        <path d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </td>
)}
```

#### 2.3.2 Add Row Modal
**File**: `knapsack-front/src/components/BOM/AddRowModal.jsx` (NEW FILE)

```jsx
export default function AddRowModal({ isOpen, afterRowNumber, onClose, onAdd }) {
  const [selectedProfile, setSelectedProfile] = useState('');
  const [quantities, setQuantities] = useState({});
  const [customLength, setCustomLength] = useState('');
  const [reason, setReason] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Add New Item After Row {afterRowNumber}</h2>

      <div>
        <label>Select Profile:</label>
        <select value={selectedProfile} onChange={...}>
          {profiles.map(p => (
            <option value={p.serialNumber}>{p.genericName}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Quantities (per building):</label>
        {tabs.map(tab => (
          <div key={tab}>
            <label>{tab}:</label>
            <input type="number" value={quantities[tab] || 0} />
          </div>
        ))}
      </div>

      <div>
        <label>Custom Length (mm) - Optional:</label>
        <input type="number" value={customLength} />
      </div>

      <div>
        <label>Reason for adding this item:</label>
        <textarea value={reason} required />
      </div>

      <button onClick={handleAdd}>Add Item</button>
      <button onClick={onClose}>Cancel</button>
    </Modal>
  );
}
```

#### 2.3.3 Add Row Logic

```javascript
const handleAddRow = (afterRowNumber, newItemData, reason) => {
  const insertIndex = afterRowNumber; // Insert after this index

  // Create new item
  const newItem = {
    sn: afterRowNumber + 1, // Temporary SN
    ...newItemData,
    totalQuantity: Object.values(newItemData.quantities).reduce((a, b) => a + b, 0),
    spareQuantity: Math.ceil(totalQuantity * (sparePercentage / 100)),
    finalTotal: totalQuantity + spareQuantity
  };

  // Calculate weight and cost
  const weightCost = calculateWeightAndCost(newItem, profilesMap, aluminumRate);
  newItem.wt = weightCost.wt;
  newItem.cost = weightCost.cost;

  // Insert into array
  const updatedItems = [
    ...bomData.bomItems.slice(0, insertIndex),
    newItem,
    ...bomData.bomItems.slice(insertIndex)
  ];

  // Renumber all S.N
  updatedItems.forEach((item, index) => {
    item.sn = index + 1;
  });

  // Add to change log
  addChangeLog({
    type: 'ADD_ROW',
    itemName: newItem.itemDescription,
    rowNumber: afterRowNumber + 1,
    reason: reason,
    timestamp: new Date().toISOString()
  });

  setBomData({ ...bomData, bomItems: updatedItems });
};
```

### 2.4 Delete Row

#### 2.4.1 UI - Delete Button

```jsx
{editMode && (
  <td className="border px-2 py-2">
    <button
      onClick={() => onDeleteRow(item.sn)}
      className="text-red-600 hover:text-red-800"
      title="Delete this row"
    >
      <svg className="w-5 h-5">
        <path d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </td>
)}
```

#### 2.4.2 Delete Row Logic

```javascript
const handleDeleteRow = (rowNumber) => {
  const itemToDelete = bomData.bomItems.find(item => item.sn === rowNumber);

  // Show confirmation + reason modal
  showReasonModal({
    type: 'DELETE_ROW',
    message: `Are you sure you want to delete "${itemToDelete.itemDescription}"?`,
    onConfirm: (reason) => {
      // Remove item
      const updatedItems = bomData.bomItems.filter(item => item.sn !== rowNumber);

      // Renumber S.N
      updatedItems.forEach((item, index) => {
        item.sn = index + 1;
      });

      // Add to change log
      addChangeLog({
        type: 'DELETE_ROW',
        itemName: itemToDelete.itemDescription,
        rowNumber: rowNumber,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      setBomData({ ...bomData, bomItems: updatedItems });
    }
  });
};
```

---

## Phase 3: Change Log & Disclaimers

### 3.1 Change Log Data Structure

**File**: `knapsack-front/src/components/BOM/BOMPage.jsx`

```javascript
const [changeLog, setChangeLog] = useState([
  {
    id: 1,
    type: 'EDIT_QUANTITY',           // Type of change
    itemName: '40mm Long Rail',      // Item affected
    rowNumber: 1,                    // Row number
    tabName: 'T1',                   // Building/tab (for qty changes)
    oldValue: 50,                    // Old value
    newValue: 60,                    // New value
    reason: 'Client requested...',   // User's reason
    timestamp: '2025-12-14T11:30:00' // When changed
  },
  // ... more changes
]);
```

### 3.2 Change Types

```javascript
const CHANGE_TYPES = {
  EDIT_QUANTITY: 'Quantity changed',
  EDIT_SPARE_QTY: 'Spare quantity manually changed',
  CHANGE_SPARE_PERCENTAGE: 'Spare percentage changed globally',
  CHANGE_PROFILE: 'Profile changed',
  ADD_ROW: 'New item added',
  DELETE_ROW: 'Item deleted',
  EDIT_ALUMINUM_RATE: 'Aluminum rate changed'
};
```

### 3.3 Reason Modal Component

**File**: `knapsack-front/src/components/BOM/ReasonModal.jsx` (NEW FILE)

```jsx
export default function ReasonModal({ isOpen, changeData, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('Please provide a reason for this change');
      return;
    }
    onConfirm(reason);
    setReason('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <h2 className="text-lg font-bold mb-4">
        🔄 Confirm Change
      </h2>

      <div className="mb-4 p-3 bg-blue-50 rounded">
        <p className="font-semibold">Change Details:</p>
        <p className="text-sm mt-2">
          {formatChangeDescription(changeData)}
        </p>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2">
          Why are you making this change? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          rows="4"
          placeholder="Enter the reason for this change..."
          required
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 border rounded">
          Cancel
        </button>
        <button onClick={handleConfirm} className="px-4 py-2 bg-purple-600 text-white rounded">
          Confirm Change
        </button>
      </div>
    </Modal>
  );
}
```

### 3.4 Disclaimers Display

**File**: `knapsack-front/src/components/BOM/ChangeLogDisplay.jsx` (NEW FILE)

```jsx
export default function ChangeLogDisplay({ changeLog }) {
  if (!changeLog || changeLog.length === 0) {
    return null;
  }

  const formatChangeMessage = (change) => {
    switch (change.type) {
      case 'EDIT_QUANTITY':
        return `The quantity for "${change.itemName}" (Row ${change.rowNumber}) in building "${change.tabName}" has been changed from ${change.oldValue} to ${change.newValue}.`;

      case 'ADD_ROW':
        return `New item "${change.itemName}" added after Row ${change.rowNumber - 1}.`;

      case 'DELETE_ROW':
        return `Item "${change.itemName}" (Row ${change.rowNumber}) has been deleted.`;

      case 'CHANGE_SPARE_PERCENTAGE':
        return `Spare percentage changed globally from ${change.oldValue}% to ${change.newValue}%.`;

      case 'CHANGE_PROFILE':
        return `Profile for "${change.itemName}" (Row ${change.rowNumber}) changed from "${change.oldValue}" to "${change.newValue}".`;

      default:
        return 'Change recorded';
    }
  };

  return (
    <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg print:border-black print:bg-white">
      <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center gap-2">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        DISCLAIMERS - Bill of Materials Changes
      </h3>

      <div className="space-y-4">
        {changeLog.map((change, index) => (
          <div key={change.id || index} className="border-l-2 border-yellow-600 pl-4 pb-3">
            <p className="text-sm text-gray-800 mb-1">
              • {formatChangeMessage(change)}
            </p>
            <p className="text-sm text-gray-700 ml-2">
              <span className="font-semibold">Reason:</span> {change.reason}
            </p>
            <p className="text-xs text-gray-500 ml-2 mt-1">
              Modified on: {new Date(change.timestamp).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3.5 Integration in BOMPage

**File**: `knapsack-front/src/components/BOM/BOMPage.jsx`

```jsx
import ChangeLogDisplay from './ChangeLogDisplay';

// ... in render:
return (
  <div>
    {/* ... existing BOM table ... */}

    {/* Change Log Display */}
    <ChangeLogDisplay changeLog={changeLog} />
  </div>
);
```

### 3.6 Save Changes to Database

After any change:

```javascript
const saveChangesToDatabase = async () => {
  if (!bomId) return;

  await updateBOMInDatabase(bomId, bomData, changeLog);
};

// Call after each change
useEffect(() => {
  if (bomData && changeLog.length > 0) {
    // Debounce to avoid too many saves
    const timer = setTimeout(() => {
      saveChangesToDatabase();
    }, 1000);

    return () => clearTimeout(timer);
  }
}, [bomData, changeLog]);
```

---

## Phase 4: Additional Features

### 4.1 Save Button with Confirmation

Add explicit "Save Changes" button in edit mode:

```jsx
{editMode && (
  <button
    onClick={handleSaveChanges}
    className="px-4 py-2 bg-green-600 text-white rounded-lg"
  >
    💾 Save All Changes
  </button>
)}
```

### 4.2 Discard Changes

Option to revert all changes:

```jsx
<button
  onClick={handleDiscardChanges}
  className="px-4 py-2 border border-red-600 text-red-600 rounded-lg"
>
  ↩️ Discard Changes
</button>
```

### 4.3 Version History

Show list of previous BOM versions:

```jsx
<div className="mb-4">
  <label>BOM Version History:</label>
  <select onChange={(e) => loadBOMVersion(e.target.value)}>
    <option value="latest">Latest (Current)</option>
    <option value="456">Version 1 - 14 Dec 2025, 10:30 AM</option>
    <option value="457">Version 2 - 14 Dec 2025, 11:45 AM</option>
  </select>
</div>
```

### 4.4 Export with Disclaimers

When printing or exporting PDF, include change log automatically.

---

## Implementation Order Summary

### Step 1: BOM Storage (Week 1)
- [ ] Create backend API endpoints
- [ ] Update database schema
- [ ] Implement save BOM on generation
- [ ] Implement load BOM from database
- [ ] Test save/retrieve functionality

### Step 2: Edit Quantity Features (Week 2)
- [ ] Make Qty columns editable in edit mode
- [ ] Implement auto-update logic for totals
- [ ] Make spare quantity editable
- [ ] Add spare percentage input
- [ ] Test calculations

### Step 3: Add/Delete Rows (Week 2-3)
- [ ] Create Add Row modal
- [ ] Implement add row logic
- [ ] Create Delete row confirmation
- [ ] Implement delete row logic
- [ ] Test row operations

### Step 4: Change Log System (Week 3-4)
- [ ] Create ReasonModal component
- [ ] Implement change tracking for all operations
- [ ] Create ChangeLogDisplay component
- [ ] Integrate with all edit operations
- [ ] Save change log to database
- [ ] Test end-to-end

### Step 5: Polish & Additional Features (Week 4)
- [ ] Add Save/Discard buttons
- [ ] Implement version history
- [ ] Add export with disclaimers
- [ ] Testing and bug fixes

---

## Technical Considerations

### 1. Data Consistency
- Always recalculate dependent values (totals, spare, weight, cost)
- Validate user inputs (no negative quantities)
- Ensure S.N renumbering after add/delete

### 2. Performance
- Debounce auto-save to database
- Use React.memo for table rows to prevent unnecessary re-renders
- Consider virtualization if BOM has 100+ items

### 3. User Experience
- Show loading states during save
- Confirm before destructive operations (delete, discard changes)
- Provide clear error messages
- Auto-save progress indicator

### 4. Security
- Validate all inputs server-side
- Prevent SQL injection in database queries
- Implement user authentication (future)
- Audit trail for compliance

---

## Files to Create/Modify

### New Files:
1. `backend/src/controllers/bomStorageController.js`
2. `backend/src/routes/bomStorageRoutes.js`
3. `knapsack-front/src/services/bomService.js`
4. `knapsack-front/src/components/BOM/ReasonModal.jsx`
5. `knapsack-front/src/components/BOM/ChangeLogDisplay.jsx`
6. `knapsack-front/src/components/BOM/AddRowModal.jsx`

### Files to Modify:
1. `backend/prisma/schema.prisma`
2. `knapsack-front/src/components/BOM/BOMPage.jsx`
3. `knapsack-front/src/components/BOM/BOMTable.jsx`
4. `knapsack-front/src/components/BOM/BOMTableRow.jsx`
5. `knapsack-front/src/components/BOM/CreateBOMButton.jsx`
6. `knapsack-front/src/services/bomCalculations.js`

---

## End of Plan
This plan can be referenced and implemented step-by-step. Each phase builds on the previous one, ensuring a solid foundation before adding more complex features.
