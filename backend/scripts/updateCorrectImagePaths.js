// Script to update profileImagePath with CORRECT mappings based on RM codes
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCorrectImagePaths() {
  console.log('🖼️  Updating profile image paths (CORRECT mappings based on RM codes)...\n');

  try {
    // CORRECT mappings based on RM codes (Regal vendor)
    const imageMappings = [
      { serialNumber: '26', imagePath: '/assets/bom-profiles/MA-43.png', rmCode: 'MA 43', name: '40mm Long Rail' },
      { serialNumber: '100', imagePath: '/assets/bom-profiles/MA-110.png', rmCode: 'MA 110', name: 'Unified U Cleat' },
      { serialNumber: '47', imagePath: '/assets/bom-profiles/MA-72.png', rmCode: 'MA 72', name: 'External Long Rail Jointer' },
      { serialNumber: '99', imagePath: '/assets/bom-profiles/MA-109.png', rmCode: 'MA 109', name: '30mm End Clamp_V2' },
      { serialNumber: '19', imagePath: '/assets/bom-profiles/MA-35.png', rmCode: 'MA 35', name: 'Mid Clamp - 21mm Module Gap' },
      { serialNumber: '28', imagePath: '/assets/bom-profiles/MA-46.png', rmCode: 'MA 46', name: 'Hook Rail Nut' }
    ];

    console.log('📝 Updating image paths:\n');

    for (const mapping of imageMappings) {
      const result = await prisma.bomMasterItem.update({
        where: { serialNumber: mapping.serialNumber },
        data: { profileImagePath: mapping.imagePath }
      });

      console.log(`✅ Serial ${mapping.serialNumber.padEnd(4)} | RM: ${mapping.rmCode.padEnd(8)} | ${mapping.name.padEnd(35)} → ${mapping.imagePath}`);
    }

    // Verify the updates
    console.log('\n📊 Verification:\n');
    const updatedItems = await prisma.bomMasterItem.findMany({
      where: {
        serialNumber: {
          in: imageMappings.map(m => m.serialNumber)
        }
      },
      include: {
        rmCodes: {
          where: {
            vendorName: 'Regal'
          }
        }
      },
      orderBy: {
        serialNumber: 'asc'
      }
    });

    updatedItems.forEach(item => {
      const regalRmCode = item.rmCodes.find(rm => rm.vendorName === 'Regal')?.code || 'N/A';
      const status = item.profileImagePath ? '✅' : '❌';
      console.log(`${status} Serial ${item.serialNumber.padEnd(4)} | RM: ${regalRmCode.padEnd(8)} | ${item.genericName.padEnd(35)} | ${item.profileImagePath || 'NULL'}`);
    });

    console.log(`\n✅ Successfully updated ${imageMappings.length} image paths with CORRECT mappings!`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateCorrectImagePaths()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
