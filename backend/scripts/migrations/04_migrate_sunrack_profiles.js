const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n========================================');
  console.log('  STEP 4: Migrating Sunrack Profiles Data');
  console.log('========================================\n');

  // Get all profiles from bom_master_items that have sunrackProfileId
  const profileItems = await prisma.bomMasterItem.findMany({
    where: {
      sunrackProfileId: { not: null }
    },
    include: {
      sunrackProfile: true
    }
  });

  console.log(`Found ${profileItems.length} profile items to migrate\n`);

  let successCount = 0;
  let errorCount = 0;

  // Update sunrack_profiles with missing data from bom_master_items
  for (const item of profileItems) {
    try {
      await prisma.sunrackProfile.update({
        where: { id: item.sunrackProfileId },
        data: {
          material: item.material,
          standardLength: item.standardLength,
          uom: item.uom,
          category: item.category
        }
      });

      successCount++;
      console.log(`✓ [${successCount}/${profileItems.length}] Updated: ${item.sunrackProfile.genericName}`);
      console.log(`  Material: ${item.material}, Length: ${item.standardLength}, UOM: ${item.uom}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed to update: ${item.sunrackProfile.genericName}`);
      console.error(`  Error: ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log('  Migration Summary');
  console.log('========================================');
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log(`Total: ${profileItems.length}`);
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
