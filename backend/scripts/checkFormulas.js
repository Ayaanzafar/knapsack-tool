const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all formulas
  const formulas = await prisma.bomFormula.findMany({
    include: {
      masterItem: {
        select: {
          serialNumber: true,
          genericName: true,
          sunrackProfileId: true,
          category: true
        }
      }
    }
  });

  console.log('\n=== ALL FORMULAS (Total: ' + formulas.length + ') ===');

  const profileFormulas = formulas.filter(f => f.masterItem.sunrackProfileId !== null);
  const fastenerFormulas = formulas.filter(f => f.masterItem.sunrackProfileId === null);

  console.log('\nProfile Formulas:', profileFormulas.length);
  console.log('Fastener Formulas:', fastenerFormulas.length);

  console.log('\n=== PROFILE FORMULAS ===');
  const profileFormatted = profileFormulas.map(f => ({
    serialNo: f.masterItem.serialNumber,
    itemName: f.masterItem.genericName,
    formulaKey: f.formulaKey,
    calcLevel: f.calculationLevel
  }));
  console.table(profileFormatted);

  console.log('\n=== FASTENER FORMULAS ===');
  const fastenerFormatted = fastenerFormulas.map(f => ({
    serialNo: f.masterItem.serialNumber,
    itemName: f.masterItem.genericName,
    formulaKey: f.formulaKey,
    calcLevel: f.calculationLevel
  }));
  console.table(fastenerFormatted);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
