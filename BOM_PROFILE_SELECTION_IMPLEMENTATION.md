# BOM Profile Selection Feature - Implementation Guide

## Feature Overview
Allow users to select BOM profiles (like "40mm Long Rail", "80mm Mini Rail") for cut length items and accessories in the BOM page. Changes persist to database and affect all cut length rows together, while accessories are individually selectable.

---

## ✅ COMPLETED (Backend + Database)

### 1. Database Schema Changes
- **File**: `backend/prisma/schema.prisma:60-61`
- **Change**: Added `longRailProfileSerialNumber` field to `Tab` model
```prisma
// BOM Profile Selection
longRailProfileSerialNumber String? @map("long_rail_profile_serial_number") @db.VarChar(20)
```
- **Migration**: `20251212091610_add_long_rail_profile_to_tabs`
- **Status**: ✅ Applied successfully

### 2. Default Profile Setup
- **Script**: `backend/scripts/setDefaultProfile.js`
- **Action**: Set all existing tabs to use "40mm Long Rail" (serial number: 26)
- **Status**: ✅ All 6 tabs updated

### 3. API Endpoints Created

#### a) Fetch All Profiles (Already existed)
```
GET /api/bom/master-items
Response: Array of all BOM master items with rmCodes
```

#### b) Update Tab Profile (NEW)
- **Route**: `backend/src/routes/tabRoutes.js:29`
```javascript
PUT /api/tabs/:id/profile
Body: { profileSerialNumber: "26" }
Response: Updated tab object
```
- **Controller**: `backend/src/controllers/tabController.js:47-56`
- **Service**: `backend/src/services/tabService.js:115-127`

### 4. New Tab Creation
- **File**: `backend/src/services/tabService.js:8-11`
- **Change**: New tabs automatically get default profile "40mm Long Rail"
- **Status**: ✅ Implemented

---

## 🔄 REMAINING WORK (Frontend)

### Phase 1: Update BOM Data Collection

#### File: `knapsack-front/src/services/bomDataCollection.js`

**Current Issue**: `collectBOMData()` doesn't include profile information from tabs.

**Required Changes**:

1. **Modify `collectBOMData` function (line 155-194):**
```javascript
export function collectBOMData(tabsData, projectName) {
  const { tabs } = tabsData;

  const bomData = {
    projectInfo: {
      projectName: projectName || 'Untitled Project',
      buildingCodes: [],
      totalTabs: tabs.length,
      generatedAt: new Date().toISOString()
    },
    tabs: [],
    panelCounts: {},
    tabCalculations: {},
    tabProfiles: {}  // ← NEW: Store profile serial numbers per tab
  };

  // Process each tab
  tabs.forEach((tab, index) => {
    const tabName = tab.name || `T${index + 1}`;
    bomData.tabs.push(tabName);

    // ← NEW: Store profile serial number for this tab
    bomData.tabProfiles[tabName] = tab.longRailProfileSerialNumber || '26';

    // Calculate totals for this tab
    const tabTotals = calculateTabTotals(tab);

    bomData.panelCounts[tabName] = tabTotals.modules;
    bomData.tabCalculations[tabName] = {
      totalModules: tabTotals.modules,
      endClamps: tabTotals.endClamp,
      midClamps: tabTotals.midClamp,
      joints: tabTotals.joints,
      sb1: tabTotals.sb1,
      sb2: tabTotals.sb2,
      cutLengths: tabTotals.countsByLength,
      requiredLength: tabTotals.required
    };

    bomData.projectInfo.buildingCodes.push(tabName);
  });

  return bomData;
}
```

---

### Phase 2: Update BOM Generation Logic

#### File: `knapsack-front/src/services/bomCalculations.js`

**Current Issue**:
- Lines 88-115: Hardcoded `sunrackCode: 'MA-43'` and `itemDescription: 'Long Rail - ${cutLength}mm'`
- Doesn't use selected profile from tabs

**Required Changes**:

1. **Add helper function to fetch profile data:**
```javascript
/**
 * Fetch profile data by serial number from API
 * This should be called before generating BOM
 */
async function fetchProfileBySerialNumber(serialNumber) {
  const response = await fetch(`${API_URL}/api/bom/master-items`);
  const allProfiles = await response.json();
  return allProfiles.find(p => p.serialNumber === serialNumber);
}
```

2. **Modify `generateBOMItems` function signature (line 78):**
```javascript
// OLD:
export function generateBOMItems(bomData, activeCutLengths)

// NEW:
export async function generateBOMItems(bomData, activeCutLengths, profilesMap)
```

3. **Update cut length generation logic (lines 88-115):**
```javascript
// 1. Add Long Rails for each active cut length
// Determine which profile to use (use first tab's profile if all same, or default)
const profileSerialNumbers = Object.values(bomData.tabProfiles);
const primaryProfileSerialNumber = profileSerialNumbers[0] || '26';

// Get profile details from profilesMap
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
    // ← CHANGED: Use selected profile data
    bomItems.push({
      sn: serialNumber++,
      sunrackCode: selectedProfile?.sunrackCode || 'MA-43',  // From DB
      profileImage: selectedProfile?.profileImagePath || '/assets/bom-profiles/MA-43.png',  // From DB
      itemDescription: selectedProfile?.genericName || '40mm Long Rail',  // ← Use genericName!
      material: 'AA 6000 T5/T6',
      length: cutLength,
      uom: 'Nos',
      calculationType: 'CUT_LENGTH',  // ← NEW: Mark as cut length type
      profileSerialNumber: primaryProfileSerialNumber,  // ← NEW: Store for edit mode
      quantities: quantities,
      totalQuantity: totalQty,
      spareQuantity: Math.ceil(totalQty * 0.01),
      finalTotal: totalQty + Math.ceil(totalQty * 0.01)
    });
  }
});
```

4. **Update hardware items to mark them as accessories (line 233-260):**
```javascript
if (totalQty > 0) {
  bomItems.push({
    sn: serialNumber++,
    sunrackCode: item.sunrackCode,
    profileImage: item.sunrackCode ? `/assets/bom-profiles/${item.sunrackCode}.png` : null,
    itemDescription: item.itemDescription,
    material: item.material,
    length: item.length,
    uom: item.uom,
    calculationType: 'ACCESSORY',  // ← NEW: Mark as accessory type
    formulaKey: item.formulaKey,
    quantities: quantities,
    totalQuantity: totalQty,
    spareQuantity: Math.ceil(totalQty * 0.01),
    finalTotal: totalQty + Math.ceil(totalQty * 0.01)
  });
}
```

5. **Update `generateCompleteBOM` function (line 271-280):**
```javascript
// OLD:
export function generateCompleteBOM(bomData, activeCutLengths) {
  const bomItems = generateBOMItems(bomData, activeCutLengths);
  // ...
}

// NEW:
export async function generateCompleteBOM(bomData, activeCutLengths) {
  // Fetch all profiles from API
  const response = await fetch(`${API_URL}/api/bom/master-items`);
  const allProfiles = await response.json();

  // Create profilesMap: { serialNumber: profileData }
  const profilesMap = {};
  allProfiles.forEach(profile => {
    profilesMap[profile.serialNumber] = profile;
  });

  const bomItems = await generateBOMItems(bomData, activeCutLengths, profilesMap);

  return {
    projectInfo: bomData.projectInfo,
    tabs: bomData.tabs,
    panelCounts: bomData.panelCounts,
    profilesMap: profilesMap,  // ← NEW: Pass profiles to BOM page
    bomItems: bomItems
  };
}
```

---

### Phase 3: Update BOM Button to Handle Async

#### File: `knapsack-front/src/components/BOM/CreateBOMButton.jsx`

**Current**: Synchronous function (line 9)

**Required Changes**:
```javascript
// Change to async
const handleCreateBOM = async () => {
  try {
    // Collect data from all tabs
    const bomData = collectBOMData(tabsData, projectName);

    // Get active cut lengths (non-zero)
    const activeCutLengths = getActiveCutLengths(bomData);

    // Generate complete BOM structure (NOW ASYNC!)
    const completeBOM = await generateCompleteBOM(bomData, activeCutLengths);

    // Navigate to BOM page with data
    navigate('/bom', { state: { bomData: completeBOM } });
  } catch (error) {
    console.error('Error generating BOM:', error);
    alert('Failed to generate BOM. Please check the console for details.');
  }
};
```

---

### Phase 4: Add Edit Mode UI to BOM Page

#### File: `knapsack-front/src/components/BOM/BOMPage.jsx`

**Required Changes**:

1. **Add state management (after line 9):**
```javascript
const [bomData, setBomData] = useState(null);
const [editMode, setEditMode] = useState(false);  // ← NEW
const [selectedRow, setSelectedRow] = useState(null);  // ← NEW
const [profiles, setProfiles] = useState([]);  // ← NEW
```

2. **Load profiles when BOM data is available (add useEffect after line 11):**
```javascript
useEffect(() => {
  if (location.state?.bomData) {
    setBomData(location.state.bomData);

    // Extract profiles from bomData
    if (location.state.bomData.profilesMap) {
      const profilesList = Object.values(location.state.bomData.profilesMap);
      setProfiles(profilesList);
    }
  } else {
    console.warn('No BOM data provided, redirecting to home');
    navigate('/');
  }
}, [location.state, navigate]);
```

3. **Add Edit Mode button in header (after line 85):**
```javascript
<div className="flex items-center gap-3">
  {/* NEW: Enable Edit Button */}
  <button
    onClick={() => setEditMode(!editMode)}
    className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
      editMode
        ? 'bg-purple-600 text-white border-purple-600'
        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
    }`}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
    {editMode ? 'Done Editing' : 'Enable Edit'}
  </button>

  <button
    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
    onClick={() => window.print()}
  >
    {/* ... existing print button ... */}
  </button>
</div>
```

4. **Add Profile Selector dropdown (insert before BOMTable, around line 110):**
```javascript
{/* Profile Selector - Show when edit mode is ON */}
{editMode && (
  <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
    <div className="flex items-center gap-4">
      <label className="text-sm font-semibold text-gray-700">
        Select Profile:
      </label>
      <select
        className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        value={selectedRow?.profileSerialNumber || ''}
        onChange={(e) => handleProfileChange(e.target.value)}
        disabled={!selectedRow}
      >
        <option value="">
          {selectedRow ? '-- Choose a profile --' : '-- Click a row to select --'}
        </option>
        {profiles.map(profile => (
          <option key={profile.serialNumber} value={profile.serialNumber}>
            {profile.genericName} ({profile.sunrackCode || 'No Code'})
          </option>
        ))}
      </select>
      {selectedRow && (
        <span className="text-sm text-gray-600">
          Selected Row: {selectedRow.sn}
        </span>
      )}
    </div>
  </div>
)}

{/* BOM Table with integrated Spare columns */}
<BOMTable
  bomData={bomData}
  editMode={editMode}
  selectedRow={selectedRow}
  onRowSelect={setSelectedRow}
/>
```

5. **Add profile change handler (after handleBack function, around line 23):**
```javascript
const handleProfileChange = (profileSerialNumber) => {
  if (!selectedRow || !profileSerialNumber) return;

  const selectedProfile = profiles.find(p => p.serialNumber === profileSerialNumber);
  if (!selectedProfile) return;

  // Update bomData based on row type
  const updatedBomData = { ...bomData };

  if (selectedRow.calculationType === 'CUT_LENGTH') {
    // Update ALL cut length rows with the same profile
    updatedBomData.bomItems = bomData.bomItems.map(item => {
      if (item.calculationType === 'CUT_LENGTH') {
        return {
          ...item,
          sunrackCode: selectedProfile.sunrackCode,
          profileImage: selectedProfile.profileImagePath,
          itemDescription: selectedProfile.genericName,
          profileSerialNumber: profileSerialNumber
        };
      }
      return item;
    });
  } else if (selectedRow.calculationType === 'ACCESSORY') {
    // Update only the selected row
    updatedBomData.bomItems = bomData.bomItems.map(item => {
      if (item.sn === selectedRow.sn) {
        return {
          ...item,
          sunrackCode: selectedProfile.sunrackCode,
          profileImage: selectedProfile.profileImagePath,
          itemDescription: selectedProfile.genericName,
          profileSerialNumber: profileSerialNumber
        };
      }
      return item;
    });
  }

  setBomData(updatedBomData);
  setSelectedRow(null);  // Deselect after update
};
```

---

### Phase 5: Make BOM Table Rows Selectable

#### File: `knapsack-front/src/components/BOM/BOMTable.jsx`

**Required Changes**:

1. **Update props (line 4):**
```javascript
// OLD:
export default function BOMTable({ bomData }) {

// NEW:
export default function BOMTable({ bomData, editMode, selectedRow, onRowSelect }) {
```

2. **Pass props to BOMTableRow (line 167-173):**
```javascript
{bomItems.map((item, index) => (
  <BOMTableRow
    key={`${item.sn}-${index}`}
    item={item}
    tabs={tabs}
    isEven={index % 2 === 0}
    editMode={editMode}  // ← NEW
    isSelected={selectedRow?.sn === item.sn}  // ← NEW
    onSelect={() => onRowSelect(item)}  // ← NEW
  />
))}
```

---

### Phase 6: Update BOMTableRow for Selection

#### File: `knapsack-front/src/components/BOM/BOMTableRow.jsx`

**Required Changes**:

1. **Update props (line 2):**
```javascript
// OLD:
export default function BOMTableRow({ item, tabs, isEven }) {

// NEW:
export default function BOMTableRow({ item, tabs, isEven, editMode, isSelected, onSelect }) {
```

2. **Update row styling (line 17-20):**
```javascript
const bgColor = isEven ? 'bg-white' : 'bg-gray-50';

// Add selection styling
const rowClasses = `${bgColor} ${
  editMode ? 'cursor-pointer hover:bg-blue-50' : ''
} ${
  isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''
}`;

return (
  <tr
    className={rowClasses}
    onClick={() => editMode && onSelect && onSelect()}
  >
```

---

## 🔍 Testing Checklist

### Backend Testing:
- [ ] Verify migration applied: `npx prisma migrate status`
- [ ] Check default profiles set: `node scripts/verifyData.js`
- [ ] Test API: `PUT /api/tabs/:id/profile` with body `{ profileSerialNumber: "26" }`

### Frontend Testing:

#### 1. BOM Generation:
- [ ] Create a new project with tabs
- [ ] Generate BOM
- [ ] Verify cut length rows show "40mm Long Rail" (default)
- [ ] Verify accessories show their correct names

#### 2. Edit Mode:
- [ ] Click "Enable Edit" button
- [ ] Verify dropdown appears
- [ ] Click on a cut length row (rows 1-8)
- [ ] Verify row is highlighted
- [ ] Verify dropdown shows profile options with RM codes

#### 3. Profile Change - Cut Lengths:
- [ ] Select a cut length row
- [ ] Change profile from dropdown (e.g., "80mm Mini Rail (MA-07)")
- [ ] Verify **ALL cut length rows** update together
- [ ] Verify Sunrack Code updates (MA-43 → MA-07)
- [ ] Verify Item Description updates
- [ ] Verify length column stays the same

#### 4. Profile Change - Accessories:
- [ ] Select an accessory row (U Cleat, Rail Jointer, etc.)
- [ ] Change profile from dropdown
- [ ] Verify **only that row** updates
- [ ] Verify other accessory rows are not affected

#### 5. Done Editing:
- [ ] Click "Done Editing"
- [ ] Verify dropdown disappears
- [ ] Verify rows are no longer clickable
- [ ] Verify selection highlight is removed

---

## 📝 Important Notes

### API URL Configuration:
Make sure to set the API URL constant at the top of `bomCalculations.js`:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### Database Relationships:
- `tabs.longRailProfileSerialNumber` → `bom_master_items.serialNumber`
- Profile data includes: `genericName`, `sunrackCode`, `profileImagePath`, `designWeight`
- Each profile has multiple `rmCodes` (10 vendors)

### Cut Length vs Accessory Logic:
- **Cut Length**: `calculationType === 'CUT_LENGTH'` - All rows update together
- **Accessory**: `calculationType === 'ACCESSORY'` - Each row updates independently

### Data Flow:
1. User creates tabs → Default profile "40mm Long Rail" assigned
2. Generate BOM → Fetches profile data from DB → Uses in BOM generation
3. Edit Mode → User changes profile → Updates bomData state → Re-renders table
4. (Future) Save to DB → Call `PUT /api/tabs/:id/profile` to persist

---

## 🚀 Next Steps After Implementation

### Phase 7: Persist Changes to Database (Future Enhancement)
After user changes profiles in edit mode, save to database:

```javascript
// Add save button in edit mode
const handleSaveChanges = async () => {
  // Determine which profile is used for cut lengths
  const cutLengthItem = bomData.bomItems.find(item => item.calculationType === 'CUT_LENGTH');
  if (cutLengthItem) {
    // Update all tabs with this profile
    for (const tabName of bomData.tabs) {
      const tabId = getTabIdByName(tabName);  // Need to pass tab IDs from backend
      await fetch(`/api/tabs/${tabId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileSerialNumber: cutLengthItem.profileSerialNumber })
      });
    }
  }

  alert('Changes saved successfully!');
};
```

---

## 📄 Files Modified Summary

### Backend:
1. ✅ `prisma/schema.prisma` - Added field
2. ✅ `prisma/migrations/...` - Migration file
3. ✅ `src/routes/tabRoutes.js` - New route
4. ✅ `src/controllers/tabController.js` - New controller method
5. ✅ `src/services/tabService.js` - New service method + default profile on create

### Frontend (To Do):
1. ⏳ `services/bomDataCollection.js` - Pass profile data
2. ⏳ `services/bomCalculations.js` - Use profile data, mark types
3. ⏳ `components/BOM/CreateBOMButton.jsx` - Handle async
4. ⏳ `components/BOM/BOMPage.jsx` - Add edit mode UI
5. ⏳ `components/BOM/BOMTable.jsx` - Pass selection props
6. ⏳ `components/BOM/BOMTableRow.jsx` - Handle selection

---

## 🐛 Potential Issues & Solutions

### Issue 1: API URL not defined
**Solution**: Add to `.env`:
```
REACT_APP_API_URL=http://localhost:5000
```

### Issue 2: Profile not found
**Solution**: Fallback to default profile "40mm Long Rail" (serial: 26)

### Issue 3: Tab doesn't have profile
**Solution**: Use default '26' if `longRailProfileSerialNumber` is null

### Issue 4: Async generateCompleteBOM breaks existing code
**Solution**: Update all callers to use `await`

---

**END OF IMPLEMENTATION GUIDE**
