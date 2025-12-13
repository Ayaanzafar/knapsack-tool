// Update formulas to match items that have images
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateFormulas() {
  console.log('🔧 Updating formula mappings to match items with images...\n');

  try {
    // Clear existing formulas
    await prisma.bomFormula.deleteMany({});

    // Create NEW formula mappings that match the items with images
    const formulas = [
      {
        itemSerialNumber: '100',  // Unified U Cleat (MA 110)
        formulaKey: 'U_CLEAT',
        formulaDescription: 'sb1 + sb2',
        calculationLevel: 2,
        isActive: true
      },
      {
        itemSerialNumber: '47',  // External Long Rail Jointer (MA 72)
        formulaKey: 'RAIL_JOINTER',
        formulaDescription: 'totalJoints',
        calculationLevel: 1,
        isActive: true
      },
      {
        itemSerialNumber: '99',  // 30mm End Clamp_V2 (MA 109) - Changed from 110
        formulaKey: 'END_CLAMP',
        formulaDescription: 'totalEndClamps',
        calculationLevel: 1,
        isActive: true
      },
      {
        itemSerialNumber: '19',  // Mid Clamp - 21mm Module Gap (MA 35) - Changed from 29
        formulaKey: 'MID_CLAMP',
        formulaDescription: 'totalMidClamps',
        calculationLevel: 1,
        isActive: true
      },
      {
        itemSerialNumber: '28',  // Hook Rail Nut (MA 46) - Changed from 15
        formulaKey: 'RAIL_NUTS',
        formulaDescription: 'END_CLAMP + MID_CLAMP',
        calculationLevel: 2,
        isActive: true
      }
    ];

    console.log('📝 Creating formula mappings:\n');

    for (const formula of formulas) {
      const created = await prisma.bomFormula.create({
        data: formula,
        include: {
          masterItem: {
            select: {
              genericName: true,
              rmCodes: {
                where: { vendorName: 'Regal' }
              }
            }
          }
        }
      });

      const rmCode = created.masterItem.rmCodes[0]?.code || 'N/A';
      console.log(`✅ ${formula.formulaKey.padEnd(15)} → Serial ${formula.itemSerialNumber.padEnd(4)} | RM: ${rmCode.padEnd(8)} | ${created.masterItem.genericName}`);
    }

    console.log('\n📊 Verification:\n');
    const allFormulas = await prisma.bomFormula.findMany({
      include: {
        masterItem: {
          select: {
            genericName: true,
            profileImagePath: true,
            rmCodes: {
              where: { vendorName: 'Regal' }
            }
          }
        }
      },
      orderBy: {
        calculationLevel: 'asc'
      }
    });

    allFormulas.forEach(f => {
      const rmCode = f.masterItem.rmCodes[0]?.code || 'N/A';
      const hasImage = f.masterItem.profileImagePath ? '✅' : '❌';
      console.log(`${hasImage} ${f.formulaKey.padEnd(15)} → RM: ${rmCode.padEnd(8)} | ${f.masterItem.genericName}`);
    });

    console.log(`\n✅ Successfully updated ${formulas.length} formula mappings!`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateFormulas()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
