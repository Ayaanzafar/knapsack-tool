# Bill of Materials (BOM) Implementation Plan

## Project: Knapsack Tool - BOM Generation Feature

---

## 1. Overview

### Purpose
Create a "Create BOM" button that generates and displays a comprehensive Bill of Materials in a new page, pulling data from dynamic tabs and performing calculations based on predefined formulas.

### Key Requirements
- Button placement: Below ratio section
- Dynamic tab support (T1, T2, ... T15)
- Real-time calculation from tab data
- Excel-like presentation format
- Master data storage in database
- Formula-based quantity calculations

---

## 2. Database Schema Design

### 2.1 Master BOM Items Table (`bom_master_items`)

```sql
CREATE TABLE bom_master_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sunrack_code VARCHAR(20),
  profile_image_path VARCHAR(255),
  item_category ENUM('RAIL', 'CLEAT', 'JOINTER', 'CLAMP', 'FASTENER', 'HARDWARE', 'OTHER'),
  item_base_description VARCHAR(255), -- e.g., "Long Rail", "U Cleat", "Rail Jointer"
  material VARCHAR(50), -- e.g., "AA 6000 T5/T6", "SS304", "GI", "EPDM"
  standard_length INT, -- in mm (nullable for non-rail items)
  uom VARCHAR(20), -- "Nos", "Meters", etc.
  is_length_variable BOOLEAN, -- TRUE for rails, FALSE for fixed items
  calculation_type ENUM('DIRECT', 'FORMULA'), -- DIRECT = from tab data, FORMULA = calculated
  formula_key VARCHAR(50), -- Reference key for formula mapping
  display_order INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### 2.2 BOM Item Formulas Table (`bom_formulas`)

```sql
CREATE TABLE bom_formulas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  formula_key VARCHAR(50) UNIQUE,
  formula_expression TEXT, -- JSON or string expression
  description TEXT,
  created_at TIMESTAMP
)
```

**Example Formula Entries:**
- `U_CLEAT`: `"sb1 + sb2"`
- `RAIL_NUTS`: `"END_CLAMP + MID_CLAMP"`
- `M8_PLAIN_WASHER`: `"U_CLEAT_BOLT * 2"`

### 2.3 Profile Images Storage
**Decision: Store as files + DB path reference**

**Steps:**
1. Extract images from Excel manually
2. Save to: `/public/assets/bom-profiles/` or `/knapsack-front/public/assets/bom-profiles/`
3. Naming convention: `{sunrack_code}.png` (e.g., `MA-43.png`, `MA-110.png`)
4. Store relative path in database: `/assets/bom-profiles/MA-43.png`
5. Use in `<img src={profileImagePath}>` tag

**Why not Base64?**
- Larger database size
- Slower queries
- Harder to update images
- No browser caching benefits

**Process:**
1. Right-click each profile image in Excel → Save Picture As → PNG
2. Rename to match Sunrack Code (e.g., `MA-43.png`)
3. Upload to project's public folder
4. Reference in database

### 2.4 BOM History/Storage Table (`bom_generated`)

```sql
CREATE TABLE bom_generated (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_name VARCHAR(255) NOT NULL,
  building_codes TEXT, -- JSON array of tab names ["T1", "T2", ...]
  bom_data JSON, -- Complete BOM output structure
  total_tabs INT,
  total_items INT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100), -- Future: user ID
  is_draft BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1
)
```

**Purpose:**
- Save generated BOMs for future reference
- Enable BOM editing functionality
- Maintain history of changes
- Support versioning (future scope)

**Edit Functionality (Future):**
- Load BOM from database
- Allow user to manually edit quantities
- Update `bom_data` JSON in database
- Increment version number
- Track modification timestamp

---

## 3. Data Flow Architecture

```
┌─────────────────────┐
│   User Clicks       │
│  "Create BOM"       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Collect Data from  │
│   All Active Tabs   │
│  (T1, T2, ... Tn)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Fetch Master BOM   │
│  Items from DB      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Filter Items Based │
│  on Cut Lengths     │
│  (Remove zero rows) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Calculate Quantities│
│  - Direct (Rails)   │
│  - Formula (Hardware)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Calculate Totals,  │
│  Spare, Final Qty   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Render BOM Page    │
│  with Table         │
└─────────────────────┘
```

---

## 4. Component Structure

### 4.1 File Structure
```
src/
├── components/
│   ├── BOM/
│   │   ├── BOMPage.jsx              // Main BOM display page
│   │   ├── BOMTable.jsx             // Table component
│   │   ├── BOMHeader.jsx            // Header with project info
│   │   ├── BOMTableRow.jsx          // Individual row component
│   │   └── CreateBOMButton.jsx      // Button component
│   └── ...
├── services/
│   ├── bomService.js                // BOM data fetching & calculations
│   ├── bomCalculations.js           // Formula calculations
│   └── ...
├── utils/
│   ├── bomFormulas.js               // Formula definitions
│   └── ...
└── pages/
    └── BOMDisplayPage.jsx           // Route page
```

---

## 5. Implementation Steps

### Phase 1: Database Setup
1. Create `bom_master_items` table
2. Create `bom_formulas` table
3. Seed master data with all BOM items (22 items from screenshot)
4. Upload profile images to `/public/assets/bom-profiles/`

### Phase 2: Data Collection Service
1. Create `collectTabData()` function to gather:
   - Active tab count
   - Cut lengths per tab (with quantities)
   - sb1, sb2 values per tab
   - Total modules per tab
   - Total joints, end clamps, mid clamps per tab

2. Create `getMasterBOMItems()` to fetch from database

### Phase 3: Filtering Logic
1. Identify all unique cut lengths across tabs
2. Filter out cut lengths where quantity = 0 in ALL tabs
3. Generate dynamic "Long Rail - {length}mm" descriptions
4. Map Sunrack codes to filtered items

### Phase 4: Calculation Engine
1. **Direct Calculations** (for Rails):
   - Iterate through each tab
   - Map cut length quantities to respective T columns

2. **Formula-based Calculations** (for Hardware):
   - Implement formula parser/evaluator
   - Calculate per tab using formulas:
     - U Cleat: `sb1 + sb2`
     - Rail Jointer: `Total Joints`
     - End Clamp: `Total End Clamps`
     - Mid Clamp: `Total Mid Clamps`
     - Rail Nuts: `END_CLAMP + MID_CLAMP`
     - M8x60 Bolt: `U_CLEAT`
     - M8x20 Bolt: `END_CLAMP + MID_CLAMP`
     - M8 Hex Nuts: `M8x60_BOLT`
     - M8 Plain Washer: `U_CLEAT_BOLT * 2`
     - M8 Spring Washer: `M8x60_BOLT + M8x20_BOLT`
     - SDS 4.2X13mm: `RAIL_JOINTER * 4`
     - SDS 5.5X63mm: `sb1`
     - Rubber Pad: `U_CLEAT`
     - Blind Rivets: `sb2`

3. **Aggregation Calculations**:
   - Total Quantity: `SUM(T1, T2, ..., Tn)`
   - Spare Quantity: `ROUNDUP(Total * 0.01)`
   - Final Total: `Total + Spare`

### Phase 5: UI Components
1. **CreateBOMButton Component**:
   - Position below ratio section
   - Click handler to navigate to BOM page

2. **BOMPage Component**:
   - Header section (Project name, Building code)
   - Full-width table container
   - Export options (future scope)

3. **BOMTable Component**:
   - Fixed header with dynamic tab columns
   - Scrollable body
   - Excel-like styling
   - Responsive layout

4. **BOMTableRow Component**:
   - S.N
   - Sunrack Code
   - Profile Image
   - Item Description
   - Material
   - Length
   - UoM
   - No. of Panels (first row only)
   - Dynamic T1, T2, ... Tn columns
   - Quantity
   - Spare Quantity
   - Total Quantity

### Phase 6: Styling
1. Excel-like appearance:
   - Yellow header (#FFD700)
   - Bordered cells
   - Alternating row colors
   - Fixed column widths
   - Centered text alignment

2. Responsive design:
   - Horizontal scroll for many tabs
   - Fixed first few columns
   - Print-friendly layout

---

## 5.1. Project Name Field Implementation

### Location
Add to **Header component** (`Header.jsx`)

### Design Options

**Option 1: Click-to-Edit (Recommended)**
```
┌────────────────────────────────────────────────────────┐
│ Rail Cut Optimizer | Project: JET Energy 5.3MWp ✎    ⚙ │
└────────────────────────────────────────────────────────┘
```
- Display mode: Shows project name with edit icon
- Click on text or icon → becomes editable input
- Press Enter or click outside → save
- Inline editing, no modal needed

**Option 2: Always Visible Input**
```
┌────────────────────────────────────────────────────────┐
│ Rail Cut Optimizer | [Project Name Input Field]     ⚙ │
└────────────────────────────────────────────────────────┘
```
- Always shows input field
- Auto-saves on blur
- Simple but takes more space

**Recommended: Option 1** (cleaner UI, saves space)

### State Management
```javascript
// In App.jsx
const [projectName, setProjectName] = useState(() =>
  localStorage.getItem('projectName') || 'Untitled Project'
);

// Auto-save to localStorage
useEffect(() => {
  localStorage.setItem('projectName', projectName);
}, [projectName]);

// Pass to Header
<Header
  projectName={projectName}
  setProjectName={setProjectName}
  // ... other props
/>
```

### Component Implementation Preview
```jsx
// In Header.jsx
const [isEditing, setIsEditing] = useState(false);
const [tempName, setTempName] = useState(projectName);

const handleSave = () => {
  setProjectName(tempName);
  setIsEditing(false);
};

return (
  <header className="border-b bg-white">
    <div className="flex items-center gap-4">
      <h1>Rail Cut Optimizer</h1>
      <span className="text-gray-300">|</span>
      {isEditing ? (
        <input
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleSave}
          onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          className="border-b-2 border-purple-500 px-2 py-1"
          autoFocus
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
        >
          <span className="text-sm text-gray-600">Project:</span>
          <span className="font-medium">{projectName}</span>
          <svg className="w-4 h-4 text-gray-400">✎</svg>
        </div>
      )}
    </div>
  </header>
);
```

### Storage
- **Current session**: React state
- **Persistence**: localStorage (tab-independent, global)
- **Future**: Save with BOM in database

### Validation
- Max length: 255 characters
- Cannot be empty (default to "Untitled Project")
- Trim whitespace
- No special characters validation (allow all)

---

## 6. Data Model Examples

### 6.1 Tab Data Structure (Input)
```javascript
{
  tabs: [
    {
      tabId: 1,
      tabName: "T1",
      totalModules: 532,
      cutLengths: {
        1600: 58,
        1800: 72,
        2400: 18,
        2750: 110,
        3600: 58,
        4800: 54,
        5500: 72
      },
      sb1: 1098,
      sb2: 3278,
      totalJoints: 292,
      totalEndClamps: 918,
      totalMidClamps: 459
    },
    {
      tabId: 2,
      tabName: "T2",
      totalModules: 1757,
      cutLengths: {
        1600: 464,
        1800: 232,
        // ... other lengths
      },
      sb1: 3278,
      sb2: 1868,
      // ... other values
    }
    // ... more tabs
  ]
}
```

### 6.2 BOM Output Structure
```javascript
{
  projectInfo: {
    projectName: "JET Energy - 5.3MWp", // From Header component
    buildingCodes: ["T1", "T2", "T3", "T5", "T6", "T7", "T8", "T10", "T11", "T14", "T15"], // Tab names
    totalTabs: 11,
    generatedAt: "2025-12-08T10:30:00Z"
  },
  tabs: ["T1", "T2", "T3", "T5", "T6", "T7", "T8", "T10", "T11", "T14", "T15"], // Active tab names
  panelCounts: {
    T1: 532,
    T2: 1757,
    T3: 1104,
    // ... all tabs
  },
  bomItems: [
    {
      sn: 1,
      sunrackCode: "MA-43",
      profileImage: "/assets/bom-profiles/MA-43.png",
      itemDescription: "Long Rail - 1600mm",
      material: "AA 6000 T5/T6",
      length: 1600,
      uom: "Nos",
      quantities: {
        T1: 58,
        T2: 464,
        T3: 80,
        T5: 24,
        T6: 88,
        T7: 88,
        T8: 144,
        T10: 200,
        T11: 28,
        T14: 136,
        T15: 0  // Can be 0 if that specific tab has no 1600mm rails
      },
      totalQuantity: 1310,
      spareQuantity: 14,  // Math.ceil(1310 * 0.01)
      finalTotal: 1324
    },
    {
      sn: 8,
      sunrackCode: "MA-110",
      profileImage: "/assets/bom-profiles/MA-110.png",
      itemDescription: "U Cleat (5mm Hole)",
      material: "AA 6000 T5/T6",
      length: 40,
      uom: "Nos",
      calculationType: "FORMULA",
      formulaKey: "U_CLEAT",
      quantities: {
        T1: 4376,  // sb1 + sb2 for T1
        T2: 5146,  // sb1 + sb2 for T2
        // ... calculated per tab
      },
      totalQuantity: 17118,
      spareQuantity: 172,
      finalTotal: 17290
    },
    // ... more items (total 22 rows)
  ]
}
```

**Notes:**
- `buildingCodes` = array of tab names (NOT a single building code)
- Each tab name represents a building
- Items with `calculationType: "DIRECT"` → quantities from tab's cut length data
- Items with `calculationType: "FORMULA"` → quantities calculated using formulas
- Zero quantities allowed in individual tabs, but row excluded if total = 0

---

## 7. Formula Calculation Logic

### 7.1 Calculation Order (Important!)
Items must be calculated in dependency order:

1. **Level 1** - Direct from tabs:
   - Long Rails (all lengths)
   - Total Modules
   - Total Joints
   - Total End Clamps
   - Total Mid Clamps
   - sb1
   - sb2

2. **Level 2** - Dependent on Level 1:
   - U Cleat = sb1 + sb2
   - Rail Nuts = End Clamp + Mid Clamp

3. **Level 3** - Dependent on Level 2:
   - M8x60 Bolt = U Cleat
   - M8x20 Bolt = End Clamp + Mid Clamp

4. **Level 4** - Dependent on Level 3:
   - M8 Hex Nuts = M8x60 Bolt
   - M8 Plain Washer = M8x60 Bolt * 2
   - M8 Spring Washer = M8x60 Bolt + M8x20 Bolt

5. **Level 5** - Additional calculations:
   - SDS 4.2X13mm = Rail Jointer * 4
   - SDS 5.5X63mm = sb1
   - Rubber Pad = U Cleat
   - Blind Rivets = sb2

### 7.2 Formula Implementation Structure
```javascript
const formulaMap = {
  'U_CLEAT': (tabData) => tabData.sb1 + tabData.sb2,
  'RAIL_JOINTER': (tabData) => tabData.totalJoints,
  'END_CLAMP': (tabData) => tabData.totalEndClamps,
  'MID_CLAMP': (tabData) => tabData.totalMidClamps,
  'RAIL_NUTS': (calculated) => calculated.END_CLAMP + calculated.MID_CLAMP,
  'M8x60_BOLT': (calculated) => calculated.U_CLEAT,
  'M8x20_BOLT': (calculated) => calculated.END_CLAMP + calculated.MID_CLAMP,
  'M8_HEX_NUTS': (calculated) => calculated.M8x60_BOLT,
  'M8_PLAIN_WASHER': (calculated) => calculated.M8x60_BOLT * 2,
  'M8_SPRING_WASHER': (calculated) => calculated.M8x60_BOLT + calculated.M8x20_BOLT,
  'SDS_4_2X13MM': (calculated) => calculated.RAIL_JOINTER * 4,
  'SDS_5_5X63MM': (tabData) => tabData.sb1,
  'RUBBER_PAD': (calculated) => calculated.U_CLEAT,
  'BLIND_RIVETS': (tabData) => tabData.sb2
};
```

---

## 8. UI/UX Specifications

### 8.1 Button Specifications
- **Text**: "Create BOM"
- **Position**: Below ratio section
- **Style**: Primary button, prominent color
- **Action**: Navigate to `/bom` route or open modal

### 8.2 BOM Page Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Bill of Materials - JET Energy 5.3MWp"           │
│  Building Code: [Value]                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      BOM TABLE                              │
│  ┌───┬───────┬────┬──────┬────┬───┬───┬───┬─T1─┬─T2─┬───┐  │
│  │SN │Sunrack│Pro │Item  │Mat │Len│UoM│No │Qty │Qty │...│  │
│  │   │Code   │file│Desc  │    │   │   │Pan│    │    │   │  │
│  ├───┼───────┼────┼──────┼────┼───┼───┼───┼────┼────┼───┤  │
│  │ 1 │ MA-43 │[📷]│Long  │AA6k│1.6│Nos│532│ 58 │464 │...│  │
│  │   │       │    │Rail  │T5/6│   │   │   │    │    │   │  │
│  └───┴───────┴────┴──────┴────┴───┴───┴───┴────┴────┴───┘  │
│                                                             │
│  [Export to Excel] [Print] [Close]                         │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Table Styling
- **Header Background**: Yellow (#FFD700)
- **Border**: 1px solid black
- **Cell Padding**: 8px
- **Font**: Arial or similar sans-serif
- **Font Size**: 12px for data, 14px for headers
- **Text Alignment**:
  - Left: Item Description
  - Center: All other columns
  - Right: Quantity columns

---

## 9. State Management

### 9.1 Required State Variables
```javascript
// In BOM context or page state
const [bomData, setBomData] = useState(null);
const [activeTabs, setActiveTabs] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### 9.2 Data Fetching Flow
1. User clicks "Create BOM"
2. Set loading state
3. Collect all tab data from current state/context
4. Fetch master BOM items from API
5. Process calculations
6. Update bomData state
7. Render BOM page

---

## 10. API Endpoints Required

### 10.1 GET `/api/bom/master-items`
**Response:**
```json
[
  {
    "id": 1,
    "sunrackCode": "MA-43",
    "profileImage": "/assets/bom-profiles/MA-43.png",
    "itemCategory": "RAIL",
    "itemBaseDescription": "Long Rail",
    "material": "AA 6000 T5/T6",
    "standardLength": null,
    "uom": "Nos",
    "isLengthVariable": true,
    "calculationType": "DIRECT",
    "formulaKey": null,
    "displayOrder": 1
  },
  {
    "id": 8,
    "sunrackCode": "MA-110",
    "profileImage": "/assets/bom-profiles/MA-110.png",
    "itemCategory": "CLEAT",
    "itemBaseDescription": "U Cleat (5mm Hole)",
    "material": "AA 6000 T5/T6",
    "standardLength": 40,
    "uom": "Nos",
    "isLengthVariable": false,
    "calculationType": "FORMULA",
    "formulaKey": "U_CLEAT",
    "displayOrder": 8
  }
  // ... more items
]
```

### 10.2 POST `/api/bom/generate`
**Request:**
```json
{
  "projectName": "JET Energy - 5.3MWp",
  "buildingCode": "XYZ-001",
  "tabsData": [
    // Tab data array as shown in section 6.1
  ]
}
```

**Response:**
```json
{
  // BOM output as shown in section 6.2
}
```

---

## 11. Future Enhancements (Out of Scope for Phase 1)

1. **Weight & Cost Calculations**
   - Add weight per unit in master data
   - Calculate total weight
   - Add rate per kg
   - Calculate total cost

2. **Export Functionality**
   - Export to Excel (.xlsx)
   - Export to PDF
   - Print functionality

3. **BOM History**
   - Save generated BOMs
   - Version tracking
   - Comparison between versions

4. **Mini Rail Calculation**
   - Currently marked as "Ignore now"
   - To be defined later

5. **Advanced Filtering**
   - Filter by material type
   - Filter by item category
   - Search functionality

---

## 12. Testing Strategy

### 12.1 Unit Tests
- Formula calculations for each item type
- Data filtering logic (zero cut length removal)
- Total and spare quantity calculations
- ROUNDUP function accuracy

### 12.2 Integration Tests
- Tab data collection
- API endpoints (master items, generate BOM)
- Full BOM generation flow

### 12.3 UI Tests
- Button click navigation
- Table rendering with dynamic columns
- Responsive behavior
- Print layout

### 12.4 Edge Cases
- Single tab scenario
- All cut lengths zero (empty BOM)
- Very large number of tabs (>15)
- Missing profile images
- Invalid formula references

---

## 13. Dependencies & Libraries

### 13.1 Required Libraries
- **React**: UI components
- **React Router**: Page navigation
- **Axios**: API calls
- **Math.js** (optional): Formula evaluation
- **Lodash**: Data manipulation utilities
- **XLSX** (future): Excel export

### 13.2 Custom Utilities Needed
- Formula parser/evaluator
- ROUNDUP function (Math.ceil wrapper)
- Data aggregation helpers

---

## 14. Performance Considerations

1. **Lazy Loading**: Load BOM page only when needed
2. **Memoization**: Cache calculated values per tab
3. **Virtual Scrolling**: If table has many rows (>100)
4. **Image Optimization**: Compress profile images
5. **API Response Caching**: Cache master BOM items

---

## 15. Security Considerations

1. **Input Validation**: Validate tab data before calculations
2. **SQL Injection**: Use parameterized queries for DB operations
3. **XSS Prevention**: Sanitize any user-generated project names
4. **Authentication**: Ensure only authorized users can generate BOM

---

## 16. Implementation Checklist

### Phase 0: Preparation
- [ ] Extract 22 profile images from Excel
- [ ] Rename images to match Sunrack codes (MA-43.png, etc.)
- [ ] Create folder: `/knapsack-front/public/assets/bom-profiles/`
- [ ] Upload all profile images to folder

### Phase 1: Database Setup
- [ ] Create `bom_master_items` table
- [ ] Create `bom_formulas` table
- [ ] Create `bom_generated` table (for saving BOMs)
- [ ] Seed master BOM data (22 items with image paths)
- [ ] Seed formula definitions
- [ ] Create API endpoints:
  - [ ] GET `/api/bom/master-items`
  - [ ] POST `/api/bom/generate`
  - [ ] POST `/api/bom/save`
  - [ ] GET `/api/bom/:id`
  - [ ] PUT `/api/bom/:id`

### Phase 2: Project Name Field
- [ ] Add `projectName` state to App.jsx
- [ ] Add localStorage persistence for project name
- [ ] Update Header.jsx with click-to-edit field
- [ ] Add edit icon SVG
- [ ] Implement save on blur/Enter
- [ ] Test project name persistence across tabs
- [ ] Pass projectName to BOM generation

### Phase 3: Backend Logic
- [ ] Implement data collection service:
  - [ ] Collect active tab count
  - [ ] Collect cut lengths per tab
  - [ ] Collect sb1, sb2, joints, clamps per tab
  - [ ] Collect total modules per tab
- [ ] Implement formula calculation engine:
  - [ ] Level 1: Direct calculations
  - [ ] Level 2: Dependent calculations (U Cleat, Rail Nuts)
  - [ ] Level 3: Bolt calculations
  - [ ] Level 4: Washer/Nut calculations
  - [ ] Level 5: Hardware calculations
- [ ] Implement filtering logic:
  - [ ] Filter zero-quantity cut lengths
  - [ ] Generate dynamic rail descriptions
- [ ] Implement aggregation:
  - [ ] Total quantity calculation
  - [ ] Spare quantity (1% ROUNDUP)
  - [ ] Final total calculation
- [ ] Add unit tests for all formulas
- [ ] Test with sample data

### Phase 4: Frontend Components
- [ ] Create BOMPage component
  - [ ] Page layout with header
  - [ ] Back button navigation
  - [ ] Loading state
  - [ ] Error handling
- [ ] Create BOMTable component
  - [ ] Fixed header with dynamic columns
  - [ ] Scrollable body
  - [ ] Excel-like styling
- [ ] Create BOMTableRow component
  - [ ] All columns rendering
  - [ ] Profile image with fallback
  - [ ] Dynamic T columns
  - [ ] Spare calculations
- [ ] Create CreateBOMButton component
  - [ ] Button below ratio section
  - [ ] Navigate to /bom route
  - [ ] Pass tab data
- [ ] Add React Router setup:
  - [ ] Route: `/bom`
  - [ ] Navigation logic

### Phase 5: Integration & Data Flow
- [ ] Connect CreateBOM button to data collection
- [ ] Fetch master BOM items on BOM page load
- [ ] Generate BOM structure from tab data
- [ ] Render BOM table with calculated values
- [ ] Save BOM to database after generation
- [ ] Test full flow end-to-end

### Phase 6: Testing
- [ ] Test with single tab
- [ ] Test with multiple tabs (2, 5, 10, 15)
- [ ] Test with zero quantities in some tabs
- [ ] Test with all zero quantities (should hide row)
- [ ] Test formula calculations accuracy
- [ ] Test spare quantity rounding
- [ ] Test profile image loading/fallback
- [ ] Test project name display in BOM
- [ ] Test back button navigation
- [ ] Test saving to database
- [ ] Test loading saved BOM

### Phase 7: Styling & UX
- [ ] Apply Excel-like styling:
  - [ ] Yellow header (#FFD700)
  - [ ] Bordered cells
  - [ ] Alternating row colors
  - [ ] Center-aligned text
- [ ] Make responsive:
  - [ ] Horizontal scroll for many tabs
  - [ ] Fixed left columns
  - [ ] Mobile view (if needed)
- [ ] Add print styles
- [ ] Test on different screen sizes
- [ ] Test print layout

### Phase 8: Polish & Deployment
- [ ] Add error handling for API failures
- [ ] Add loading indicators
- [ ] Add success/error messages
- [ ] Add confirmation before leaving BOM page
- [ ] Add keyboard shortcuts (Esc to close, etc.)
- [ ] Documentation (README, inline comments)
- [ ] Code review
- [ ] Final testing
- [ ] Deploy to production

---

## 17. Questions & Answers ✅

### ✅ 1. Project Name & Building Code
**Answer:**
- **Project Name**: Add a new editable field in the **Header component** (top of page, common for all tabs)
  - **Suggested Location**: Between title and settings icon
  - **Design**: Editable text field with edit icon OR click-to-edit inline
  - Store in global app state or localStorage
  - Persist across tabs
  - Used when generating BOM

- **Building Code**: Will be dynamic tab names (T1, T2, T3...)
  - NOT a single building code
  - Each tab represents a building code
  - BOM will show: "Building Code" column header with T1, T2, T3... as sub-columns

**Implementation Details:**
```javascript
// In App.jsx state
const [projectName, setProjectName] = useState(() =>
  localStorage.getItem('projectName') || 'Untitled Project'
);

// Save when changed
useEffect(() => {
  localStorage.setItem('projectName', projectName);
}, [projectName]);
```

**UI Mockup for Header:**
```
┌─────────────────────────────────────────────────────┐
│ Rail Cut Optimizer | [Project Name: JET Energy...] ⚙│
└─────────────────────────────────────────────────────┘
```

### ✅ 2. Navigation
**Answer:** BOM should open in **new page with back button**

**Implementation:**
- Use React Router: Route `/bom`
- Button navigates using `navigate('/bom')`
- BOM page includes:
  - Back button (top-left) → Returns to main page
  - Export buttons (top-right)
  - Full-screen table layout

**Route Structure:**
```javascript
// In main router setup
<Routes>
  <Route path="/" element={<App />} />
  <Route path="/bom" element={<BOMPage />} />
</Routes>
```

### ✅ 3. Data Persistence
**Answer:** **YES** - Save generated BOMs to database

**Requirements:**
- Save complete BOM when generated
- Store in `bom_generated` table (see Section 2.4)
- Future: Add "Edit BOM" functionality
  - Load BOM from database
  - Allow manual quantity edits
  - Update database on save
  - Version tracking

**API Endpoints Needed:**
- `POST /api/bom/save` - Save new BOM
- `GET /api/bom/:id` - Load specific BOM
- `PUT /api/bom/:id` - Update existing BOM
- `GET /api/bom/list` - List all BOMs (future)

### ✅ 4. Profile Images
**Answer:** Images currently in Excel - need to be extracted manually

**Process:**
1. **Extract from Excel:**
   - Open Excel file
   - Right-click each profile image
   - "Save as Picture" → PNG format
   - Name files: `MA-43.png`, `MA-110.png`, etc.

2. **Store in Project:**
   - Create folder: `/knapsack-front/public/assets/bom-profiles/`
   - Upload all 22 profile images
   - Reference in DB as: `/assets/bom-profiles/{sunrack_code}.png`

3. **Fallback Handling:**
   - If image missing, show placeholder icon
   - Or show text: "No Image"
   - Prevents broken image links

**Component Usage:**
```jsx
<img
  src={item.profileImage}
  alt={item.sunrackCode}
  onError={(e) => e.target.src = '/assets/placeholder.png'}
  className="w-8 h-8 object-contain"
/>
```

### ✅ 5. Zero Quantity Rows
**Answer:** **Hide completely** (not grayed out)

**Logic:**
- For Long Rails: If a cut length has 0 quantity in ALL tabs → exclude row entirely
- Example: If 1600mm has quantities [0, 0, 0, 0...] across all tabs → Don't show in BOM
- If 1600mm has [58, 0, 464, 0...] → Show row (some tabs have quantity)

**Implementation:**
```javascript
// Filter out zero-quantity rails
const filteredRails = railItems.filter(item => {
  const totalQty = Object.values(item.quantities).reduce((sum, q) => sum + q, 0);
  return totalQty > 0;
});
```

### ✅ 6. Decimal Handling
**Answer:** Mixed approach based on item type

**Current Scope (Phase 1): INTEGER ONLY**
- All quantities: Integer values
- Spare quantities: `Math.ceil()` for 1% calculation
- No decimals in BOM table

**Future Scope (Phase 2): DECIMALS for Weight & Cost**
- Weight: 2 decimal places (e.g., 1234.56 kg)
- Cost: 2 decimal places (e.g., 527.85 per kg)
- Total Cost: 2 decimal places

**Data Types:**
```sql
-- For quantities (Phase 1)
quantity INT NOT NULL

-- For weight/cost (Phase 2)
weight DECIMAL(10,2)
rate_per_kg DECIMAL(10,2)
total_cost DECIMAL(12,2)
```

**Display Formatting:**
```javascript
// Quantity - no decimals
quantity.toFixed(0)

// Weight - 2 decimals
weight.toFixed(2)

// Cost - 2 decimals with currency
`₹ ${cost.toFixed(2)}`
```

---

## 18. Success Criteria

✅ **MVP Complete When:**
1. ✅ Project Name field added to Header (click-to-edit)
2. ✅ Project Name persists in localStorage
3. ✅ "Create BOM" button appears below ratio section
4. ✅ Button click generates BOM from all active tabs
5. ✅ BOM displays correct items based on non-zero cut lengths
6. ✅ All formulas calculate correctly (14 different formulas)
7. ✅ Dynamic T1, T2, ... Tn columns render properly
8. ✅ No. of Panels row shows correct values per tab
9. ✅ Total, Spare (1%), and Total Quantity calculate correctly
10. ✅ Table matches Excel screenshot layout
11. ✅ Profile images display correctly with fallback
12. ✅ Zero quantity cut lengths are completely hidden
13. ✅ BOM opens in new page with back button
14. ✅ Generated BOM saves to database
15. ✅ Building codes = Tab names (T1, T2, ...)

---

## 19. Summary & Next Actions

### What We're Building
A comprehensive **Bill of Materials (BOM) Generator** that:
- Collects data from multiple dynamic tabs (T1 - T15)
- Applies 14+ formulas to calculate hardware quantities
- Filters out zero-quantity items
- Displays Excel-like table with project info
- Saves to database for future editing
- Supports project naming via editable header field

### Key Technical Decisions ✅
1. **Database**: Master items + Generated BOMs (3 tables)
2. **Profile Images**: Extract from Excel → Store as files → DB references path
3. **Project Name**: Click-to-edit field in Header, localStorage persistence
4. **Building Codes**: Dynamic tab names (NOT single code)
5. **Navigation**: New page route `/bom` with back button
6. **Zero Handling**: Completely hide rows where total = 0
7. **Decimals**: Integers only (Phase 1), decimals for weight/cost (Phase 2)
8. **Persistence**: Save generated BOMs, enable editing later

### Data Flow Summary
```
User Input → Tabs Data → Collect → Filter → Calculate → Aggregate → Render → Save to DB
```

### Implementation Phases
- **Phase 0**: Extract & prepare images
- **Phase 1**: Database setup (3 tables, APIs)
- **Phase 2**: Project name field in Header
- **Phase 3**: Backend calculation engine
- **Phase 4**: Frontend components
- **Phase 5**: Integration & full flow
- **Phase 6**: Testing (10+ test scenarios)
- **Phase 7**: Styling (Excel-like appearance)
- **Phase 8**: Polish & deployment

### Formula Dependencies
```
Level 1: Tab Data (sb1, sb2, clamps, joints)
   ↓
Level 2: U Cleat, Rail Nuts
   ↓
Level 3: Bolts
   ↓
Level 4: Washers, Nuts
   ↓
Level 5: Hardware (SDS, Rubber Pad, Rivets)
```

### Complexity Estimate
- **Backend**: 14 formulas, dependency management, filtering logic
- **Frontend**: 5 components, dynamic columns, Excel styling
- **Database**: 3 tables, 5 API endpoints
- **Testing**: 10+ scenarios
- **Total Items**: 22 BOM items (up to 7 rails + 15 hardware)

---

## 20. Quick Reference

### Profile Images
- **Location**: `/knapsack-front/public/assets/bom-profiles/`
- **Format**: PNG
- **Naming**: `{SUNRACK_CODE}.png` (e.g., `MA-43.png`)
- **Count**: 22 images

### Database Tables
1. `bom_master_items` - 22 rows (master BOM items)
2. `bom_formulas` - 14 rows (formula definitions)
3. `bom_generated` - N rows (saved BOMs)

### API Endpoints
- `GET /api/bom/master-items` - Fetch master items
- `POST /api/bom/generate` - Generate BOM from tab data
- `POST /api/bom/save` - Save generated BOM
- `GET /api/bom/:id` - Load saved BOM
- `PUT /api/bom/:id` - Update saved BOM

### Component Files
```
src/components/BOM/
├── BOMPage.jsx              # Main page
├── BOMTable.jsx             # Table container
├── BOMTableRow.jsx          # Row component
├── BOMHeader.jsx            # Project info header
└── CreateBOMButton.jsx      # Trigger button

src/services/
├── bomService.js            # API calls
└── bomCalculations.js       # Formula engine

src/utils/
└── bomFormulas.js           # Formula definitions
```

### State Management
```javascript
// In App.jsx
const [projectName, setProjectName] = useState('Untitled Project');

// Pass to BOM
<CreateBOMButton
  projectName={projectName}
  tabsData={tabsData}
/>
```

---

## Document Version: 2.0
**Created**: 2025-12-08
**Last Updated**: 2025-12-08
**Status**: ✅ **APPROVED - Ready for Implementation**
**All Questions Answered**: Yes

---

## Next Steps (Start Here!)
1. ✅ **Review Complete** - All questions answered
2. ✅ **Plan Approved** - No changes needed
3. **ACTION REQUIRED**:
   - [ ] Extract 22 profile images from Excel
   - [ ] Start Phase 1: Database setup
   - [ ] Implement Project Name field (Phase 2)
   - [ ] Begin BOM component development

**Ready to implement!** 🚀
