const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateStandardLengths() {
  console.log('🔄 Updating standard lengths for BOM items...\n');

  try {
    // Correct mappings based on RM codes
    console.log('📝 Correct mappings:');

    // MA 35: Mid Clamp - 21mm Module Gap => length = 50
    await prisma.bomMasterItem.update({
      where: { id: 19 },  // SRC-019
      data: { standardLength: 50 }
    });
    console.log('✅ MA 35 - Mid Clamp - 21mm Module Gap => 50mm');

    // MA 46: Hook Rail Nut => length = 20
    await prisma.bomMasterItem.update({
      where: { id: 28 },  // SRC-028
      data: { standardLength: 20 }
    });
    console.log('✅ MA 46 - Hook Rail Nut => 20mm');

    // MA 109: 30mm End Clamp_V2 => length = 50
    await prisma.bomMasterItem.update({
      where: { id: 99 },  // SRC-099
      data: { standardLength: 50 }
    });
    console.log('✅ MA 109 - 30mm End Clamp_V2 => 50mm');

    // Set NULL for incorrectly mapped items
    console.log('\n📝 Setting NULL for incorrect mappings:');

    // Mid Clamp (M+) - serialNumber: 29
    await prisma.bomMasterItem.update({
      where: { serialNumber: '29' },
      data: { standardLength: null }
    });
    console.log('✅ Mid Clamp (M+) => NULL');

    // Small Rail Nut - serialNumber: 15
    await prisma.bomMasterItem.update({
      where: { serialNumber: '15' },
      data: { standardLength: null }
    });
    console.log('✅ Small Rail Nut => NULL');

    console.log('\n📋 Verification:');
    const verifyItems = await prisma.bomMasterItem.findMany({
      where: {
        id: {
          in: [19, 28, 99]
        }
      },
      include: {
        rmCodes: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    verifyItems.forEach(item => {
      const rmCode = item.rmCodes.find(rm => rm.code?.startsWith('MA'))?.code || 'N/A';
      console.log(`   ${rmCode.padEnd(10)} | ${item.genericName.padEnd(35)} | ${item.standardLength || 'NULL'}mm`);
    });

    const incorrectItems = await prisma.bomMasterItem.findMany({
      where: {
        serialNumber: {
          in: ['29', '15']
        }
      }
    });

    console.log('\n📋 Incorrect items (set to NULL):');
    incorrectItems.forEach(item => {
      console.log(`   SN: ${item.serialNumber.padEnd(5)} | ${item.genericName.padEnd(35)} | ${item.standardLength || 'NULL'}`);
    });

    console.log('\n✅ All standard lengths updated successfully!');
  } catch (error) {
    console.error('❌ Error updating standard lengths:', error);
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
