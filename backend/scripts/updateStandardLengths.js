const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateStandardLengths() {
  console.log('Updating standard lengths for BOM items...\n');

  const updates = [
    { serialNumber: '100', standardLength: 40, name: 'Unified U Cleat' },
    { serialNumber: '47', standardLength: 150, name: 'External Long Rail Jointer' },
    { serialNumber: '110', standardLength: 50, name: '30mm End Clamp_Type 2' },
    { serialNumber: '29', standardLength: 50, name: 'Mid Clamp (M+)' },
    { serialNumber: '15', standardLength: 20, name: 'Small Rail Nut' }
  ];

  try {
    for (const item of updates) {
      await prisma.bomMasterItem.update({
        where: { serialNumber: item.serialNumber },
        data: { standardLength: item.standardLength }
      });
      console.log(`✔️ ${item.name} (Serial ${item.serialNumber}) -> ${item.standardLength}mm`);
    }

    console.log('\nVerification:');
    const verifyItems = await prisma.bomMasterItem.findMany({
      where: {
        serialNumber: {
          in: ['100', '47', '110', '29', '15']
        }
      },
      select: {
        serialNumber: true,
        genericName: true,
        standardLength: true
      },
      orderBy: {
        serialNumber: 'asc'
      }
    });

    verifyItems.forEach(item => {
      console.log(`   ${item.genericName.padEnd(30)} : ${item.standardLength}mm`);
    });

    console.log('\n✔️ Standard lengths updated successfully!');
  } catch (error) {
    console.error('Error updating standard lengths:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateStandardLengths()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
