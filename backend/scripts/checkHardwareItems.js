// Script to check hardware items in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkItems() {
  try {
    const items = await prisma.bomMasterItem.findMany({
      where: {
        sunrackCode: {
          in: ['MA-110', 'MA-72', 'MA-109', 'MA-35', 'MA-46']
        }
      },
      select: {
        sunrackCode: true,
        genericName: true,
        itemDescription: true
      },
      orderBy: {
        sunrackCode: 'asc'
      }
    });

    console.log('\n=== Database Hardware Items ===\n');
    items.forEach(item => {
      console.log(`Sunrack Code: ${item.sunrackCode}`);
      console.log(`Generic Name: ${item.genericName}`);
      console.log(`Item Description: ${item.itemDescription}`);
      console.log('---');
    });
    console.log('');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkItems();
