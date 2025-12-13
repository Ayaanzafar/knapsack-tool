// Script to check vendor names in bom_master_items table
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVendors() {
  try {
    const items = await prisma.bomMasterItem.groupBy({
      by: ['selectedRmVendor'],
      _count: {
        selectedRmVendor: true
      }
    });

    console.log('\nCurrent selectedRmVendor values in bom_master_items:');
    console.log('================================================');
    items.forEach(i => {
      console.log(`${i.selectedRmVendor || 'NULL'} : ${i._count.selectedRmVendor} records`);
    });
    console.log('');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVendors();
