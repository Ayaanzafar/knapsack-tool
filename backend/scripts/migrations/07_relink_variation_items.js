const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapping of formula keys to fastener search patterns
const FORMULA_TO_FASTENER = {
  'M8x60_BOLT': { name: 'M8 Hex Head Fastener Set', length: 65 },
  'M8x20_BOLT': { name: 'M8 Allen Head Bolt with Spring Washer', length: 20 },
  'M8x25_BOLT': { name: 'M8 Allen Head Bolt with Spring Washer', length: 25 },
  'SDS_4_2X13MM': { name: 'Self Drilling Screw -  4.2X19mm - Hex Head', length: 19 },
  'SDS_4_8X19MM': { name: 'Self Drilling Screw -  4.8X19mm - Hex Head', length: 19 },
  'SDS_5_5X63MM': { name: 'Self Drilling Screw -  5.5X63mm - Hex Head', length: 63 },
  'SDS_6_3X63MM': { name: 'Self Drilling Screw -  6.3X63mm - Hex Head', length: 63 },
  'RUBBER_PAD': { name: 'Rubber Pad 40x40mm for U- cleat', length: 40 },
  'M8_BOLT_PLAIN_SPRING': { name: 'M8 Allen Head Bolt with Plain & Spring Washer', length: 16 },
  'M8_GRUB_SCREW': { name: 'M8 Grub Screw', length: 20 },
  // Removed items
  'M8_HEX_NUTS': null,
  'M8_PLAIN_WASHER': null,
  'M8_SPRING_WASHER': null,
  'BLIND_RIVETS': null
};

async function main() {
  console.log('\n========================================');
  console.log('  STEP 7: Re-link Variation Items to New Fasteners');
  console.log('========================================\n');

  // Get all variation items that were linked to old fasteners
  const variationItems = await prisma.bomVariationItem.findMany({
    where: {
      masterItemId: { not: null },
      fastenerId: null, // Not yet linked to new fasteners
      masterItem: {
        sunrackProfileId: null // Was a fastener in old table
      }
    },
    include: {
      masterItem: true,
      template: { select: { variationName: true } }
    }
  });

  console.log(`Found ${variationItems.length} variation items to re-link\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const item of variationItems) {
    try {
      const formulaKey = item.formulaKey;
      const fastenerInfo = FORMULA_TO_FASTENER[formulaKey];

      if (!fastenerInfo) {
        console.log(`⊘ Skipping (removed): ${item.template.variationName.substring(0, 30)}... → ${formulaKey}`);
        skippedCount++;
        continue;
      }

      // Find fastener by name and length
      const fastener = await prisma.fastener.findFirst({
        where: {
          genericName: { contains: fastenerInfo.name },
          standardLength: fastenerInfo.length
        }
      });

      if (fastener) {
        await prisma.bomVariationItem.update({
          where: { id: item.id },
          data: { fastenerId: fastener.id }
        });
        successCount++;
        console.log(`✓ ${item.template.variationName.substring(0, 30)}... → ${fastener.genericName}`);
      } else {
        errorCount++;
        console.error(`✗ No fastener found for: ${formulaKey} (${fastenerInfo.name} - ${fastenerInfo.length}mm)`);
      }
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed: ${item.id} - ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log('  Re-link Summary');
  console.log('========================================');
  console.log(`✓ Success: ${successCount}`);
  console.log(`⊘ Skipped: ${skippedCount}`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log(`Total: ${variationItems.length}`);
  console.log('========================================\n');

  if (errorCount > 0) {
    throw new Error(`Re-linking completed with ${errorCount} errors`);
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Re-linking failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
