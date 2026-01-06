const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapping of old master item generic names to new fastener generic names
const FASTENER_NAME_MAPPING = {
  'M8 Hex Head Fastener Set': 'M8 Hex Head Fastener Set', // 65mm version
  'M8 Allen Head Bolt with Spring Washer': 'M8 Allen Head Bolt with Spring Washer', // Could be 20mm or 25mm
  'M8 Hex Nuts': null, // REMOVED - not in Excel
  'M8 Plain Washer': null, // REMOVED - not in Excel
  'M8 Spring Washer': null, // REMOVED - not in Excel
  'Self Drilling Screw - 4.2X19mm - Hex Head': 'Self Drilling Screw -  4.2X19mm - Hex Head',
  'Self Drilling Screw - 5.5X63mm - Hex Head': 'Self Drilling Screw -  5.5X63mm - Hex Head',
  'Rubber Pad 40x40mm for U- cleat': 'Rubber Pad 40x40mm for U- cleat',
  'Blind Rivets 4.5x15mm': null, // REMOVED - not in Excel
  'Self Drilling Screw - 4.8X19mm - Hex Head': 'Self Drilling Screw -  4.8X19mm - Hex Head',
  'M8 Allen Head Bolt with Plain & Spring Washer': 'M8 Allen Head Bolt with Plain & Spring Washer',
  'M8 Grub Screw': 'M8 Grub Screw'
};

async function main() {
  console.log('\n========================================');
  console.log('  STEP 6: Re-link Formulas to New Fasteners');
  console.log('========================================\n');

  // Get all formulas that were linked to old bom_master_items fasteners
  const formulas = await prisma.bomFormula.findMany({
    where: {
      itemSerialNumber: { not: null },
      fastenerId: null, // Not yet linked to new fasteners
      masterItem: {
        sunrackProfileId: null // Was a fastener in old table
      }
    },
    include: {
      masterItem: true
    }
  });

  console.log(`Found ${formulas.length} formulas to re-link\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const formula of formulas) {
    try {
      const oldName = formula.masterItem.genericName;
      const newName = FASTENER_NAME_MAPPING[oldName];

      if (!newName) {
        console.log(`⊘ Skipping (removed): ${formula.formulaKey} → ${oldName}`);
        skippedCount++;
        continue;
      }

      // Find fastener by name
      // For M8 Allen Head Bolt, need to match by length from old data
      let fastener;
      if (oldName.includes('M8 Allen Head Bolt with Spring Washer')) {
        const oldLength = formula.masterItem.standardLength;
        fastener = await prisma.fastener.findFirst({
          where: {
            genericName: { contains: 'M8 Allen Head Bolt with Spring Washer' },
            standardLength: oldLength
          }
        });
      } else {
        fastener = await prisma.fastener.findFirst({
          where: {
            OR: [
              { genericName: newName },
              { genericName: { contains: newName.substring(0, 20) } }
            ]
          }
        });
      }

      if (fastener) {
        await prisma.bomFormula.update({
          where: { id: formula.id },
          data: { fastenerId: fastener.id }
        });
        successCount++;
        console.log(`✓ ${formula.formulaKey} → ${fastener.genericName} (ID: ${fastener.id})`);
      } else {
        errorCount++;
        console.error(`✗ No fastener found for: ${formula.formulaKey} → ${newName}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed: ${formula.formulaKey} - ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log('  Re-link Summary');
  console.log('========================================');
  console.log(`✓ Success: ${successCount}`);
  console.log(`⊘ Skipped: ${skippedCount}`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log(`Total: ${formulas.length}`);
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
