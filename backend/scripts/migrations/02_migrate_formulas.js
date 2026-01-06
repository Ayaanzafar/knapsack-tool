const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n========================================');
  console.log('  STEP 2: Migrating Formula Links');
  console.log('========================================\n');

  const formulas = await prisma.bomFormula.findMany({
    include: {
      masterItem: true
    }
  });

  console.log(`Found ${formulas.length} formulas to migrate\n`);

  let profileFormulas = 0;
  let fastenerFormulas = 0;
  let errorCount = 0;

  for (const formula of formulas) {
    try {
      if (formula.masterItem.sunrackProfileId !== null) {
        // Profile formula - link to sunrack_profiles
        await prisma.bomFormula.update({
          where: { id: formula.id },
          data: {
            sunrackProfileId: formula.masterItem.sunrackProfileId
          }
        });
        profileFormulas++;
        console.log(`✓ Profile formula: ${formula.formulaKey} → sunrack_profile_id: ${formula.masterItem.sunrackProfileId}`);
      } else {
        // Fastener formula - link to fasteners table
        const fastener = await prisma.fastener.findUnique({
          where: { oldSerialNumber: formula.masterItem.serialNumber }
        });

        if (fastener) {
          await prisma.bomFormula.update({
            where: { id: formula.id },
            data: {
              fastenerId: fastener.id
            }
          });
          fastenerFormulas++;
          console.log(`✓ Fastener formula: ${formula.formulaKey} → fastener_id: ${fastener.id}`);
        } else {
          errorCount++;
          console.error(`✗ Fastener not found for formula: ${formula.formulaKey} (serial: ${formula.masterItem.serialNumber})`);
        }
      }
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed to migrate formula: ${formula.formulaKey}`);
      console.error(`  Error: ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log('  Migration Summary');
  console.log('========================================');
  console.log(`✓ Profile formulas: ${profileFormulas}`);
  console.log(`✓ Fastener formulas: ${fastenerFormulas}`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log(`Total: ${formulas.length}`);
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
