const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get sample items
  const items = await prisma.bomMasterItem.findMany({
    take: 20,
    select: {
      id: true,
      serialNumber: true,
      genericName: true,
      sunrackProfileId: true,
      itemType: true,
      category: true
    }
  });

  console.log('\n=== SAMPLE BOM MASTER ITEMS ===');
  console.table(items);

  // Get counts
  const total = await prisma.bomMasterItem.count();
  const withProfile = await prisma.bomMasterItem.count({
    where: { sunrackProfileId: { not: null } }
  });
  const withoutProfile = await prisma.bomMasterItem.count({
    where: { sunrackProfileId: null }
  });

  console.log('\n=== STATISTICS ===');
  console.log('Total items:', total);
  console.log('Items with sunrackProfileId (profiles):', withProfile);
  console.log('Items without sunrackProfileId (fasteners):', withoutProfile);

  // Get fastener examples
  const fasteners = await prisma.bomMasterItem.findMany({
    where: { sunrackProfileId: null },
    take: 10,
    select: {
      serialNumber: true,
      genericName: true,
      designWeight: true,
      uom: true,
      category: true
    }
  });

  console.log('\n=== FASTENER EXAMPLES ===');
  console.table(fasteners);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
