# Database Refactoring Analysis

## Current State (As of 2026-01-06)

### Tables and Relationships

```
bom_master_items (153 items total)
├── Profiles: 140 items (sunrackProfileId NOT NULL) ──> sunrack_profiles
└── Fasteners: 13 items (sunrackProfileId IS NULL)

bom_variation_templates (8 templates)
└── bom_variation_items (links templates to bom_master_items)
    └── masterItemId ──> bom_master_items (profiles + fasteners)
```

### Data Distribution

| Table | Records | Purpose |
|-------|---------|---------|
| `bom_master_items` | 153 | **MIXED: Profiles (140) + Fasteners (13)** |
| `sunrack_profiles` | 140 | Aluminum profile catalog with vendor codes |
| `bom_variation_templates` | 8 | Template definitions for variations |
| `bom_variation_items` | ~100 | Links templates to items in `bom_master_items` |

### Current Issues ❌

1. **Confusion**: `bom_master_items` contains BOTH profiles and fasteners
2. **Data Duplication**: Profile data is split between `bom_master_items` and `sunrack_profiles`
3. **Unclear Separation**: No dedicated fasteners table
4. **Complex Queries**: Need to filter by `sunrackProfileId IS NULL` to identify fasteners

### How Current System Works ✅

**Templates ARE correctly linked!**

```javascript
// bom_variation_items links to bom_master_items
{
  templateId: 1,                    // "U Cleat Long Rail - Regular"
  masterItemId: 26,                 // "40mm Long Rail" (Profile)
  formulaKey: "LONG_RAIL"
}

{
  templateId: 1,                    // Same template
  masterItemId: 200,                // "M8 Hex Head Fastener Set" (Fastener)
  formulaKey: "M8x60_BOLT"
}
```

**Current Link Structure:**
- `bom_variation_items.masterItemId` → `bom_master_items.id`
- `bom_master_items.sunrackProfileId` → `sunrack_profiles.id` (for profiles only)
- Fasteners have `sunrackProfileId = NULL`

---

## Desired State (User's Request)

### Proposed Table Structure

```
sunrack_profiles (Profiles only - with weight)
├── All aluminum profile data
├── Design weight and calculations
└── Vendor codes (Regal, Excellence, etc.)

fasteners (Fasteners only)
├── All fastener data
├── No weight (or minimal weight)
└── Fastener-specific fields

bom_variation_templates (Templates)
└── bom_variation_items (Links to BOTH tables)
    ├── sunrackProfileId ──> sunrack_profiles (for profile items)
    └── fastenerId ──> fasteners (for fastener items)
```

### Benefits ✅

1. **Clear Separation**: Profiles and fasteners in separate tables
2. **No Confusion**: Each table has a clear purpose
3. **Better Organization**: Easier to manage and query
4. **Type Safety**: Can't accidentally mix profiles and fasteners
5. **Simplified Code**: No need to check `sunrackProfileId IS NULL`

---

## Migration Plan

### Phase 1: Create Fasteners Table

```prisma
model Fastener {
  id               Int      @id @default(autoincrement())
  serialNumber     String   @unique @map("serial_number") @db.VarChar(20)
  itemDescription  String   @map("item_description") @db.VarChar(255)
  genericName      String   @map("generic_name") @db.VarChar(100)
  material         String?  @db.VarChar(100)
  uom              String   @db.VarChar(20)
  category         String?  @db.VarChar(50)
  selectedRmVendor String?  @map("selected_rm_vendor") @db.VarChar(50)
  costPerPiece     Decimal? @map("cost_per_piece") @db.Decimal(10, 2)
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  variationItems   BomVariationItem[]
  formulas         FastenerFormula[]
  rmCodes          FastenerRmCode[]

  @@map("fasteners")
}
```

### Phase 2: Update BomVariationItem

```prisma
model BomVariationItem {
  id               Int      @id @default(autoincrement())
  templateId       Int      @map("template_id")

  // ONE of these two should be set (profiles XOR fasteners)
  sunrackProfileId Int?     @map("sunrack_profile_id")
  fastenerId       Int?     @map("fastener_id")

  displayOverride  String?  @map("display_override") @db.VarChar(255)
  formulaKey       String?  @map("formula_key") @db.VarChar(50)
  quantityFormula  String?  @map("quantity_formula") @db.Text

  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  template         BomVariationTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  sunrackProfile   SunrackProfile?      @relation(fields: [sunrackProfileId], references: [id])
  fastener         Fastener?            @relation(fields: [fastenerId], references: [id])

  @@index([templateId])
  @@index([sunrackProfileId])
  @@index([fastenerId])
  @@map("bom_variation_items")
}
```

### Phase 3: Migrate Data

1. **Copy fasteners from `bom_master_items` to `fasteners`**
   ```sql
   INSERT INTO fasteners (serial_number, item_description, generic_name, ...)
   SELECT serial_number, item_description, generic_name, ...
   FROM bom_master_items
   WHERE sunrack_profile_id IS NULL;
   ```

2. **Update `bom_variation_items` to link to `fasteners`**
   ```sql
   UPDATE bom_variation_items vi
   JOIN bom_master_items mi ON vi.master_item_id = mi.id
   JOIN fasteners f ON f.serial_number = mi.serial_number
   SET vi.fastener_id = f.id
   WHERE mi.sunrack_profile_id IS NULL;
   ```

3. **Update `bom_variation_items` to link to `sunrack_profiles`**
   ```sql
   UPDATE bom_variation_items vi
   JOIN bom_master_items mi ON vi.master_item_id = mi.id
   SET vi.sunrack_profile_id = mi.sunrack_profile_id
   WHERE mi.sunrack_profile_id IS NOT NULL;
   ```

4. **Migrate formulas and RM codes**
   - Copy `bom_formulas` to new `fastener_formulas` table
   - Copy `rm_codes` to new `fastener_rm_codes` table

### Phase 4: Update Code References

**Files that need updates:**

1. `backend/src/services/bomService.js`
   - Replace `bomMasterItem` queries with `sunrackProfile` + `fastener` queries

2. `backend/src/routes/templateRoutes.js`
   - Update template queries to include both `sunrackProfile` and `fastener` relations

3. `knapsack-front/src/services/bomCalculations.js`
   - Update to handle items from either profiles or fasteners

4. All scripts that reference `bom_master_items`

### Phase 5: Remove Old Table

1. Drop foreign key constraints
2. Drop `bom_master_items` table
3. Drop `bom_formulas` table (if migrated to fastener_formulas)
4. Drop `rm_codes` table (if migrated to fastener_rm_codes)

---

## Files That Need Updates

### Backend
- `backend/prisma/schema.prisma` - Schema definition
- `backend/src/services/bomService.js` - BOM operations
- `backend/src/routes/templateRoutes.js` - Template endpoints
- `backend/src/routes/bomRoutes.js` - BOM routes (if exists)
- All scripts in `backend/scripts/`

### Frontend
- `knapsack-front/src/services/bomCalculations.js` - Calculations
- `knapsack-front/src/services/templateService.js` - Template API
- Any components using BOM data

---

## Questions to Consider

1. **Formulas**: Should profiles and fasteners have separate formula tables, or share one?
2. **RM Codes**: Should these also be separated by type?
3. **Serial Numbers**: Keep current numbering (200+ for fasteners) or renumber?
4. **Backward Compatibility**: Need to maintain old data during transition?
5. **Profile Data**: Should we merge `bom_master_items` profile data into `sunrack_profiles`?

---

## Recommendation

**YES, your template structure (`bom_variation_templates` + `bom_variation_items`) is CORRECT and well-designed!**

The only issue is the `bom_master_items` table mixing profiles and fasteners. The refactoring above will:
- Keep your excellent template system
- Separate profiles and fasteners clearly
- Make the codebase much cleaner and easier to maintain

**Next Steps:**
1. Review this plan
2. Decide on questions above
3. Create migration scripts
4. Test with sample data
5. Update all code references
6. Deploy migration
