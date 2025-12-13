// Verify which items have profile images set up
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
  console.log('Serial | RM Code    | Item Name                           | Image Path');
  console.log('-------|------------|-------------------------------------|------------------------------------------');

  items.forEach(item => {
    const rmCode = item.rmCodes[0]?.code || 'N/A';
    console.log(
      `${item.serialNumber.padEnd(6)} | ` +
      `${rmCode.padEnd(10)} | ` +
      `${item.genericName.padEnd(35)} | ` +
      `${item.profileImagePath}`
    );
  });

  console.log(`\nTotal: ${items.length} items with images configured\n`);

  await prisma.$disconnect();
}

verifyImages();
