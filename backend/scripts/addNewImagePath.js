// Helper script to add image path for a new item
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
    console.log(`❌ No item found with RM Code: "${rmCode}" (Regal vendor)`);
    console.log('\nTip: Make sure the RM code matches exactly (including spaces)');
    console.log('Example: "MA 43" not "MA-43"');
    await prisma.$disconnect();
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

  console.log('\n✅ Successfully Updated:');
  console.log(`   Serial Number: ${updated.serialNumber}`);
  console.log(`   Item Name: ${updated.genericName}`);
  console.log(`   RM Code (Regal): ${rmCode}`);
  console.log(`   Image Path: ${imagePath}`);
  console.log('\n');

  await prisma.$disconnect();
}

// Usage: node scripts/addNewImagePath.js "MA 121" "/assets/bom-profiles/MA-121.png"
const rmCode = process.argv[2];
const imagePath = process.argv[3];

if (!rmCode || !imagePath) {
  console.log('\nUsage: node scripts/addNewImagePath.js "RM CODE" "/path/to/image.png"');
  console.log('\nExample: node scripts/addNewImagePath.js "MA 121" "/assets/bom-profiles/MA-121.png"');
  console.log('\nNote: RM code should have a SPACE (e.g., "MA 121" not "MA-121")');
  console.log('      Image path should have a HYPHEN (e.g., "/assets/bom-profiles/MA-121.png")');
  console.log('\n');
  process.exit(1);
}

addImagePath(rmCode, imagePath);
