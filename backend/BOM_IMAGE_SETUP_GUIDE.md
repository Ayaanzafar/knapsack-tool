# BOM Profile Image Setup Guide

## How to Add Profile Images for BOM Items

---

## Step 1: Determine the Image File Name

### Rule: Image file names MUST match the RM Code (Regal vendor)

**Format:** `{RM_CODE}.png`

**Important:** Replace spaces with hyphens (-)

### Examples:
| RM Code (Regal) | Image File Name |
|-----------------|-----------------|
| MA 43 | `MA-43.png` |
| MA 110 | `MA-110.png` |
| MA 35 | `MA-35.png` |
| MA 47 | `MA-47.png` |
| SRC 100 | `SRC-100.png` |
| ABC 25 | `ABC-25.png` |

**Note:** The hyphen replaces the space in the RM code.

---

## Step 2: Find the RM Code for Your Item

### Option A: Check Database Directly

Run this script to find RM codes:

```bash
cd backend
node scripts/checkRmCodes.js
```

### Option B: Query Database

```sql
SELECT
  bmi.serial_number,
  bmi.generic_name,
  rc.code as rm_code
FROM bom_master_items bmi
LEFT JOIN rm_codes rc ON rc.item_serial_number = bmi.serial_number
WHERE rc.vendor_name = 'Regal'
ORDER BY bmi.serial_number;
```

### Option C: Use Helper Script

Create a script to check a specific item:

```javascript
// backend/scripts/findRmCode.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findRmCode(itemName) {
  const item = await prisma.bomMasterItem.findFirst({
    where: {
      genericName: {
        contains: itemName
      }
    },
    include: {
      rmCodes: {
        where: { vendorName: 'Regal' }
      }
    }
  });

  if (item) {
    const rmCode = item.rmCodes[0]?.code || 'No RM Code';
    console.log(`Item: ${item.genericName}`);
    console.log(`Serial Number: ${item.serialNumber}`);
    console.log(`RM Code (Regal): ${rmCode}`);
    console.log(`Image File Name: ${rmCode.replace(' ', '-')}.png`);
  } else {
    console.log('Item not found');
  }

  await prisma.$disconnect();
}

// Usage: node scripts/findRmCode.js
const itemName = process.argv[2] || 'Unified U Cleat';
findRmCode(itemName);
```

**Usage:**
```bash
cd backend
node scripts/findRmCode.js "Unified U Cleat"
```

---

## Step 3: Save the Image File

### Location:
```
D:\react\knapsack-tool\knapsack-front\public\assets\bom-profiles\
```

### File Requirements:
- **Format:** PNG (recommended)
- **File Name:** Match RM code with hyphen (e.g., `MA-43.png`)
- **Size:** Recommended 200x200px or similar
- **Background:** Transparent preferred

### Example:
If you have an item with RM Code **"MA 121"**:
1. Save image as: `MA-121.png`
2. Place in: `D:\react\knapsack-tool\knapsack-front\public\assets\bom-profiles\MA-121.png`

---

## Step 4: Update Database with Image Path

### Option A: Use Update Script (Recommended)

Create and run this script:

```javascript
// backend/scripts/addNewImagePath.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addImagePath(rmCode, imagePath) {
  // Find item by RM code (Regal vendor)
  const rmCodeEntry = await prisma.rmCode.findFirst({
    where: {
      code: rmCode,
      vendorName: 'Regal'
    }
  });

  if (!rmCodeEntry) {
    console.log(`❌ No item found with RM Code: ${rmCode}`);
    return;
  }

  // Update the item's image path
  const updated = await prisma.bomMasterItem.update({
    where: {
      serialNumber: rmCodeEntry.itemSerialNumber
    },
    data: {
      profileImagePath: imagePath
    },
    include: {
      rmCodes: {
        where: { vendorName: 'Regal' }
      }
    }
  });

  console.log(`✅ Updated:`);
  console.log(`   Serial Number: ${updated.serialNumber}`);
  console.log(`   Item: ${updated.genericName}`);
  console.log(`   RM Code: ${rmCode}`);
  console.log(`   Image Path: ${imagePath}`);

  await prisma.$disconnect();
}

// Usage: node scripts/addNewImagePath.js "MA 121" "/assets/bom-profiles/MA-121.png"
const rmCode = process.argv[2];
const imagePath = process.argv[3];

if (!rmCode || !imagePath) {
  console.log('Usage: node addNewImagePath.js "RM CODE" "/path/to/image.png"');
  console.log('Example: node addNewImagePath.js "MA 121" "/assets/bom-profiles/MA-121.png"');
  process.exit(1);
}

addImagePath(rmCode, imagePath);
```

**Usage:**
```bash
cd backend
node scripts/addNewImagePath.js "MA 121" "/assets/bom-profiles/MA-121.png"
```

### Option B: Direct SQL Update

```sql
-- Find the serial number first
SELECT
  bmi.serial_number,
  bmi.generic_name,
  rc.code
FROM bom_master_items bmi
JOIN rm_codes rc ON rc.item_serial_number = bmi.serial_number
WHERE rc.code = 'MA 121' AND rc.vendor_name = 'Regal';

-- Update the image path (replace SERIAL_NUMBER with actual value)
UPDATE bom_master_items
SET profile_image_path = '/assets/bom-profiles/MA-121.png'
WHERE serial_number = 'SERIAL_NUMBER';
```

---

## Step 5: Verify the Setup

### Check if Image Path is Set:

```bash
cd backend
node scripts/checkImagePaths.js
```

Or create a verification script:

```javascript
// backend/scripts/verifyImageSetup.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyImages() {
  const items = await prisma.bomMasterItem.findMany({
    where: {
      profileImagePath: {
        not: null
      }
    },
    include: {
      rmCodes: {
        where: { vendorName: 'Regal' }
      }
    },
    orderBy: {
      serialNumber: 'asc'
    }
  });

  console.log('\n=== Items with Profile Images ===\n');
  items.forEach(item => {
    const rmCode = item.rmCodes[0]?.code || 'N/A';
    console.log(`RM Code: ${rmCode.padEnd(10)} | ${item.genericName.padEnd(35)} | ${item.profileImagePath}`);
  });

  console.log(`\nTotal: ${items.length} items with images`);

  await prisma.$disconnect();
}

verifyImages();
```

**Run:**
```bash
cd backend
node scripts/verifyImageSetup.js
```

---

## Complete Workflow Example

### Scenario: Adding image for "Mid Clamp (M+)" with RM Code "MA 47"

**Step 1:** Find RM Code
```bash
cd backend
node scripts/findRmCode.js "Mid Clamp"
# Output: RM Code (Regal): MA 47
# Image File Name: MA-47.png
```

**Step 2:** Prepare Image
- Rename your image file to: `MA-47.png`

**Step 3:** Save Image
- Copy to: `D:\react\knapsack-tool\knapsack-front\public\assets\bom-profiles\MA-47.png`

**Step 4:** Update Database
```bash
cd backend
node scripts/addNewImagePath.js "MA 47" "/assets/bom-profiles/MA-47.png"
```

**Step 5:** Verify
```bash
node scripts/verifyImageSetup.js
```

**Step 6:** Test
- Refresh your app
- Create a new BOM
- Verify that "Mid Clamp (M+)" shows the image

---

## Quick Reference

### File Naming Rules:
1. ✅ **Correct:** `MA-43.png` (hyphen, lowercase extension)
2. ❌ **Wrong:** `MA 43.png` (space)
3. ❌ **Wrong:** `MA-43.PNG` (uppercase extension)
4. ❌ **Wrong:** `ma-43.png` (lowercase code - should match case in DB)

### Image Path Format:
```
/assets/bom-profiles/{RM_CODE}.png
```

**Examples:**
- `/assets/bom-profiles/MA-43.png`
- `/assets/bom-profiles/MA-110.png`
- `/assets/bom-profiles/SRC-100.png`

---

## Troubleshooting

### Image Not Showing in BOM?

**Check 1:** Verify file exists
```bash
dir "D:\react\knapsack-tool\knapsack-front\public\assets\bom-profiles\MA-47.png"
```

**Check 2:** Verify database has correct path
```bash
cd backend
node scripts/checkImagePaths.js
```

**Check 3:** Verify RM Code matches filename
- Database RM Code: `MA 47` (with space)
- File name: `MA-47.png` (with hyphen)

**Check 4:** Clear browser cache
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

**Check 5:** Check console for errors
- Open browser DevTools (F12)
- Look for 404 errors on image files

---

## Batch Adding Multiple Images

If you need to add many images at once:

```javascript
// backend/scripts/batchAddImages.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function batchAddImages() {
  const imageMappings = [
    { rmCode: 'MA 47', imagePath: '/assets/bom-profiles/MA-47.png' },
    { rmCode: 'MA 29', imagePath: '/assets/bom-profiles/MA-29.png' },
    { rmCode: 'MA 121', imagePath: '/assets/bom-profiles/MA-121.png' },
    // Add more mappings here...
  ];

  for (const mapping of imageMappings) {
    const rmCodeEntry = await prisma.rmCode.findFirst({
      where: {
        code: mapping.rmCode,
        vendorName: 'Regal'
      }
    });

    if (rmCodeEntry) {
      await prisma.bomMasterItem.update({
        where: { serialNumber: rmCodeEntry.itemSerialNumber },
        data: { profileImagePath: mapping.imagePath }
      });
      console.log(`✅ Updated RM Code: ${mapping.rmCode}`);
    } else {
      console.log(`❌ Not found: ${mapping.rmCode}`);
    }
  }

  await prisma.$disconnect();
}

batchAddImages();
```

---

## Summary Checklist

When adding a new profile image:

- [ ] Find the RM Code (Regal vendor) for your item
- [ ] Name image file: `{RM_CODE}.png` (replace space with hyphen)
- [ ] Save to: `knapsack-front/public/assets/bom-profiles/`
- [ ] Update database with image path: `/assets/bom-profiles/{RM_CODE}.png`
- [ ] Verify with verification script
- [ ] Test by creating a BOM

---

**Last Updated:** 2025-12-14
**Maintained By:** Development Team


#================================================

Perfect! ✅ I've created a comprehensive guide and helper scripts for adding BOM profile images in the future.

  Created Files:

  1. 📖 Complete Guide

  File: backend/BOM_IMAGE_SETUP_GUIDE.md

  Contains:
  - Image file naming rules
  - How to find RM codes
  - Where to save images
  - How to update database
  - Complete workflow examples
  - Troubleshooting tips

  2. 🛠️ Helper Scripts

  A. Find RM Code for an Item

  File: backend/scripts/findRmCode.js

  Usage:
  cd backend
  node scripts/findRmCode.js "Unified U Cleat"

  Output:
  Item Name: Unified U Cleat
  Serial Number: 100
  RM Code (Regal): MA 110
  Image File Name: MA-110.png
  Image Path: /assets/bom-profiles/MA-110.png

  B. Add Image Path to Database

  File: backend/scripts/addNewImagePath.js

  Usage:
  cd backend
  node scripts/addNewImagePath.js "MA 47" "/assets/bom-profiles/MA-47.png"

  C. Verify All Image Setups

  File: backend/scripts/verifyImageSetup.js

  Usage:
  cd backend
  node scripts/verifyImageSetup.js

  ---
  Quick Reference:

  To Add a New Image:

  1. Find RM Code:
  node scripts/findRmCode.js "Item Name"
  2. Name Image File:
    - RM Code: MA 47 → File Name: MA-47.png
    - (Replace space with hyphen)
  3. Save Image:
    - Location: knapsack-front/public/assets/bom-profiles/MA-47.png
  4. Update Database:
  node scripts/addNewImagePath.js "MA 47" "/assets/bom-profiles/MA-47.png"
  5. Verify:
  node scripts/verifyImageSetup.js

  ---
  All documentation and scripts are ready to use! Check the BOM_IMAGE_SETUP_GUIDE.md file for complete details.