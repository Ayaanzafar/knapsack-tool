const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n========================================');
  console.log('  STEP 1: Migrating Fasteners');
  console.log('========================================\n');

  // Get all fasteners from bom_master_items
  const fasteners = await prisma.bomMasterItem.findMany({
    where: {
      sunrackProfileId: null
    },
    orderBy: {
      id: 'asc'
    }
  });

  console.log(`Found ${fasteners.length} fasteners to migrate\n`);

  if (fasteners.length === 0) {
    console.log('⚠️  No fasteners found to migrate');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  // Insert into new fasteners table
  for (const fastener of fasteners) {
    try {
      const newFastener = await prisma.fastener.create({
        data: {
          oldSerialNumber: fastener.serialNumber,
          itemDescription: fastener.itemDescription,
          genericName: fastener.genericName,
          material: fastener.material,
          standardLength: fastener.standardLength,
          uom: fastener.uom,
          category: fastener.category,
          costPerPiece: fastener.costPerPiece,
          profileImagePath: fastener.profileImagePath,
          isActive: fastener.isActive
        }
      });

      successCount++;
      console.log(`✓ [${successCount}/${fasteners.length}] Migrated: ${fastener.genericName}`);
      console.log(`  Old Serial: ${fastener.serialNumber} → New ID: ${newFastener.id}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed to migrate: ${fastener.genericName}`);
      console.error(`  Error: ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log('  Migration Summary');
  console.log('========================================');
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log(`Total: ${fasteners.length}`);
  console.log('========================================\n');

  if (errorCount > 0) {
    throw new Error(`Migration completed with ${errorCount} errors`);
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
