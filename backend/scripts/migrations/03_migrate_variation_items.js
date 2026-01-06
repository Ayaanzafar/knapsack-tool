const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n========================================');
  console.log('  STEP 3: Migrating Variation Item Links');
  console.log('========================================\n');

  const variationItems = await prisma.bomVariationItem.findMany({
    include: {
      masterItem: true,
      template: {
        select: { variationName: true }
      }
    }
  });

  console.log(`Found ${variationItems.length} variation items to migrate\n`);

  let profileItems = 0;
  let fastenerItems = 0;
  let errorCount = 0;

  for (const item of variationItems) {
    try {
      if (item.masterItem.sunrackProfileId !== null) {
        // Profile item - link to sunrack_profiles
        await prisma.bomVariationItem.update({
          where: { id: item.id },
          data: {
            sunrackProfileId: item.masterItem.sunrackProfileId
          }
        });
        profileItems++;
        console.log(`✓ Profile: ${item.template.variationName.substring(0, 30)}... → ${item.masterItem.genericName.substring(0, 30)}`);
      } else {
        // Fastener item - link to fasteners table
        const fastener = await prisma.fastener.findUnique({
          where: { oldSerialNumber: item.masterItem.serialNumber }
        });

        if (fastener) {
          await prisma.bomVariationItem.update({
            where: { id: item.id },
            data: {
              fastenerId: fastener.id
            }
          });
          fastenerItems++;
          console.log(`✓ Fastener: ${item.template.variationName.substring(0, 30)}... → ${fastener.genericName.substring(0, 30)}`);
        } else {
          errorCount++;
          console.error(`✗ Fastener not found: ${item.masterItem.serialNumber}`);
        }
      }
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed to migrate item: ${item.id}`);
      console.error(`  Error: ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log('  Migration Summary');
  console.log('========================================');
  console.log(`✓ Profile items: ${profileItems}`);
  console.log(`✓ Fastener items: ${fastenerItems}`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log(`Total: ${variationItems.length}`);
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
