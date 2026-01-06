const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fastener formulas based on the system requirements
const FASTENER_FORMULAS = [
  { fastenerName: 'M8 Hex Head Fastener Set', length: 65, formulaKey: 'M8x60_BOLT', calculationLevel: 3 },
  { fastenerName: 'M8 Hex Head Fastener Set', length: 60, formulaKey: 'M8x60_BOLT_SHORT', calculationLevel: 3 },
  { fastenerName: 'M8  Allen Head Bolt with Spring Washer', length: 20, formulaKey: 'M8x20_BOLT', calculationLevel: 3 }, // Note: TWO spaces
  { fastenerName: 'M8 Allen Head Bolt with Spring Washer', length: 25, formulaKey: 'M8x25_BOLT', calculationLevel: 3 },
  { fastenerName: 'Self Drilling Screw -  4.2X19mm - Hex Head', length: 19, formulaKey: 'SDS_4_2X19MM', calculationLevel: 5 },
  { fastenerName: 'Self Drilling Screw -  4.8X19mm - Hex Head', length: 19, formulaKey: 'SDS_4_8X19MM', calculationLevel: 5 },
  { fastenerName: 'Self Drilling Screw -  5.5X63mm - Hex Head', length: 63, formulaKey: 'SDS_5_5X63MM', calculationLevel: 5 },
  { fastenerName: 'Self Drilling Screw -  6.3X63mm - Hex Head', length: 63, formulaKey: 'SDS_6_3X63MM', calculationLevel: 5 },
  { fastenerName: 'Rubber Pad 40x40mm for U- cleat', length: 40, formulaKey: 'RUBBER_PAD', calculationLevel: 5 },
  { fastenerName: 'M8 Allen Head Bolt with Plain & Spring Washer', length: 16, formulaKey: 'M8_BOLT_PLAIN_SPRING', calculationLevel: 3 },
  { fastenerName: 'M8 Grub Screw', length: 20, formulaKey: 'M8_GRUB_SCREW', calculationLevel: 3 }
];

async function main() {
  console.log('\n========================================');
  console.log('  STEP 8: Recreate Fastener Formulas');
  console.log('========================================\n');

  let successCount = 0;
  let errorCount = 0;

  for (const formulaSpec of FASTENER_FORMULAS) {
    try {
      // Find the fastener
      const fastener = await prisma.fastener.findFirst({
        where: {
          genericName: { contains: formulaSpec.fastenerName },
          standardLength: formulaSpec.length
        }
      });

      if (!fastener) {
        console.error(`✗ Fastener not found: ${formulaSpec.fastenerName} (${formulaSpec.length}mm)`);
        errorCount++;
        continue;
      }

      // Check if formula already exists
      const existing = await prisma.bomFormula.findFirst({
        where: {
          fastenerId: fastener.id,
          formulaKey: formulaSpec.formulaKey
        }
      });

      if (existing) {
        console.log(`⊙ Already exists: ${formulaSpec.formulaKey}`);
        continue;
      }

      // Create the formula
      await prisma.bomFormula.create({
        data: {
          fastenerId: fastener.id,
          formulaKey: formulaSpec.formulaKey,
          formulaDescription: `Formula for ${fastener.genericName}`,
          calculationLevel: formulaSpec.calculationLevel,
          isActive: true
        }
      });

      successCount++;
      console.log(`✓ Created: ${formulaSpec.formulaKey} → ${fastener.genericName} (ID: ${fastener.id})`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed: ${formulaSpec.formulaKey} - ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log('  Summary');
  console.log('========================================');
  console.log(`✓ Created: ${successCount}`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log(`Total: ${FASTENER_FORMULAS.length}`);
  console.log('========================================\n');

  if (errorCount > 0) {
    throw new Error(`Recreation completed with ${errorCount} errors`);
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Recreation failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
