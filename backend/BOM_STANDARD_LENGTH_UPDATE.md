# BOM Standard Length Update - TODO

## Issue
The `standard_length` column in `bom_master_items` table is currently **NULL/empty** for hardware items that have formulas. This causes the BOM to not display length values for these items below cut lengths.

## Items Requiring Standard Length Updates

The following items need their `standard_length` values populated:

| Serial Number | Sunrack Code | Generic Name | Required Length (mm) |
|--------------|--------------|--------------|---------------------|
| 100 | SRC-100 | Unified U Cleat | 40 |
| 47 | SRC-047 | External Long Rail Jointer | 150 |
| 110 | SRC-110 | 30mm End Clamp_Type 2 | 50 |
| 29 | SRC-029 | Mid Clamp (M+) | 50 |
| 15 | SRC-015 | Small Rail Nut | 20 |

## Current Behavior
- BOM displays **NULL or empty** in the "Length (mm)" column for these items
- This makes the BOM incomplete

## Expected Behavior
- BOM should display the standard length for each item in the "Length (mm)" column
- Example: Unified U Cleat should show **40** in the length column

## Implementation Steps

### Step 1: Create Update Script
Create a script: `backend/scripts/updateStandardLengths.js`

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateStandardLengths() {
  console.log('🔧 Updating standard lengths for BOM items...\n');

  const updates = [
    { serialNumber: '100', standardLength: 40, name: 'Unified U Cleat' },
    { serialNumber: '47', standardLength: 150, name: 'External Long Rail Jointer' },
    { serialNumber: '110', standardLength: 50, name: '30mm End Clamp_Type 2' },
    { serialNumber: '29', standardLength: 50, name: 'Mid Clamp (M+)' },
    { serialNumber: '15', standardLength: 20, name: 'Small Rail Nut' }
  ];

  try {
    for (const item of updates) {
      const result = await prisma.bomMasterItem.update({
        where: { serialNumber: item.serialNumber },
        data: { standardLength: item.standardLength }
      });
      console.log(`✅ ${item.name} (Serial ${item.serialNumber}) -> ${item.standardLength}mm`);
    }

    console.log('\n📊 Verification:');
    const verifyItems = await prisma.bomMasterItem.findMany({
      where: {
        serialNumber: {
          in: ['100', '47', '110', '29', '15']
        }
      },
      select: {
        serialNumber: true,
        genericName: true,
        standardLength: true
      },
      orderBy: {
        serialNumber: 'asc'
      }
    });

    verifyItems.forEach(item => {
      console.log(`   ${item.genericName.padEnd(30)} : ${item.standardLength}mm`);
    });

    console.log('\n✅ Standard lengths updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateStandardLengths()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
```

### Step 2: Run the Update Script
```bash
cd backend
node scripts/updateStandardLengths.js
```

### Step 3: Verify Changes
After running, verify in the database:
```sql
SELECT serial_number, generic_name, standard_length
FROM bom_master_items
WHERE serial_number IN ('100', '47', '110', '29', '15');
```

Expected output:
```
serial_number | generic_name                    | standard_length
--------------|---------------------------------|----------------
15            | Small Rail Nut                  | 20
29            | Mid Clamp (M+)                  | 50
47            | External Long Rail Jointer      | 150
100           | Unified U Cleat                 | 40
110           | 30mm End Clamp_Type 2          | 50
```

## Frontend Impact

After this update, the frontend code in `bomCalculations.js` will automatically use these values:

```javascript
// This already uses standard_length from the database
{
  ...
  length: item.length,  // Will now show 40, 150, 50, 50, 20 respectively
  ...
}
```

No frontend code changes needed - it already reads from `profile.standardLength`.

## Testing

After implementation:
1. Create a new BOM
2. Check the "Length (mm)" column for:
   - Unified U Cleat → Should show **40**
   - External Long Rail Jointer → Should show **150**
   - 30mm End Clamp_Type 2 → Should show **50**
   - Mid Clamp (M+) → Should show **50**
   - Small Rail Nut → Should show **20**

## Additional Items (Optional)

If other items in the database also need standard lengths, add them to the update script following the same pattern.

To find items with NULL standard_length:
```sql
SELECT serial_number, sunrack_code, generic_name, standard_length
FROM bom_master_items
WHERE standard_length IS NULL;
```

## Notes

- The `standard_length` column is in millimeters (mm)
- This affects ONLY the "Length (mm)" column in the BOM table
- It does NOT affect cut length calculations (those are dynamic)
- This is a **data fix**, not a code change

## Status
- [x] Create update script
- [ ] Run update script
- [ ] Verify in database
- [ ] Test BOM generation
- [ ] Confirm length column displays correctly

---

**Created**: 2025-12-13
**Priority**: Medium
**Category**: Data Fix
