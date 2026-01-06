const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n========================================');
  console.log('  STEP 10: Correct SDS Formula Key');
  console.log('========================================\n');

  const oldKey = 'SDS_4_2X13MM';
  const newKey = 'SDS_4_2X19MM';

  // 1. Update the Formula Definition
  const formula = await prisma.bomFormula.findFirst({
    where: { formulaKey: oldKey }
  });

  if (formula) {
    await prisma.bomFormula.update({
      where: { id: formula.id },
      data: { formulaKey: newKey }
    });
    console.log(`✅ Updated Formula: ${oldKey} -> ${newKey}`);
  } else {
    // If old formula not found, check if new one exists or create it
    const newFormula = await prisma.bomFormula.findFirst({
        where: { formulaKey: newKey }
    });
    
    if (newFormula) {
        console.log(`ℹ️ Formula ${newKey} already exists.`);
    } else {
        // Find the fastener
        const fastener = await prisma.fastener.findFirst({
            where: {
                genericName: { contains: 'Self Drilling Screw -  4.2X19mm' }
            }
        });

        if (fastener) {
             await prisma.bomFormula.create({
                data: {
                  fastenerId: fastener.id,
                  formulaKey: newKey,
                  formulaDescription: `Formula for ${fastener.genericName}`,
                  calculationLevel: 5,
                  isActive: true
                }
              });
             console.log(`✅ Created Formula: ${newKey}`);
        } else {
             console.error('❌ Could not find fastener for 4.2x19mm SDS to create formula');
        }
    }
  }

  // 2. Update Variation Items that use this formula
  const updateResult = await prisma.bomVariationItem.updateMany({
    where: { formulaKey: oldKey },
    data: { formulaKey: newKey }
  });

  console.log(`✅ Updated ${updateResult.count} Variation Items to use new key`);
  
  // 3. Check for the missing 4.8mm SDS
  const sds48Key = 'SDS_4_8X19MM';
  
  // Ensure formula exists
  const formula48 = await prisma.bomFormula.findFirst({
      where: { formulaKey: sds48Key }
  });
  
  if (!formula48) {
       console.log(`⚠️ Formula ${sds48Key} missing! Creating it...`);
       const fastener48 = await prisma.fastener.findFirst({
          where: {
              genericName: { contains: 'Self Drilling Screw -  4.8X19mm' }
          }
      });
      
      if (fastener48) {
           await prisma.bomFormula.create({
              data: {
                fastenerId: fastener48.id,
                formulaKey: sds48Key,
                formulaDescription: `Formula for ${fastener48.genericName}`,
                calculationLevel: 5,
                isActive: true
              }
            });
           console.log(`✅ Created Formula: ${sds48Key}`);
      } else {
           console.error('❌ Could not find fastener for 4.8x19mm SDS');
      }
  } else {
      console.log(`✓ Formula ${sds48Key} exists.`);
  }

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
