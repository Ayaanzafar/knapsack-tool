const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
  DEFAULT_ALUMINIUM_RATE_PER_KG,
  DEFAULT_SPARE_PERCENTAGE
} = require('../src/constants/bomDefaults');

/**
 * Convert old full BOM format to new optimized format
 */
function convertToMinimalBOM(oldBomData) {
  // Extract metadata
  const bomMetadata = {
    aluminumRate: oldBomData.aluminumRate || DEFAULT_ALUMINIUM_RATE_PER_KG,
    sparePercentage: oldBomData.sparePercentage || DEFAULT_SPARE_PERCENTAGE,
    tabs: oldBomData.tabs || [],
    panelCounts: oldBomData.panelCounts || {},
    projectInfo: oldBomData.projectInfo || {}
  };

  // Convert items to minimal format
  const bomItems = (oldBomData.bomItems || []).map(item => ({
    sn: item.sn,
    profileSerialNumber: item.profileSerialNumber,
    calculationType: item.calculationType,
    length: item.length || null,
    quantities: item.quantities || {},
    userEdits: item.userEdits || null
  }));

  return { bomMetadata, bomItems };
}

async function migrateBOMs() {
  console.log('🔄 Migrating existing BOMs to optimized format...\n');

  try {
    // Fetch all existing BOMs using Prisma
    const existingBOMs = await prisma.generatedBom.findMany();

    console.log(`Found ${existingBOMs.length} BOMs to migrate\n`);

    for (const bom of existingBOMs) {
      try {
        const oldBomData = bom.bomData;

        if (!oldBomData) {
          console.log(`⏭️  Skipping BOM ID ${bom.id} (no bomData)\n`);
          continue;
        }

        const { bomMetadata, bomItems } = convertToMinimalBOM(oldBomData);

        console.log(`Migrating BOM ID ${bom.id}...`);
        console.log(`  Old size: ${JSON.stringify(oldBomData).length} bytes`);
        console.log(`  New size: ${JSON.stringify({ bomMetadata, bomItems }).length} bytes`);
        console.log(`  Reduction: ${Math.round((1 - (JSON.stringify({ bomMetadata, bomItems }).length / JSON.stringify(oldBomData).length)) * 100)}%`);

        // Update with new format using Prisma
        await prisma.generatedBom.update({
          where: { id: bom.id },
          data: {
            bomMetadata: bomMetadata,
            bomItems: bomItems
          }
        });

        console.log(`  ✅ Migrated successfully\n`);
      } catch (error) {
        console.error(`  ❌ Error migrating BOM ${bom.id}:`, error.message);
      }
    }

    console.log('✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateBOMs()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
