const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFYING BOM DATA ===\n');

  // Count total items
  const totalItems = await prisma.bomMasterItem.count();
  console.log(`✓ Total BOM items: ${totalItems}`);

  // Count total RM codes
  const totalRmCodes = await prisma.rmCode.count();
  console.log(`✓ Total RM codes: ${totalRmCodes}`);

  // Get first 3 items with their RM codes
  console.log('\n=== Sample Items ===\n');
  const items = await prisma.bomMasterItem.findMany({
    take: 3,
    include: {
      rmCodes: true
    },
    orderBy: {
      serialNumber: 'asc'
    }
  });

  items.forEach(item => {
    console.log(`Item ${item.serialNumber}:`);
    console.log(`  Generic Name: ${item.genericName}`);
    console.log(`  Design Weight: ${item.designWeight} kg`);
    console.log(`  Selected Vendor: ${item.selectedRmVendor}`);
    console.log(`  RM Codes:`);

    item.rmCodes.forEach(rm => {
      if (rm.code) {
        console.log(`    - ${rm.vendorName}: ${rm.code}`);
      }
    });
    console.log('');
  });

  console.log('✓ Verification completed!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
