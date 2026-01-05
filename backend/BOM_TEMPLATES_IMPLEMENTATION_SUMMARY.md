# BOM Variation Templates - Implementation Summary

**Date:** 2026-01-05
**Status:** ✅ Database Setup Complete - Ready for Integration

---

## What We've Accomplished

### 1. ✅ Database Schema Updates

#### New Table: `bom_variation_templates`
```sql
CREATE TABLE bom_variation_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  variation_name VARCHAR(255) UNIQUE,
  items JSON,              -- Array of items with codes, descriptions, formulas
  default_notes JSON,      -- Array of default notes ["Note 1", "Note 2", ...]
  order VARCHAR(50) DEFAULT 'standard',
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME,
  updated_at DATETIME
);
```

#### Updated Table: `generated_boms`
- Added `notes` field (JSON) - Stores array of notes for each generated BOM

### 2. ✅ Data Extraction from Excel

**Source:** `Long Rail MMS Variants_8_types.xlsx`

**Extracted from 8 tabs:**
1. U Cleat Long Rail - Regular (13 items)
2. U Cleat Long Rail - Regular - Asbestos (12 items)
3. U Cleat Long Rail - Regular - Seam Clamp (14 items)
4. U Cleat Long Rail - Large Span/Height (13 items)
5. U Cleat Long Rail - Large Span - Asbestos (12 items)
6. U Cleat Long Rail - Large Height - Seam Clamp (14 items)
7. Double U Cleat Long Rail -160mm Height (13 items)
8. Double U Cleat Long Rail -180mm Height (13 items)

**Each item contains:**
- Serial Number
- Sunrack Code (e.g., MA-43, MA-110, SR-03) or NULL for fasteners
- Item Description
- Material (AA 6063, SS304, GI, EPDM)
- Length
- UoM (Nos)
- **Quantity Formula** (e.g., "Equal to sum of SB1 & SB2 in basic calculation sheet")

### 3. ✅ Database Seeded Successfully

All 8 variation templates are now in the database with:
- ✅ Complete item configurations
- ✅ Quantity calculation formulas
- ✅ Placeholder default notes (3 notes per template)

**Default Notes Structure (Placeholder):**
```json
[
  "This BOM is for [Variation Name]",
  "Please refer to installation manual for detailed guidelines",
  "All items are as per standard specifications"
]
```

---

## Database Architecture

### How It Works

#### 1. **Template Storage (Master)**
```javascript
// bom_variation_templates table
{
  id: 1,
  variationName: "U Cleat Long Rail - Regular",
  items: [
    {
      serialNumber: 1,
      sunrackCode: "MA -43",
      itemDescription: "Long Rail",
      material: "AA 6063",
      length: "Cutlength from Basic Calculation",
      uom: "Nos",
      quantityFormula: "Take respective Quantity from basic calculation sheet"
    },
    // ... more items
  ],
  defaultNotes: [
    "This BOM is for U Cleat Long Rail - Regular",
    "Please refer to installation manual for detailed guidelines",
    "All items are as per standard specifications"
  ]
}
```

#### 2. **BOM Generation (Copy from Template)**
When a BOM is generated:
```javascript
// 1. Get template
const template = await prisma.bomVariationTemplate.findUnique({
  where: { variationName: "U Cleat Long Rail - Regular" }
});

// 2. Create BOM with copied notes
const bom = await prisma.generatedBom.create({
  data: {
    projectId: projectId,
    notes: template.defaultNotes,  // Copy default notes
    bomItems: [...],               // Generate items using template.items
    // ... other fields
  }
});
```

#### 3. **Manager Edits Notes**
Manager can edit notes in the BOM screen:
```javascript
// Option 1: Update template (future BOMs get new notes)
await prisma.bomVariationTemplate.update({
  where: { variationName },
  data: { defaultNotes: newNotes }
});

// Option 2: Update only this BOM (only this BOM affected)
await prisma.generatedBom.update({
  where: { id: bomId },
  data: { notes: newNotes }
});
```

---

## Files Created

### Scripts
```
backend/scripts/
├── analyzeVariations.js           # Analyzes Excel file structure
├── extractVariationTemplates.js   # Extracts data to JSON
├── seedVariationTemplates.js      # Seeds database with templates
└── viewTemplateData.js            # Views template data from DB
```

### Data Files
```
backend/
├── variation_templates_extracted.json  # Extracted data from Excel
└── BOM_TEMPLATES_IMPLEMENTATION_SUMMARY.md  # This file
```

### Database Schema
```
backend/prisma/schema.prisma  # Updated with new table and field
```

---

## Next Steps - Integration

### Phase 1: Backend API (High Priority)

#### 1. Create Template API Endpoints
**File:** `backend/routes/bomTemplates.js` (NEW)

```javascript
// GET /api/bom-templates - Get all templates
// GET /api/bom-templates/:variationName - Get specific template
// PUT /api/bom-templates/:id/notes - Update template notes (manager only)
```

#### 2. Update BOM Generation Service
**File:** `backend/services/bomService.js` (UPDATE)

```javascript
// When generating BOM:
// 1. Get template for selected variation
// 2. Copy defaultNotes to BOM
// 3. Use template.items to filter/order BOM items
// 4. Apply quantity formulas from template
```

#### 3. Create Notes Update API
**File:** `backend/routes/bomRoutes.js` (UPDATE)

```javascript
// PUT /api/boms/:id/notes
// Body: { notes: [...], updateType: 'template' | 'bom-only' }
//
// If updateType = 'template':
//   - Update bom_variation_templates.defaultNotes
//   - Update this BOM's notes
// If updateType = 'bom-only':
//   - Update only this BOM's notes
```

### Phase 2: Frontend Integration (High Priority)

#### 1. Create Notes Management Component
**File:** `knapsack-front/src/components/BOM/NotesEditor.jsx` (NEW)

- Display numbered notes
- Add/Edit/Delete notes
- Show dialog on save: "Apply to Future" vs "This BOM Only"

#### 2. Update BOM Generation Logic
**File:** `knapsack-front/src/services/bomCalculations.js` (UPDATE)

- Fetch template from backend
- Filter items based on template.items
- Apply formulas from template
- Include notes in generated BOM

#### 3. Update BOM Display
**File:** `knapsack-front/src/components/BOM/BOMTable.jsx` (UPDATE)

- Display notes section
- Show numbered list (1, 2, 3...)
- Add "Edit Notes" button (manager only)

### Phase 3: Testing & Validation

1. **Test BOM Generation**
   - Create project with each variation
   - Verify correct items appear
   - Verify notes are copied from template

2. **Test Notes Editing**
   - Edit notes as manager
   - Test "Apply to Future" option
   - Test "This BOM Only" option
   - Verify changes persist correctly

3. **Test Print/Export**
   - Verify notes appear in printed BOM
   - Verify notes appear in exported PDF/Excel

---

## Manager Workflow (After Integration)

### Editing Default Notes

1. **Manager opens a BOM**
2. **Clicks "Edit Notes"**
3. **Modifies notes in editor**
4. **Clicks Save**
5. **System shows dialog:**
   ```
   ┌─────────────────────────────────────────┐
   │  How should these changes be applied?   │
   ├─────────────────────────────────────────┤
   │  ○ Apply for Future BOMs                │
   │     (Updates template - all new BOMs    │
   │      with this variation will use       │
   │      these notes)                       │
   │                                         │
   │  ○ Apply for This BOM Only              │
   │     (Only this BOM will have these      │
   │      notes)                             │
   │                                         │
   │  [ Cancel ]           [ Save Changes ]  │
   └─────────────────────────────────────────┘
   ```

6. **Manager selects option and saves**
7. **System updates accordingly**

---

## Database Queries Reference

### Get Template by Variation
```javascript
const template = await prisma.bomVariationTemplate.findUnique({
  where: { variationName: "U Cleat Long Rail - Regular" }
});
```

### Update Template Notes (Future BOMs)
```javascript
await prisma.bomVariationTemplate.update({
  where: { id: templateId },
  data: {
    defaultNotes: ["Note 1", "Note 2", "Note 3"],
    updatedAt: new Date()
  }
});
```

### Update BOM Notes (This BOM Only)
```javascript
await prisma.generatedBom.update({
  where: { id: bomId },
  data: {
    notes: ["Custom Note 1", "Custom Note 2"],
    updatedAt: new Date()
  }
});
```

### Get BOM with Notes
```javascript
const bom = await prisma.generatedBom.findUnique({
  where: { id: bomId },
  select: {
    id: true,
    notes: true,
    bomItems: true,
    // ... other fields
  }
});
```

---

## Benefits of This Architecture

✅ **Flexibility** - Manager can change notes without code changes
✅ **Consistency** - All new BOMs get latest default notes
✅ **Customization** - Individual BOMs can have custom notes
✅ **Scalability** - Easy to add more variations (23 total planned)
✅ **Maintainability** - Templates stored in database, easy to update
✅ **Audit Trail** - updatedAt tracks when notes were changed

---

## Current Status

### ✅ Completed
- [x] Database schema created
- [x] Excel data extracted
- [x] Templates seeded with 8 variations
- [x] Placeholder notes added
- [x] Database migration applied

### 📝 Pending (Next Session)
- [ ] Create backend API endpoints for templates
- [ ] Update BOM generation to use templates
- [ ] Create notes editor UI component
- [ ] Implement "Apply to Future" vs "This BOM Only" dialog
- [ ] Update BOM display to show notes
- [ ] Test complete workflow

---

## Testing the Database

### View All Templates
```bash
cd backend
node scripts/viewTemplateData.js
```

### Query Database Directly
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all templates
const templates = await prisma.bomVariationTemplate.findMany();
console.log(templates);

// Get specific template
const template = await prisma.bomVariationTemplate.findUnique({
  where: { variationName: "U Cleat Long Rail - Regular - Asbestos" }
});
console.log(template.defaultNotes);
console.log(template.items);
```

---

## Questions for Manager

Before proceeding with integration, please confirm:

1. **Notes Format:**
   - Are numbered notes (1, 2, 3...) the correct format?
   - Any specific formatting requirements?

2. **Notes Content:**
   - Should we create better default notes for each variation?
   - Or keep placeholders for now and manager will update through UI?

3. **Permissions:**
   - Only MANAGER role can edit default notes?
   - Can DESIGN role edit notes for individual BOMs?

4. **Print/Export:**
   - Should notes appear on printed BOMs?
   - Should notes appear in PDF exports?

---

**Last Updated:** 2026-01-05
**Status:** Ready for Backend/Frontend Integration
**Priority:** HIGH - Core functionality for BOM system
