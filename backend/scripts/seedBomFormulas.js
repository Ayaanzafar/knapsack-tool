// Script to seed bom_formulas table with formula mappings
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFormulas() {
  console.log('🌱 Seeding BOM formulas...\n');

  try {
    // Define formula mappings
    // Formula Key → Serial Number (from bom_master_items)
    const formulas = [
      {
        itemSerialNumber: '100',  // Unified U Cleat
        formulaKey: 'U_CLEAT',
        formulaDescription: 'sb1 + sb2',
        calculationLevel: 2,  // Dependent on Level 1 (sb1, sb2)
        isActive: true
      },
      {
        itemSerialNumber: '47',  // External Long Rail Jointer
        formulaKey: 'RAIL_JOINTER',
        formulaDescription: 'totalJoints',
        calculationLevel: 1,  // Direct from tab data
        isActive: true
      },
      {
        itemSerialNumber: '110',  // 30mm End Clamp_Type 2
        formulaKey: 'END_CLAMP',
        formulaDescription: 'totalEndClamps',
        calculationLevel: 1,  // Direct from tab data
        isActive: true
      },
      {
        itemSerialNumber: '29',  // Mid Clamp (M+)
        formulaKey: 'MID_CLAMP',
        formulaDescription: 'totalMidClamps',
        calculationLevel: 1,  // Direct from tab data
        isActive: true
      },
      {
        itemSerialNumber: '15',  // Small Rail Nut
        formulaKey: 'RAIL_NUTS',
        formulaDescription: 'END_CLAMP + MID_CLAMP',
        calculationLevel: 2,  // Dependent on END_CLAMP and MID_CLAMP
        isActive: true
      }
    ];

    // Clear existing formulas
    console.log('📝 Clearing existing formulas...');
    await prisma.bomFormula.deleteMany({});

    // Insert new formulas
    console.log('📝 Inserting formula mappings...\n');
    for (const formula of formulas) {
      const created = await prisma.bomFormula.create({
        data: formula
      });
      console.log(`✅ Created: ${formula.formulaKey} → Serial ${formula.itemSerialNumber}`);
    }

    // Verify the seeding
    console.log('\n📊 Verification:\n');
    const allFormulas = await prisma.bomFormula.findMany({
      include: {
        masterItem: {
          select: {
            serialNumber: true,
            sunrackCode: true,
            genericName: true
          }
        }
      },
      orderBy: {
        calculationLevel: 'asc'
      }
    });

    allFormulas.forEach(f => {
      console.log(`${f.formulaKey.padEnd(20)} → ${f.masterItem.genericName} (${f.masterItem.sunrackCode})`);
      console.log(`   Description: ${f.formulaDescription}`);
      console.log(`   Level: ${f.calculationLevel}`);
      console.log('---');
    });

    console.log(`\n✅ Successfully seeded ${formulas.length} formula mappings!`);
  } catch (error) {
    console.error('❌ Error seeding formulas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed script
seedFormulas()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
