// Clear wrong image paths from items that don't match the RM codes
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearWrongPaths() {
  console.log('🧹 Clearing wrong image paths...\n');

  try {
    // Items that were wrongly mapped before (need to clear)
    const itemsToClear = ['15', '29', '110'];  // Old wrong mappings

    console.log('📝 Clearing old wrong mappings:\n');

    for (const serialNumber of itemsToClear) {
      const item = await prisma.bomMasterItem.findUnique({
        where: { serialNumber },
        include: {
          rmCodes: {
            where: { vendorName: 'Regal' }
          }
        }
      });

      if (item) {
        await prisma.bomMasterItem.update({
          where: { serialNumber },
          data: { profileImagePath: null }
        });

        const rmCode = item.rmCodes[0]?.code || 'N/A';
        console.log(`✅ Cleared Serial ${serialNumber.padEnd(4)} | RM: ${rmCode.padEnd(8)} | ${item.genericName}`);
      }
    }

    // Now show all items with image paths
    console.log('\n📊 Items with Image Paths (after cleanup):\n');
    const itemsWithImages = await prisma.bomMasterItem.findMany({
      where: {
        profileImagePath: {
          not: null
        }
      },
      include: {
        rmCodes: {
          where: { vendorName: 'Regal' }
        }
      },
      orderBy: {
        serialNumber: 'asc'
      }
    });

    itemsWithImages.forEach(item => {
      const rmCode = item.rmCodes[0]?.code || 'N/A';
      console.log(`✅ Serial ${item.serialNumber.padEnd(4)} | RM: ${rmCode.padEnd(8)} | ${item.genericName.padEnd(35)} | ${item.profileImagePath}`);
    });

    console.log(`\n✅ Cleanup complete! ${itemsWithImages.length} items have images.`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearWrongPaths()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
