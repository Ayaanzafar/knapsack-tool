// Script to list all sunrack codes in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listCodes() {
  try {
    const items = await prisma.bomMasterItem.findMany({
      select: {
        serialNumber: true,
        sunrackCode: true,
        genericName: true,
        itemDescription: true
      },
      orderBy: {
        serialNumber: 'asc'
      }
    });

    console.log('\n=== All BOM Master Items ===\n');
    items.forEach(item => {
      console.log(`Serial: ${item.serialNumber} | Sunrack: ${item.sunrackCode || 'NULL'} | Generic: ${item.genericName} | Desc: ${item.itemDescription}`);
    });
    console.log(`\nTotal: ${items.length} items`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listCodes();
