// Script to update profileImagePath in bom_master_items table
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateImagePaths() {
  console.log('🖼️  Updating profile image paths...\n');

  try {
    // Define mappings: Serial Number -> Image File Name
    // TODO: Verify these mappings match your actual images
    const imageMappings = [
      // Aluminum Profile Items (with formulas)
      { serialNumber: '26', imagePath: '/assets/bom-profiles/MA-43.png', name: '40mm Long Rail' },
      { serialNumber: '100', imagePath: '/assets/bom-profiles/MA-110.png', name: 'Unified U Cleat' },
      { serialNumber: '47', imagePath: '/assets/bom-profiles/MA-72.png', name: 'External Long Rail Jointer' },
      { serialNumber: '110', imagePath: '/assets/bom-profiles/MA-109.png', name: '30mm End Clamp_Type 2' },
      { serialNumber: '29', imagePath: '/assets/bom-profiles/MA-35.png', name: 'Mid Clamp (M+)' },
      { serialNumber: '15', imagePath: '/assets/bom-profiles/MA-46.png', name: 'Small Rail Nut' },

      // You can add more mappings here for other items if needed
    ];

    console.log('📝 Updating image paths:\n');

    for (const mapping of imageMappings) {
      const result = await prisma.bomMasterItem.update({
        where: { serialNumber: mapping.serialNumber },
        data: { profileImagePath: mapping.imagePath }
      });

      console.log(`✅ Serial ${mapping.serialNumber.padEnd(4)} (${mapping.name.padEnd(30)}) -> ${mapping.imagePath}`);
    }

    // Verify the updates
    console.log('\n📊 Verification:\n');
    const updatedItems = await prisma.bomMasterItem.findMany({
      where: {
        serialNumber: {
          in: imageMappings.map(m => m.serialNumber)
        }
      },
      select: {
        serialNumber: true,
        genericName: true,
        profileImagePath: true
      },
      orderBy: {
        serialNumber: 'asc'
      }
    });

    updatedItems.forEach(item => {
      const status = item.profileImagePath ? '✅' : '❌';
      console.log(`${status} Serial ${item.serialNumber.padEnd(4)} | ${item.genericName.padEnd(35)} | ${item.profileImagePath || 'NULL'}`);
    });

    console.log(`\n✅ Successfully updated ${imageMappings.length} image paths!`);
    console.log('\n⚠️  IMPORTANT: Please verify that the image file names match your actual files in:');
    console.log('   D:\\react\\knapsack-tool\\knapsack-front\\public\\assets\\bom-profiles\\');
    console.log('\nIf any mappings are incorrect, edit the imageMappings array in this script and run again.');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateImagePaths()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
