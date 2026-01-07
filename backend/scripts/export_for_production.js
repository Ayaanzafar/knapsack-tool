const prisma = require('../src/prismaClient');
const fs = require('fs');
const path = require('path');

async function exportData() {
  console.log('🚀 Starting data export for production...');

  try {
    // 1. Sunrack Profiles
    console.log('📦 Fetching Sunrack Profiles...');
    const profiles = await prisma.sunrackProfile.findMany({
      orderBy: { id: 'asc' }
    });
    console.log(`   Found ${profiles.length} profiles`);

    // 2. Fasteners
    console.log('🔩 Fetching Fasteners...');
    const fasteners = await prisma.fastener.findMany({
      orderBy: { id: 'asc' }
    });
    console.log(`   Found ${fasteners.length} fasteners`);

    // 3. BOM Formulas
    console.log('⚗️ Fetching BOM Formulas...');
    const formulas = await prisma.bomFormula.findMany({
      orderBy: { id: 'asc' }
    });
    console.log(`   Found ${formulas.length} formulas`);

    // 4. Variation Templates
    console.log('📋 Fetching Variation Templates...');
    const templates = await prisma.bomVariationTemplate.findMany({
      orderBy: { id: 'asc' }
    });
    console.log(`   Found ${templates.length} templates`);

    // 5. Variation Items
    console.log('🔗 Fetching Variation Items...');
    const variationItems = await prisma.bomVariationItem.findMany({
      orderBy: { id: 'asc' }
    });
    console.log(`   Found ${variationItems.length} variation items`);

    // Combine all data
    const data = {
      timestamp: new Date().toISOString(),
      counts: {
        profiles: profiles.length,
        fasteners: fasteners.length,
        formulas: formulas.length,
        templates: templates.length,
        variationItems: variationItems.length
      },
      profiles,
      fasteners,
      formulas,
      templates,
      variationItems
    };

    // Write to file
    const outputPath = path.join(__dirname, '../prisma/production_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log(`\n✅ Data exported successfully to:`);
    console.log(`   ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
