const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findCorrectMappings() {
  // Image files you have
  const imageFiles = [
    'MA-43.png',
    'MA-110.png',
    'MA-72.png',
    'MA-109.png',
    'MA-35.png',
    'MA-46.png'
  ];

  console.log('\n=== Finding Correct Image Mappings ===\n');

  for (const imageFile of imageFiles) {
    // Extract RM code from filename (e.g., "MA-43.png" -> "MA 43")
    const rmCode = imageFile.replace('.png', '').replace('-', ' ');

    // Find the item with this RM code for Regal vendor
    const rmCodeEntry = await prisma.rmCode.findFirst({
      where: {
        code: rmCode,
        vendorName: 'Regal'
      },
      include: {
        masterItem: {
          select: {
            serialNumber: true,
            genericName: true,
            sunrackCode: true
          }
        }
      }
    });

    if (rmCodeEntry) {
      console.log(`Image: ${imageFile.padEnd(15)} → RM Code: ${rmCode.padEnd(10)} → Serial: ${rmCodeEntry.itemSerialNumber.padEnd(4)} → ${rmCodeEntry.masterItem.genericName}`);
    } else {
      console.log(`Image: ${imageFile.padEnd(15)} → RM Code: ${rmCode.padEnd(10)} → ❌ NOT FOUND in rm_codes table`);
    }
  }

  await prisma.$disconnect();
}

findCorrectMappings();
