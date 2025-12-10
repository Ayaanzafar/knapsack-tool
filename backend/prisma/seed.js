require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting BOM master data seeding...');

  // BOM Master Items
  const bomItems = [
    // Long Rails (will be dynamically created based on available lengths)
    {
      serialNumber: '1',
      sunrackCode: 'MA-43',
      itemDescription: 'Long Rail',
      material: 'AA 6000 T5/T6',
      standardLength: null, // Variable length
      uom: 'Nos',
      category: 'RAIL',
      profileImagePath: '/assets/bom-profiles/MA-43.png'
    },
    // U Cleat
    {
      serialNumber: '2',
      sunrackCode: 'MA-110',
      itemDescription: 'U Cleat (5mm Hole)',
      material: 'AA 6000 T5/T6',
      standardLength: 40,
      uom: 'Nos',
      category: 'SUPPORT',
      profileImagePath: '/assets/bom-profiles/MA-110.png'
    },
    // Rail Jointer
    {
      serialNumber: '3',
      sunrackCode: 'MA-72',
      itemDescription: 'Rail Jointer',
      material: 'AA 6000 T5/T6',
      standardLength: 150,
      uom: 'Nos',
      category: 'JOINT',
      profileImagePath: '/assets/bom-profiles/MA-72.png'
    },
    // End Clamps
    {
      serialNumber: '4',
      sunrackCode: 'MA-109',
      itemDescription: 'End Clamps-30mm',
      material: 'AA 6000 T5/T6',
      standardLength: 50,
      uom: 'Nos',
      category: 'HARDWARE',
      profileImagePath: '/assets/bom-profiles/MA-109.png'
    },
    // Mid Clamps
    {
      serialNumber: '5',
      sunrackCode: 'MA-35',
      itemDescription: 'Mid Clamps',
      material: 'AA 6000 T5/T6',
      standardLength: 50,
      uom: 'Nos',
      category: 'HARDWARE',
      profileImagePath: '/assets/bom-profiles/MA-35.png'
    },
    // Rail Nuts
    {
      serialNumber: '6',
      sunrackCode: 'MA-46',
      itemDescription: 'Rail Nuts',
      material: 'AA 6000 T5/T6',
      standardLength: 20,
      uom: 'Nos',
      category: 'HARDWARE',
      profileImagePath: '/assets/bom-profiles/MA-46.png'
    },
    // M8x60 Bolt
    {
      serialNumber: '7',
      sunrackCode: null,
      itemDescription: 'M8x60 Hex Head Bolt for U-cleat',
      material: 'SS304',
      standardLength: null,
      uom: 'Nos',
      category: 'HARDWARE',
      profileImagePath: null
    },
    // M8x20 Bolt
    {
      serialNumber: '8',
      sunrackCode: null,
      itemDescription: 'M8x20 Allen Head Bolt for End & Mid Clamps',
      material: 'SS304',
      standardLength: null,
      uom: 'Nos',
      category: 'HARDWARE',
      profileImagePath: null
    },
    // M8 Hex Nuts
    {
      serialNumber: '9',
      sunrackCode: null,
      itemDescription: 'M8 Hex Nuts for Outer U-Cleat Bolt',
      material: 'SS304',
      standardLength: null,
      uom: 'Nos',
      category: 'HARDWARE',
      profileImagePath: null
    },
    // M8 Plain Washer
    {
      serialNumber: '10',
      sunrackCode: null,
      itemDescription: 'M8 Plain Washer - 2 for U-Cleat Bolt',
      material: 'SS304',
      standardLength: null,
      uom: 'Nos',
      category: 'HARDWARE',
      profileImagePath: null
    },
    // M8 Spring Washer
    {
      serialNumber: '11',
      sunrackCode: null,
      itemDescription: 'M8 Spring washers - 1 for All Bolts',
      material: 'SS304',
      standardLength: null,
      uom: 'Nos',
      category: 'HARDWARE',
      profileImagePath: null
    },
    // SDS 4.2X13mm
    {
      serialNumber: '12',
      sunrackCode: null,
      itemDescription: 'SDS 4.2X13mm for Rail jointer',
      material: 'GI',
      standardLength: null,
      uom: 'Nos',
      category: 'HARDWARE',
      profileImagePath: null
    },
    // SDS 5.5X63mm
    {
      serialNumber: '13',
      sunrackCode: null,
      itemDescription: 'SDS 5.5X63mm for U Cleat',
      material: 'GI',
      standardLength: null,
      uom: 'Nos',
      category: 'HARDWARE',
      profileImagePath: null
    },
    // Rubber Pad
    {
      serialNumber: '14',
      sunrackCode: null,
      itemDescription: 'Rubber Pad 40x40mm for U- cleat',
      material: 'EPDM',
      standardLength: null,
      uom: 'Nos',
      category: 'HARDWARE',
      profileImagePath: null
    },
    // Blind Rivets
    {
      serialNumber: '15',
      sunrackCode: null,
      itemDescription: 'Blind Rivets - 4.5x15mm',
      material: 'Al 5000',
      standardLength: null,
      uom: 'Nos',
      category: 'HARDWARE',
      profileImagePath: null
    }
  ];

  // Create BOM master items
  for (const item of bomItems) {
    await prisma.bomMasterItem.upsert({
      where: { serialNumber: item.serialNumber },
      update: item,
      create: item
    });
    console.log(`✓ Created/Updated: ${item.itemDescription}`);
  }

  // BOM Formulas
  const bomFormulas = [
    // Level 1: Direct from tab data
    { itemSerialNumber: '1', formulaKey: 'LONG_RAIL', formulaDescription: 'Cut length from optimization', calculationLevel: 1 },
    { itemSerialNumber: '3', formulaKey: 'RAIL_JOINTER', formulaDescription: 'Number of joints needed', calculationLevel: 1 },
    { itemSerialNumber: '4', formulaKey: 'END_CLAMP', formulaDescription: 'End clamps per row', calculationLevel: 1 },
    { itemSerialNumber: '5', formulaKey: 'MID_CLAMP', formulaDescription: 'Mid clamps per row', calculationLevel: 1 },

    // Level 2: Calculated from Level 1
    { itemSerialNumber: '2', formulaKey: 'U_CLEAT', formulaDescription: 'SB1 + SB2', calculationLevel: 2 },
    { itemSerialNumber: '6', formulaKey: 'RAIL_NUTS', formulaDescription: 'END_CLAMP + MID_CLAMP', calculationLevel: 2 },

    // Level 3: Bolt calculations
    { itemSerialNumber: '7', formulaKey: 'M8x60_BOLT', formulaDescription: 'U_CLEAT', calculationLevel: 3 },
    { itemSerialNumber: '8', formulaKey: 'M8x20_BOLT', formulaDescription: 'END_CLAMP + MID_CLAMP', calculationLevel: 3 },

    // Level 4: Washers and nuts
    { itemSerialNumber: '9', formulaKey: 'M8_HEX_NUTS', formulaDescription: 'M8x60_BOLT', calculationLevel: 4 },
    { itemSerialNumber: '10', formulaKey: 'M8_PLAIN_WASHER', formulaDescription: 'M8x60_BOLT * 2', calculationLevel: 4 },
    { itemSerialNumber: '11', formulaKey: 'M8_SPRING_WASHER', formulaDescription: 'M8x60_BOLT + M8x20_BOLT', calculationLevel: 4 },

    // Level 5: Other hardware
    { itemSerialNumber: '12', formulaKey: 'SDS_4_2X13MM', formulaDescription: 'RAIL_JOINTER * 4', calculationLevel: 5 },
    { itemSerialNumber: '13', formulaKey: 'SDS_5_5X63MM', formulaDescription: 'SB1', calculationLevel: 5 },
    { itemSerialNumber: '14', formulaKey: 'RUBBER_PAD', formulaDescription: 'U_CLEAT', calculationLevel: 5 },
    { itemSerialNumber: '15', formulaKey: 'BLIND_RIVETS', formulaDescription: 'SB2', calculationLevel: 5 }
  ];

  // Create BOM formulas
  for (const formula of bomFormulas) {
    await prisma.bomFormula.create({
      data: formula
    });
    console.log(`✓ Created formula: ${formula.formulaKey}`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
