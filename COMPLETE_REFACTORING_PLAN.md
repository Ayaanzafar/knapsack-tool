# Complete Database Refactoring Plan

## Goal
Separate profiles and fasteners into distinct tables, remove `bom_master_items` confusion

## Decisions Made ✅

1. **RM Codes**: DELETE `rm_codes` table (vendor codes already in `sunrack_profiles`)
2. **Fastener Serial Numbers**: Start fresh from 1 (don't keep 200+ numbering)
3. **Formulas**: Keep ONE `bom_formulas` table with polymorphic links
4. **Templates**: Keep existing `bom_variation_templates` structure (it's already correct)

---

## Current vs New Structure

### BEFORE (Current State)
```
bom_master_items (153 items)
├── 140 Profiles (sunrackProfileId NOT NULL) ──> sunrack_profiles
└── 13 Fasteners (sunrackProfileId IS NULL)

bom_formulas (26 formulas)
└── itemSerialNumber ──> bom_master_items.serialNumber

rm_codes (1,400 rows - DUPLICATE DATA)
└── itemSerialNumber ──> bom_master_items.serialNumber

bom_variation_items
└── masterItemId ──> bom_master_items.id
```

### AFTER (Target State)
```
sunrack_profiles (140 profiles)
├── All vendor codes built-in (regalCode, excellenceCode, etc.)
├── Design weight, profile images, descriptions
└── Used ONLY for aluminum profiles

fasteners (13 fasteners, IDs 1-13)
├── Fresh ID sequence starting from 1
├── No weight calculations needed
└── Used ONLY for bolts, screws, washers, etc.

bom_formulas (26 formulas)
├── sunrackProfileId ──> sunrack_profiles.id (for profile formulas)
└── fastenerId ──> fasteners.id (for fastener formulas)

bom_variation_items
├── sunrackProfileId ──> sunrack_profiles.id (for profile items)
└── fastenerId ──> fasteners.id (for fastener items)
```

---

## Step-by-Step Migration Plan

### PHASE 1: Create New Schema

#### 1.1 Create Fasteners Table

```prisma
model Fastener {
  id               Int      @id @default(autoincrement())

  // Keep old serial number for reference during migration
  oldSerialNumber  String?  @unique @map("old_serial_number") @db.VarChar(20)

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

  formulas         BomFormula[]
  variationItems   BomVariationItem[]

  @@map("fasteners")
}
```

#### 1.2 Update BomFormula Table

```prisma
model BomFormula {
  id                 Int      @id @default(autoincrement())

  // Polymorphic FK - ONE of these should be set
  sunrackProfileId   Int?     @map("sunrack_profile_id")
  fastenerId         Int?     @map("fastener_id")

  formulaKey         String   @map("formula_key") @db.VarChar(50)
  formulaDescription String?  @map("formula_description") @db.Text
  calculationLevel   Int      @map("calculation_level")
  isActive           Boolean  @default(true) @map("is_active")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  sunrackProfile SunrackProfile? @relation(fields: [sunrackProfileId], references: [id])
  fastener       Fastener?       @relation(fields: [fastenerId], references: [id])

  @@index([sunrackProfileId])
  @@index([fastenerId])
  @@index([formulaKey])
  @@map("bom_formulas")
}
```

#### 1.3 Update BomVariationItem Table

```prisma
model BomVariationItem {
  id               Int      @id @default(autoincrement())
  templateId       Int      @map("template_id")

  // Polymorphic FK - ONE of these should be set
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

#### 1.4 Update SunrackProfile to Add Relations

```prisma
model SunrackProfile {
  id                  Int      @id @default(autoincrement())
  sNo                 Int      @unique @map("s_no")

  // Vendor codes (already exist)
  regalCode           String?  @map("regal_code") @db.VarChar(50)
  excellenceCode      String?  @map("excellence_code") @db.VarChar(50)
  varnCode            String?  @map("varn_code") @db.VarChar(50)
  rcCode              String?  @map("rc_code") @db.VarChar(50)
  snalcoCode          String?  @map("snalco_code") @db.VarChar(50)
  darshanCode         String?  @map("darshan_code") @db.VarChar(50)
  jmCode              String?  @map("jm_code") @db.VarChar(50)
  ralcoCode           String?  @map("ralco_code") @db.VarChar(50)
  saiDeepCode         String?  @map("sai_deep_code") @db.VarChar(50)
  eleanorCode         String?  @map("eleanor_code") @db.VarChar(50)

  profileImage        String?  @map("profile_image") @db.Text
  profileDescription  String   @map("profile_description") @db.Text
  genericName         String   @map("generic_name") @db.VarChar(255)
  designWeight        Decimal  @map("design_weight") @db.Decimal(10, 5)
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  // NEW RELATIONS
  formulas         BomFormula[]
  variationItems   BomVariationItem[]

  @@index([regalCode])
  @@index([excellenceCode])
  @@index([varnCode])
  @@map("sunrack_profiles")
}
```

---

### PHASE 2: Data Migration Scripts

#### 2.1 Migrate Fasteners Data

**Script: `backend/scripts/migrations/01_migrate_fasteners.js`**

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting fastener migration...\n');

  // Get all fasteners from bom_master_items
  const fasteners = await prisma.bomMasterItem.findMany({
    where: {
      sunrackProfileId: null
    }
  });

  console.log(`Found ${fasteners.length} fasteners to migrate`);

  // Insert into new fasteners table
  for (const fastener of fasteners) {
    await prisma.fastener.create({
      data: {
        oldSerialNumber: fastener.serialNumber,
        itemDescription: fastener.itemDescription,
        genericName: fastener.genericName,
        material: fastener.material,
        uom: fastener.uom,
        category: fastener.category,
        selectedRmVendor: fastener.selectedRmVendor,
        costPerPiece: fastener.costPerPiece,
        isActive: fastener.isActive
      }
    });
    console.log(`✓ Migrated: ${fastener.genericName} (old serial: ${fastener.serialNumber})`);
  }

  console.log('\n✅ Fastener migration complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### 2.2 Migrate BomFormula Links

**Script: `backend/scripts/migrations/02_migrate_formulas.js`**

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting formula migration...\n');

  const formulas = await prisma.bomFormula.findMany({
    include: {
      masterItem: true
    }
  });

  console.log(`Found ${formulas.length} formulas to migrate`);

  let profileFormulas = 0;
  let fastenerFormulas = 0;

  for (const formula of formulas) {
    if (formula.masterItem.sunrackProfileId !== null) {
      // Profile formula
      await prisma.bomFormula.update({
        where: { id: formula.id },
        data: {
          sunrackProfileId: formula.masterItem.sunrackProfileId
        }
      });
      profileFormulas++;
      console.log(`✓ Profile formula: ${formula.formulaKey} -> Profile ID ${formula.masterItem.sunrackProfileId}`);
    } else {
      // Fastener formula
      const fastener = await prisma.fastener.findUnique({
        where: { oldSerialNumber: formula.masterItem.serialNumber }
      });

      if (fastener) {
        await prisma.bomFormula.update({
          where: { id: formula.id },
          data: {
            fastenerId: fastener.id
          }
        });
        fastenerFormulas++;
        console.log(`✓ Fastener formula: ${formula.formulaKey} -> Fastener ID ${fastener.id}`);
      }
    }
  }

  console.log(`\n✅ Formula migration complete!`);
  console.log(`   Profile formulas: ${profileFormulas}`);
  console.log(`   Fastener formulas: ${fastenerFormulas}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### 2.3 Migrate BomVariationItem Links

**Script: `backend/scripts/migrations/03_migrate_variation_items.js`**

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting variation item migration...\n');

  const variationItems = await prisma.bomVariationItem.findMany({
    include: {
      masterItem: true,
      template: {
        select: { variationName: true }
      }
    }
  });

  console.log(`Found ${variationItems.length} variation items to migrate`);

  let profileItems = 0;
  let fastenerItems = 0;

  for (const item of variationItems) {
    if (item.masterItem.sunrackProfileId !== null) {
      // Profile item
      await prisma.bomVariationItem.update({
        where: { id: item.id },
        data: {
          sunrackProfileId: item.masterItem.sunrackProfileId
        }
      });
      profileItems++;
      console.log(`✓ Profile: ${item.template.variationName} -> ${item.masterItem.genericName}`);
    } else {
      // Fastener item
      const fastener = await prisma.fastener.findUnique({
        where: { oldSerialNumber: item.masterItem.serialNumber }
      });

      if (fastener) {
        await prisma.bomVariationItem.update({
          where: { id: item.id },
          data: {
            fastenerId: fastener.id
          }
        });
        fastenerItems++;
        console.log(`✓ Fastener: ${item.template.variationName} -> ${fastener.genericName}`);
      }
    }
  }

  console.log(`\n✅ Variation item migration complete!`);
  console.log(`   Profile items: ${profileItems}`);
  console.log(`   Fastener items: ${fastenerItems}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

### PHASE 3: Schema Cleanup

#### 3.1 Remove Old Columns from BomFormula

```sql
-- After migration is verified
ALTER TABLE bom_formulas DROP COLUMN item_serial_number;
```

#### 3.2 Remove Old Columns from BomVariationItem

```sql
-- After migration is verified
ALTER TABLE bom_variation_items DROP COLUMN master_item_id;
```

#### 3.3 Drop Old Tables

```sql
-- Delete rm_codes (duplicate data)
DROP TABLE rm_codes;

-- Delete bom_master_items (replaced by sunrack_profiles + fasteners)
DROP TABLE bom_master_items;
```

---

### PHASE 4: Update Backend Code

#### 4.1 Update Template Routes

**File: `backend/src/routes/templateRoutes.js`**

BEFORE:
```javascript
variationItems: {
  include: {
    masterItem: {
      include: {
        sunrackProfile: true
      }
    }
  }
}
```

AFTER:
```javascript
variationItems: {
  include: {
    sunrackProfile: true,  // For profile items
    fastener: true         // For fastener items
  }
}
```

#### 4.2 Update BOM Service

**File: `backend/src/services/bomService.js`**

Replace all `bomMasterItem` references with either:
- `sunrackProfile` queries for profiles
- `fastener` queries for fasteners

---

### PHASE 5: Update Frontend Code

#### 5.1 Update BOM Calculations

**File: `knapsack-front/src/services/bomCalculations.js`**

Update to handle items from either `sunrackProfile` or `fastener`:

```javascript
// OLD
const profile = item.masterItem.sunrackProfile;

// NEW
const profile = item.sunrackProfile || null;
const fastener = item.fastener || null;
const itemData = profile || fastener;
```

---

## Migration Execution Order

```
1. ✅ Backup database
2. ✅ Run Prisma migration to add new tables/columns
3. ✅ Run data migration script 01_migrate_fasteners.js
4. ✅ Run data migration script 02_migrate_formulas.js
5. ✅ Run data migration script 03_migrate_variation_items.js
6. ✅ Verify data integrity
7. ✅ Update backend code
8. ✅ Update frontend code
9. ✅ Test thoroughly
10. ✅ Run cleanup migration (drop old columns/tables)
11. ✅ Deploy to production
```

---

## Verification Checklist

- [ ] All 13 fasteners migrated to `fasteners` table
- [ ] All 26 formulas have either `sunrackProfileId` or `fastenerId`
- [ ] All ~100 variation items have either `sunrackProfileId` or `fastenerId`
- [ ] No broken foreign key references
- [ ] Frontend can fetch and display BOM templates
- [ ] BOM calculations work correctly
- [ ] Can save and load BOMs
- [ ] All tests pass

---

## Rollback Plan

If anything goes wrong:

1. Stop deployment
2. Restore database from backup
3. Revert code changes
4. Investigate issue
5. Fix and retry

---

## Expected Benefits After Migration

✅ **Clear Separation**: Profiles and fasteners in dedicated tables
✅ **No Confusion**: Each table has single responsibility
✅ **Better Performance**: Smaller, focused tables
✅ **Type Safety**: Can't accidentally mix profiles and fasteners
✅ **Cleaner Code**: Simpler queries, easier maintenance
✅ **Reduced Duplication**: Removed `rm_codes` table
✅ **Fresh Start**: Fasteners have clean IDs (1-13)

---

## Timeline Estimate

- Schema changes: 1 hour
- Data migration scripts: 2 hours
- Backend code updates: 3 hours
- Frontend code updates: 2 hours
- Testing: 4 hours
- **Total: ~12 hours** (spread over 2-3 days for careful testing)
