// Script to check formula mappings in bom_formulas table
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFormulas() {
  try {
    const formulas = await prisma.bomFormula.findMany({
      include: {
        masterItem: {
          select: {
            serialNumber: true,
            sunrackCode: true,
            genericName: true,
            itemDescription: true,
            material: true,
            standardLength: true,
            uom: true
          }
        }
      },
      orderBy: {
        formulaKey: 'asc'
      }
    });

    console.log('\n=== Formula Mappings ===\n');
    formulas.forEach(formula => {
      console.log(`Formula Key: ${formula.formulaKey}`);
      console.log(`  → Item Serial: ${formula.itemSerialNumber}`);
      console.log(`  → Sunrack Code: ${formula.masterItem.sunrackCode}`);
      console.log(`  → Generic Name: ${formula.masterItem.genericName}`);
      console.log(`  → Material: ${formula.masterItem.material}`);
      console.log(`  → Length: ${formula.masterItem.standardLength}`);
      console.log(`  → UoM: ${formula.masterItem.uom}`);
      console.log('---');
    });
    console.log(`\nTotal formulas: ${formulas.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFormulas();
