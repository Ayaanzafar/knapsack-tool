# BOM Component Refactoring & Print Header Fix Plan

## 📋 Overview

This document outlines the complete refactoring plan to fix two major issues in the BOM system:

1. **Print Header Repetition Issue** - Full 3-row header repeats on every page, wasting space
2. **Code Duplication Issue** - Same BOM table HTML exists in 3 places (BOMPage, BOMPrintPreview, PrintSettingsModal)

---

## 🎯 Goals

### Primary Goals
- ✅ Fix print header repetition (only column headers should repeat)
- ✅ Create shared components to eliminate code duplication
- ✅ Ensure data flows correctly (especially notes and edits)
- ✅ Maintain all existing functionality

### Success Criteria
- Only column header row repeats on page 2+ (not full 3-row header)
- Notes added in BOMPage appear in print preview
- Changes made in BOMPage reflect in print
- Zero HTML duplication across components

---

## 🔍 Current Problems Analysis

### Problem 1: Print Header Repetition

**Current Structure in BOMTable.jsx:**
```jsx
<thead>
  {/* ROW 1: Building codes, panel counts */}
  <tr className="bg-yellow-400">
    <th colSpan={5}>Project Name</th>
    <th colSpan={2}>Building Code</th>
    {tabs.map(tab => <th>{tab}</th>)}
    <th>Total</th>
    <th>Spare header</th>
    <th>Weight & Cost header</th>
  </tr>

  {/* ROW 2: Variation name, panel counts */}
  <tr className="bg-yellow-400">
    <th colSpan={5}>U Cleat Long Rail</th>
    <th colSpan={2}>No. of Panels</th>
    {tabs.map(tab => <th>{panelCounts[tab]}</th>)}
    {/* ... */}
  </tr>

  {/* ROW 3: Column headers */}
  <tr className="bg-yellow-400">
    <th>S.N</th>
    <th>Sunrack Code</th>
    <th>Profile</th>
    <th>Item Description</th>
    {/* ... all column headers */}
  </tr>
</thead>
```

**CSS in print.css (line 23-24):**
```css
thead {
  display: table-header-group; /* ← This causes ALL 3 rows to repeat! */}
```

**Result:** On page 2+, entire 3-row header repeats, taking ~30% of page space.

---

### Problem 2: Code Duplication

**Same BOM table HTML exists in 3 files:**

| File | Purpose | Duplication |
|------|---------|-------------|
| `BOMTable.jsx` | Main table component used in BOMPage | Original |
| `BOMPrintPreview.jsx` (lines 200-600) | Print preview page | 100% duplicate |
| `PrintSettingsModal.jsx` (lines 300-700) | Modal preview | 100% duplicate |

**Consequences:**
- Notes added in BOMPage don't appear in print (data not syncing)
- Bug fixes must be applied 3 times
- Inconsistent styling/behavior
- Maintenance nightmare

---

## 🏗️ Solution Architecture

### New Component Structure

```
src/components/BOM/
├── BOMPage.jsx                    (Main page - orchestrates everything)
│
├── shared/                         (NEW FOLDER - Reusable components)
│   ├── BOMHeader.jsx              (NEW - Purple header with project info)
│   ├── BOMTableInfo.jsx           (NEW - Building codes, variation, panel counts)
│   ├── BOMTable.jsx               (MODIFIED - Only table rows, simplified thead)
│   ├── BOMSummaryCards.jsx        (NEW - Total capacity, cost/Wp, total cost)
│   ├── NotesSection.jsx           (EXISTING - Already reusable ✅)
│   └── ChangeLogDisplay.jsx       (EXISTING - Already reusable ✅)
│
├── BOMPrintPreview.jsx            (REFACTORED - Uses shared components)
├── PrintSettingsModal.jsx         (REFACTORED - Uses shared components)
│
└── edit-only/                      (Edit-only components)
    ├── AddRowModal.jsx
    ├── DeleteRowModal.jsx
    ├── ReviewChangesModal.jsx
    └── BOMEditControls.jsx        (NEW - Extracted from BOMPage)
```

---

## 📝 Implementation Plan

### Phase 1: Fix Print Header Repetition

#### Step 1.1: Extract Building Info from `<thead>`

**Current:** Building codes + variation + panel counts are in `<thead>` rows 1-2

**Change to:** Move them OUTSIDE the table, above it

**New Structure:**
```jsx
{/* OUTSIDE <table> - Won't repeat on print */}
<BOMTableInfo
  projectName={projectInfo.projectName}
  longRailVariation={projectInfo.longRailVariation}
  tabs={tabs}
  panelCounts={panelCounts}
/>

<table>
  <thead>
    {/* ONLY Row 3 - Column headers - This will repeat */}
    <tr className="bg-yellow-400">
      <th>S.N</th>
      <th>Sunrack Code</th>
      <th>Profile</th>
      {/* ... rest of column headers */}
    </tr>
  </thead>
  <tbody>
    {/* Data rows */}
  </tbody>
</table>
```

#### Step 1.2: Create `BOMTableInfo.jsx`

**Location:** `src/components/BOM/shared/BOMTableInfo.jsx`

**Props:**
```typescript
interface BOMTableInfoProps {
  projectName: string;
  longRailVariation: string;
  tabs: string[];
  panelCounts: Record<string, number>;
}
```

**Responsibilities:**
- Display project name and variation
- Show building codes
- Show panel counts per building
- Should NOT be in `<table>` element

**Styling:**
- Yellow background (bg-yellow-400)
- Border matching table
- Fixed positioning above table

---

### Phase 2: Create Shared Components

#### Step 2.1: Create `BOMHeader.jsx`

**Location:** `src/components/BOM/shared/BOMHeader.jsx`

**What it contains:** (Currently in BOMPage lines 2467-2504)
- Purple gradient header box
- Project name (left)
- Variation badge (center)
- Buildings/Items count (left bottom)
- "Generated by: username" + date (right)

**Props:**
```typescript
interface BOMHeaderProps {
  projectName: string;
  longRailVariation: string;
  totalTabs: number;
  totalItems: number;
  generatedAt: string;
  generatedBy: string;
}
```

**Usage:**
```jsx
// In BOMPage
<BOMHeader
  projectName={bomData.projectInfo.projectName}
  longRailVariation={bomData.projectInfo.longRailVariation}
  totalTabs={bomData.tabs.length}
  totalItems={bomData.bomItems.length}
  generatedAt={bomData.projectInfo.generatedAt}
  generatedBy={user?.username}
/>

// In BOMPrintPreview (same usage)
// In PrintSettingsModal (same usage)
```

---

#### Step 2.2: Create `BOMSummaryCards.jsx`

**Location:** `src/components/BOM/shared/BOMSummaryCards.jsx`

**What it contains:** (Currently in BOMPage lines 2645-2695)
- Total Capacity card (kWp)
- Cost/Wp card
- Total Cost card

**Props:**
```typescript
interface BOMSummaryCardsProps {
  bomItems: BOMItem[];
  panelCounts: Record<string, number>;
  moduleWp: number;
}
```

**Calculations:**
```javascript
// Total panels
const totalPanels = Object.values(panelCounts).reduce((a, b) => a + b, 0);

// Total capacity in kWp
const totalCapacityKWp = (totalPanels * moduleWp) / 1000;

// Total cost
const totalCost = bomItems.reduce((acc, item) => acc + (item.cost || 0), 0);

// Cost per Wp
const costPerWp = totalCost / (totalPanels * moduleWp);
```

**Usage:**
```jsx
<BOMSummaryCards
  bomItems={bomData.bomItems}
  panelCounts={bomData.panelCounts}
  moduleWp={moduleWp}
/>
```

---

#### Step 2.3: Refactor `BOMTable.jsx`

**Current Issues:**
- Contains 3-row header (needs to be 1-row)
- Has edit logic mixed with display
- Used in 3 places but duplicated in 2

**Changes:**

1. **Simplify `<thead>` to 1 row only:**
```jsx
<thead>
  <tr className="bg-yellow-400">
    {editMode && <th>Actions</th>}
    <th>S.N</th>
    <th>Sunrack Code</th>
    <th>Profile</th>
    <th>Item Description</th>
    <th>Material</th>
    <th>Length (mm)</th>
    <th>UoM</th>
    {tabs.map(tab => <th key={tab}>{tab}</th>)}
    <th>Total</th>
    <th colSpan={2}>Spare</th>
    <th colSpan={6}>Weight & Cost</th>
  </tr>
</thead>
```

2. **Add props for different modes:**
```typescript
interface BOMTableProps {
  bomData: BOMData;
  editMode?: boolean;      // Enable edit controls
  printMode?: boolean;     // Special print styling
  showActions?: boolean;   // Show delete/drag buttons
  // ... existing props
}
```

3. **Keep in:** `src/components/BOM/BOMTable.jsx` (existing location)

---

#### Step 2.4: Update `BOMTableRow.jsx`

**No major changes needed** - Already accepts props, but verify:
- `editMode` prop works correctly
- `printMode` prop for read-only display
- All calculations use passed data (not local state)

---

### Phase 3: Refactor BOMPage

#### Step 3.1: Extract Edit Controls

**Create:** `src/components/BOM/edit-only/BOMEditControls.jsx`

**What to extract:** (Lines 2507-2631 in BOMPage)
- Aluminum Rate input
- Spare % input
- Module Wp input
- Profile dropdown
- Enable Edit / Done Editing button
- Discard Changes button
- Print button
- Add Row button

**Props:**
```typescript
interface BOMEditControlsProps {
  editMode: boolean;
  isSaving: boolean;
  aluminumRate: number;
  sparePercentage: number;
  moduleWp: number;
  profileOptions: Profile[];
  selectedProfile: string;
  onToggleEdit: () => void;
  onDiscard: () => void;
  onPrint: () => void;
  onAddRow: () => void;
  onAluminumRateChange: (value: number) => void;
  onSparePercentageChange: (value: number) => void;
  onModuleWpChange: (value: number) => void;
  onProfileChange: (value: string) => void;
}
```

---

#### Step 3.2: Restructure BOMPage.jsx

**New structure:**
```jsx
export default function BOMPage() {
  // ... all state and logic stays here

  return (
    <>
      <header>
        <BOMEditControls
          editMode={editMode}
          isSaving={isSaving}
          aluminumRate={aluminumRate}
          sparePercentage={sparePercentage}
          moduleWp={moduleWp}
          // ... all other props
        />
      </header>

      <main>
        <div className="bg-white rounded-2xl">
          {/* Purple Header */}
          <BOMHeader
            projectName={bomData.projectInfo.projectName}
            longRailVariation={bomData.projectInfo.longRailVariation}
            totalTabs={bomData.tabs.length}
            totalItems={bomData.bomItems.length}
            generatedAt={bomData.projectInfo.generatedAt}
            generatedBy={user?.username}
          />

          {/* Building Info (extracted from table) */}
          <BOMTableInfo
            projectName={bomData.projectInfo.projectName}
            longRailVariation={bomData.projectInfo.longRailVariation}
            tabs={bomData.tabs}
            panelCounts={bomData.panelCounts}
          />

          {/* Table with ONLY column header row in thead */}
          <BOMTable
            bomData={bomData}
            editMode={editMode}
            showActions={editMode}
            onProfileChange={handleProfileChange}
            profileOptions={profileOptions}
            onItemUpdate={handleItemUpdate}
            aluminumRate={aluminumRate}
            sparePercentage={sparePercentage}
            onDeleteRow={handleDeleteRowClick}
            onDragEnd={handleDragEnd}
          />

          {/* Summary Cards */}
          <BOMSummaryCards
            bomItems={bomData.bomItems}
            panelCounts={bomData.panelCounts}
            moduleWp={moduleWp}
          />

          {/* Change Log */}
          <ChangeLogDisplay changeLog={changeLog} />

          {/* Notes */}
          <NotesSection
            userNotes={userNotes}
            onNotesChange={handleNotesChange}
            editMode={editMode}
          />
        </div>
      </main>

      {/* Modals - stay at bottom */}
      {showAddModal && <AddRowModal ... />}
      {deleteModalOpen && <DeleteRowModal ... />}
      {reviewModalOpen && <ReviewChangesModal ... />}
      {printSettingsModalOpen && <PrintSettingsModal ... />}
    </>
  );
}
```

---

### Phase 4: Refactor BOMPrintPreview.jsx

#### Step 4.1: Replace Duplicated HTML

**Current:** Lines 200-600 have duplicated table HTML

**Replace with:**
```jsx
export default function BOMPrintPreview() {
  // ... existing state loading logic stays

  if (!bomData || !printSettings) return <div>Loading...</div>;

  return (
    <div className="print-preview-container">
      {/* Use shared components */}
      {printSettings.includeHeader && (
        <BOMHeader
          projectName={bomData.projectInfo.projectName}
          longRailVariation={bomData.projectInfo.longRailVariation}
          totalTabs={bomData.tabs.length}
          totalItems={bomData.bomItems.length}
          generatedAt={bomData.projectInfo.generatedAt}
          generatedBy={bomData.projectInfo.generatedBy || 'Unknown'}
        />
      )}

      {/* Building info OUTSIDE table */}
      <BOMTableInfo
        projectName={bomData.projectInfo.projectName}
        longRailVariation={bomData.projectInfo.longRailVariation}
        tabs={bomData.tabs}
        panelCounts={bomData.panelCounts}
      />

      {/* Table with simplified header */}
      <BOMTable
        bomData={bomData}
        printMode={true}
        editMode={false}
        showActions={false}
        aluminumRate={aluminumRate}
        sparePercentage={sparePercentage}
      />

      {printSettings.includeCosting && (
        <BOMSummaryCards
          bomItems={bomData.bomItems}
          panelCounts={bomData.panelCounts}
          moduleWp={moduleWp}
        />
      )}

      {printSettings.includeNotes && (
        <NotesSection
          userNotes={bomData.userNotes || []}
          editMode={false}
        />
      )}

      {printSettings.includeChangeLog && (
        <ChangeLogDisplay changeLog={changeLog} />
      )}
    </div>
  );
}
```

---

### Phase 5: Refactor PrintSettingsModal.jsx

#### Step 5.1: Replace Preview Table

**Current:** Lines 300-700 have another duplicated table

**Replace with:** Same shared components as BOMPrintPreview

```jsx
{/* Inside modal preview section */}
<div className="preview-section">
  <BOMTableInfo
    projectName={bomData.projectInfo.projectName}
    longRailVariation={bomData.projectInfo.longRailVariation}
    tabs={bomData.tabs}
    panelCounts={bomData.panelCounts}
  />

  <BOMTable
    bomData={bomData}
    printMode={true}
    editMode={false}
    aluminumRate={aluminumRate}
    sparePercentage={sparePercentage}
  />

  {selectedSections.includeCosting && (
    <BOMSummaryCards
      bomItems={bomData.bomItems}
      panelCounts={bomData.panelCounts}
      moduleWp={moduleWp}
    />
  )}

  {selectedSections.includeNotes && (
    <NotesSection userNotes={bomData.userNotes || []} editMode={false} />
  )}
</div>
```

---

### Phase 6: Update Print CSS

#### Step 6.1: Fix Header Repetition in print.css

**File:** `src/styles/print.css`

**Change:**
```css
/* BEFORE (line 22-24) */
thead {
  display: table-header-group; /* Repeats ALL thead rows */
}

/* AFTER */
thead {
  display: table-header-group; /* Only 1 row now, safe to repeat */
}

/* Add: Prevent page break in table info */
.bom-table-info {
  page-break-after: avoid;
  page-break-inside: avoid;
}

/* Ensure table info stays with table */
.bom-table-info + table {
  page-break-before: avoid;
}
```

---

## 📂 File Changes Summary

### New Files to Create

1. `src/components/BOM/shared/BOMHeader.jsx` ✨ NEW
2. `src/components/BOM/shared/BOMTableInfo.jsx` ✨ NEW
3. `src/components/BOM/shared/BOMSummaryCards.jsx` ✨ NEW
4. `src/components/BOM/edit-only/BOMEditControls.jsx` ✨ NEW

### Files to Modify

1. `src/components/BOM/BOMTable.jsx` 🔧 MODIFY
   - Remove rows 1-2 from `<thead>`
   - Add `printMode` prop handling

2. `src/components/BOM/BOMPage.jsx` 🔧 MAJOR REFACTOR
   - Extract edit controls
   - Use shared components
   - Pass data correctly

3. `src/components/BOM/BOMPrintPreview.jsx` 🔧 MAJOR REFACTOR
   - Remove duplicated HTML (lines 200-600)
   - Use shared components
   - Ensure data includes `userNotes`

4. `src/components/BOM/PrintSettingsModal.jsx` 🔧 MAJOR REFACTOR
   - Remove duplicated HTML (lines 300-700)
   - Use shared components

5. `src/styles/print.css` 🔧 MINOR CHANGE
   - Add styles for `.bom-table-info`
   - Keep `thead { display: table-header-group; }`

### Files Already Good ✅

1. `src/components/BOM/NotesSection.jsx` - Already reusable
2. `src/components/BOM/ChangeLogDisplay.jsx` - Already reusable
3. `src/components/BOM/BOMTableRow.jsx` - Minor verification needed

---

## 🔄 Data Flow Fix

### Problem: Notes Not Appearing in Print

**Root Cause:** `bomData.userNotes` not being passed/included

**Fix in BOMPage when opening print:**
```javascript
// In handlePrint function
const handlePrint = () => {
  navigate('/bom/print-preview', {
    state: {
      bomData: {
        ...bomData,
        userNotes: userNotes,  // ← ADD THIS
        projectInfo: {
          ...bomData.projectInfo,
          longRailVariation: bomData.projectInfo.longRailVariation || 'BOM for U Cleat Long Rail'
        }
      },
      printSettings: { ... },
      aluminumRate,
      sparePercentage,
      moduleWp,
      changeLog
    }
  });
};
```

**Fix in backend `getBOMById`:**
Ensure `userNotes` is included in returned data:
```javascript
// In bomService.js
const bomRecord = await prisma.generatedBom.findUnique({
  where: { id: bomId },
  select: {
    // ... existing fields
    bomData: true,
    bomMetadata: true,
    userNotes: true,  // ← Ensure this is selected
    changeLog: true
  }
});

return {
  bomData: {
    ...bomRecord.bomData,
    userNotes: bomRecord.userNotes || []  // ← Include in response
  },
  changeLog: bomRecord.changeLog || []
};
```

---

## 🧪 Testing Checklist

### Test 1: Print Header Repetition
- [ ] Create BOM with 20+ items
- [ ] Print preview
- [ ] Verify page 1 shows full building info + variation
- [ ] Verify page 2+ shows ONLY column headers (S.N, Profile, etc.)
- [ ] Verify building codes DON'T repeat on page 2+

### Test 2: Notes Sync
- [ ] Add notes in BOMPage
- [ ] Click Print
- [ ] Verify notes appear in Print Preview
- [ ] Verify notes appear in actual print

### Test 3: Data Consistency
- [ ] Edit aluminum rate in BOMPage
- [ ] Print preview should show updated rate
- [ ] Edit spare percentage
- [ ] Print preview should reflect change

### Test 4: Summary Cards
- [ ] Verify Total Capacity calculation matches
- [ ] Verify Cost/Wp calculation matches
- [ ] Verify Total Cost calculation matches
- [ ] All three should be identical in BOMPage and Print Preview

### Test 5: Print Settings Modal
- [ ] Open print settings modal
- [ ] Preview should match actual print
- [ ] Toggle sections (notes, costing, etc.)
- [ ] Preview updates correctly

### Test 6: Edit Mode
- [ ] Enable edit mode
- [ ] Add row - works
- [ ] Delete row - works
- [ ] Edit values - works
- [ ] Drag reorder - works

---

## 🚀 Implementation Order

### Recommended Order (Safest)

1. **Day 1: Create Shared Components**
   - Create `BOMHeader.jsx` ✨
   - Create `BOMTableInfo.jsx` ✨
   - Create `BOMSummaryCards.jsx` ✨
   - Test them in isolation

2. **Day 2: Refactor BOMTable**
   - Modify `BOMTable.jsx` to use simplified `<thead>` 🔧
   - Test with existing BOMPage

3. **Day 3: Refactor BOMPage**
   - Extract `BOMEditControls.jsx` ✨
   - Use shared components in BOMPage 🔧
   - Test all edit functionality

4. **Day 4: Refactor Print Components**
   - Refactor `BOMPrintPreview.jsx` 🔧
   - Refactor `PrintSettingsModal.jsx` 🔧
   - Update print.css 🔧

5. **Day 5: Testing & Bug Fixes**
   - Run all tests
   - Fix any issues
   - Verify data flow

---

## 💡 Tips for AI Agent Implementation

### Important Considerations

1. **Preserve Existing Logic**
   - Don't change calculation formulas
   - Keep all event handlers
   - Maintain state management

2. **CSS Class Preservation**
   - Keep all Tailwind classes
   - Maintain yellow backgrounds (bg-yellow-400)
   - Preserve hover effects (except in print mode)

3. **Props Typing**
   - Use TypeScript interfaces if available
   - Document all props with JSDoc
   - Provide default values

4. **Testing Each Step**
   - Create component → Test in isolation
   - Integrate → Test with parent
   - Don't move to next step until current works

5. **Data Structure**
   ```typescript
   interface BOMData {
     projectInfo: {
       projectName: string;
       longRailVariation: string;
       totalTabs: number;
       generatedAt: string;
     };
     tabs: string[];
     panelCounts: Record<string, number>;
     bomItems: BOMItem[];
     userNotes: Note[];
   }
   ```

6. **Print Mode Flag**
   - Always pass `printMode={true}` to print components
   - Use to hide interactive elements
   - Adjust spacing/styling for print

---

## 📊 Success Metrics

After implementation, verify:

✅ **Zero code duplication** - Same table HTML used in all 3 places
✅ **Print header = 1 row** - Only column headers repeat on page 2+
✅ **Notes sync works** - Notes added in BOMPage appear in print
✅ **All calculations match** - BOMPage = Print Preview = Actual Print
✅ **Edit mode works** - All edit features functional
✅ **Print looks professional** - Clean, readable, proper page breaks

---

## 🔗 Related Files Reference

### Key Files to Understand

- `src/components/BOM/BOMPage.jsx` - Main orchestrator
- `src/components/BOM/BOMTable.jsx` - Core table component
- `src/components/BOM/BOMTableRow.jsx` - Individual row rendering
- `src/services/bomDataCollection.js` - Data preparation
- `src/services/bomCalculations.js` - Cost/weight calculations
- `src/styles/print.css` - Print-specific styles

### Backend Files

- `backend/src/services/bomService.js` - BOM CRUD operations
- `backend/src/controllers/bomController.js` - API endpoints
- `backend/prisma/schema.prisma` - Database schema

---

## 📞 Questions & Clarifications

If unclear during implementation, consider:

1. **Should building info be printable separately?**
   - Current plan: Always print with table
   - Alternative: Make it optional in print settings

2. **Header styling in print mode?**
   - Keep yellow background for branding
   - Or use grayscale for ink savings?

3. **Page break strategy?**
   - Current: Natural page breaks
   - Alternative: Force new page for each section?

---

## ✅ Completion Checklist

- [ ] All 4 new components created
- [ ] BOMTable.jsx refactored (simplified thead)
- [ ] BOMPage.jsx refactored (uses shared components)
- [ ] BOMPrintPreview.jsx refactored (no duplicated HTML)
- [ ] PrintSettingsModal.jsx refactored (no duplicated HTML)
- [ ] print.css updated
- [ ] All tests passing
- [ ] Notes sync working
- [ ] Print header repetition fixed
- [ ] Documentation updated
- [ ] Code reviewed

---

**Document Version:** 1.0
**Created:** 2025-12-24
**Last Updated:** 2025-12-24
**Status:** Ready for Implementation
