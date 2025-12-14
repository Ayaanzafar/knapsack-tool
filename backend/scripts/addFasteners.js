const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addFasteners() {
  console.log('🔄 Adding fastener items to database...\n');

  const fasteners = [
    {
      serialNumber: '200',
      sunrackCode: null,
      itemDescription: 'M8x60 Hex Head Bolt for U-cleat',
      genericName: 'M8x60 Hex Head Bolt',
      designWeight: 0,
      material: 'SS304',
      standardLength: null,
      uom: 'Nos',
      category: 'FASTENER',
      profileImagePath: '/assets/bom-profiles/M8_60_bolt.png',
      costPerPiece: 1.00,
      itemType: 'FASTENER'
    },
    {
      serialNumber: '201',
      sunrackCode: null,
      itemDescription: 'M8x20 Allen Head Bolt for End & Mid Clamps',
      genericName: 'M8x20 Allen Head Bolt',
      designWeight: 0,
      material: 'SS304',
      standardLength: null,
      uom: 'Nos',
      category: 'FASTENER',
      profileImagePath: '/assets/bom-profiles/M8_20_bolt.png',
      costPerPiece: 1.00,
      itemType: 'FASTENER'
    },
    {
      serialNumber: '202',
      sunrackCode: null,
      itemDescription: 'M8 Hex Nuts for Outer U-Cleat Bolt',
      genericName: 'M8 Hex Nuts',
      designWeight: 0,
      material: 'SS304',
      standardLength: null,
      uom: 'Nos',
      category: 'FASTENER',
      profileImagePath: '/assets/bom-profiles/M8_hex_nuts.png',
      costPerPiece: 1.00,
      itemType: 'FASTENER'
    },
    {
      serialNumber: '203',
      sunrackCode: null,
      itemDescription: 'M8 Plain Washer - 2 for U-Cleat Bolt',
      genericName: 'M8 Plain Washer',
      designWeight: 0,
      material: 'SS304',
      standardLength: null,
      uom: 'Nos',
      category: 'FASTENER',
      profileImagePath: '/assets/bom-profiles/M8_plain_washer.png',
      costPerPiece: 1.00,
      itemType: 'FASTENER'
    },
    {
      serialNumber: '204',
      sunrackCode: null,
      itemDescription: 'M8 Spring washers - 1 for All Bolts',
      genericName: 'M8 Spring Washer',
      designWeight: 0,
      material: 'SS304',
      standardLength: null,
      uom: 'Nos',
      category: 'FASTENER',
      profileImagePath: '/assets/bom-profiles/M8_spring_washer.png',
      costPerPiece: 1.00,
      itemType: 'FASTENER'
    },
    {
      serialNumber: '205',
      sunrackCode: null,
      itemDescription: 'SDS 4.2X13mm for Rail jointer',
      genericName: 'SDS 4.2X13mm',
      designWeight: 0,
      material: 'GI',
      standardLength: null,
      uom: 'Nos',
      category: 'FASTENER',
      profileImagePath: '/assets/bom-profiles/sds_4_2_13.png',
      costPerPiece: 1.00,
      itemType: 'FASTENER'
    },
    {
      serialNumber: '206',
      sunrackCode: null,
      itemDescription: 'SDS 5.5X63mm for U Cleat',
      genericName: 'SDS 5.5X63mm',
      designWeight: 0,
      material: 'GI',
      standardLength: null,
      uom: 'Nos',
      category: 'FASTENER',
      profileImagePath: '/assets/bom-profiles/sds_5_5_63.png',
      costPerPiece: 1.00,
      itemType: 'FASTENER'
    },
    {
      serialNumber: '207',
      sunrackCode: null,
      itemDescription: 'Rubber Pad 40x40mm for U- cleat',
      genericName: 'Rubber Pad 40x40mm',
      designWeight: 0,
      material: 'EPDM',
      standardLength: null,
      uom: 'Nos',
      category: 'FASTENER',
      profileImagePath: '/assets/bom-profiles/rubber_pad.png',
      costPerPiece: 1.00,
      itemType: 'FASTENER'
    },
    {
      serialNumber: '208',
      sunrackCode: null,
      itemDescription: 'Blind Rivets - 4.5x15mm',
      genericName: 'Blind Rivets 4.5x15mm',
      designWeight: 0,
      material: 'Al 5000',
      standardLength: null,
      uom: 'Nos',
      category: 'FASTENER',
      profileImagePath: '/assets/bom-profiles/blind-rivets.png',
      costPerPiece: 1.00,
      itemType: 'FASTENER'
    }
  ];

  try {
    for (const fastener of fasteners) {
      const created = await prisma.bomMasterItem.upsert({
        where: { serialNumber: fastener.serialNumber },
        update: fastener,
        create: fastener
      });
      console.log('✅ Added:', fastener.genericName, '-', fastener.material);
    }

    console.log('\n📋 Verification:');
    const verifyItems = await prisma.bomMasterItem.findMany({
      where: {
        serialNumber: {
          in: ['200', '201', '202', '203', '204', '205', '206', '207', '208']
        }
      },
      select: {
        serialNumber: true,
        genericName: true,
        material: true,
        costPerPiece: true,
        itemType: true
      },
      orderBy: {
        serialNumber: 'asc'
      }
    });

    console.log('\n');
    verifyItems.forEach(item => {
      console.log(`SN ${item.serialNumber}: ${item.genericName} | ${item.material} | ₹${item.costPerPiece} | ${item.itemType}`);
    });

    console.log('\n✅ All fastener items added successfully!');
  } catch (error) {
    console.error('❌ Error adding fasteners:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addFasteners()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
