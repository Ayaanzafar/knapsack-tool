// Helper script to find RM code for an item
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
    const imageFileName = rmCode.replace(/ /g, '-') + '.png';

    console.log('\n=== Item Found ===');
    console.log(`Item Name: ${item.genericName}`);
    console.log(`Serial Number: ${item.serialNumber}`);
    console.log(`RM Code (Regal): ${rmCode}`);
    console.log(`Image File Name: ${imageFileName}`);
    console.log(`Image Path: /assets/bom-profiles/${imageFileName}`);
    console.log('\n');
  } else {
    console.log(`❌ No item found matching: "${itemName}"`);
  }

  await prisma.$disconnect();
}

// Usage: node scripts/findRmCode.js "Unified U Cleat"
const itemName = process.argv[2] || '';

if (!itemName) {
  console.log('Usage: node scripts/findRmCode.js "Item Name"');
  console.log('Example: node scripts/findRmCode.js "Unified U Cleat"');
  process.exit(1);
}

findRmCode(itemName);
