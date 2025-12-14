const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addFastenerFormulas() {
  console.log('🔄 Adding formulas for fastener items...\n');

  const formulas = [
    {
      itemSerialNumber: '200',  // M8x60 Hex Head Bolt
      formulaKey: 'M8x60_BOLT',
      formulaDescription: 'M8x60 Hex Head Bolt for U-cleat: U_CLEAT count',
      calculationLevel: 3
    },
    {
      itemSerialNumber: '201',  // M8x20 Allen Head Bolt
      formulaKey: 'M8x20_BOLT',
      formulaDescription: 'M8x20 Allen Head Bolt: END_CLAMP + MID_CLAMP',
      calculationLevel: 3
    },
    {
      itemSerialNumber: '202',  // M8 Hex Nuts
      formulaKey: 'M8_HEX_NUTS',
      formulaDescription: 'M8 Hex Nuts: M8x60_BOLT count',
      calculationLevel: 4
    },
    {
      itemSerialNumber: '203',  // M8 Plain Washer
      formulaKey: 'M8_PLAIN_WASHER',
      formulaDescription: 'M8 Plain Washer: M8x60_BOLT * 2',
      calculationLevel: 4
    },
    {
      itemSerialNumber: '204',  // M8 Spring Washer
      formulaKey: 'M8_SPRING_WASHER',
      formulaDescription: 'M8 Spring Washer: M8x60_BOLT + M8x20_BOLT',
      calculationLevel: 4
    },
    {
      itemSerialNumber: '205',  // SDS 4.2X13mm
      formulaKey: 'SDS_4_2X13MM',
      formulaDescription: 'SDS 4.2X13mm: RAIL_JOINTER * 4',
      calculationLevel: 5
    },
    {
      itemSerialNumber: '206',  // SDS 5.5X63mm
      formulaKey: 'SDS_5_5X63MM',
      formulaDescription: 'SDS 5.5X63mm: SB1 count',
      calculationLevel: 5
    },
    {
      itemSerialNumber: '207',  // Rubber Pad
      formulaKey: 'RUBBER_PAD',
      formulaDescription: 'Rubber Pad: U_CLEAT count',
      calculationLevel: 5
    },
    {
      itemSerialNumber: '208',  // Blind Rivets
      formulaKey: 'BLIND_RIVETS',
      formulaDescription: 'Blind Rivets: SB2 count',
      calculationLevel: 5
    }
  ];

  try {
    for (const formula of formulas) {
      // Check if formula already exists
      const existing = await prisma.bomFormula.findFirst({
        where: {
          itemSerialNumber: formula.itemSerialNumber,
          formulaKey: formula.formulaKey
        }
      });

      if (existing) {
        console.log(`⏭️  Formula ${formula.formulaKey} already exists for SN ${formula.itemSerialNumber}`);
      } else {
        await prisma.bomFormula.create({
          data: formula
        });
        console.log(`✅ Added formula: ${formula.formulaKey} for SN ${formula.itemSerialNumber}`);
      }
    }

    console.log('\n📋 Verification:');
    const verifyFormulas = await prisma.bomFormula.findMany({
      where: {
        itemSerialNumber: {
          in: ['200', '201', '202', '203', '204', '205', '206', '207', '208']
        }
      },
      include: {
        masterItem: {
          select: {
            genericName: true
          }
        }
      },
      orderBy: {
        itemSerialNumber: 'asc'
      }
    });

    console.log('\n');
    verifyFormulas.forEach(f => {
      console.log(`${f.formulaKey}: ${f.masterItem.genericName}`);
    });

    console.log('\n✅ All fastener formulas added successfully!');
  } catch (error) {
    console.error('❌ Error adding formulas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addFastenerFormulas()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
