const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedVariationTemplates() {
  try {
    console.log('Starting BOM Variation Templates seeding...\n');

    // Read extracted variation data
    const dataPath = path.join(__dirname, '..', 'variation_templates_extracted.json');
    const variationData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`Found ${variationData.length} variations to seed\n`);

    // Create templates for each variation
    for (const variation of variationData) {
      console.log(`\nProcessing: ${variation.variationName}`);
      console.log(`  Items: ${variation.items.length}`);

      // Generate placeholder default notes
      const defaultNotes = [
        `This BOM is for ${variation.variationName}`,
        "Please refer to installation manual for detailed guidelines",
        "All items are as per standard specifications"
      ];

      // Create or update template
      const template = await prisma.bomVariationTemplate.upsert({
        where: { variationName: variation.variationName },
        update: {
          items: variation.items,
          defaultNotes: defaultNotes,
          order: 'standard',
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          variationName: variation.variationName,
          items: variation.items,
          defaultNotes: defaultNotes,
          order: 'standard',
          isActive: true
        }
      });

      console.log(`  ✅ Template created/updated (ID: ${template.id})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All variation templates seeded successfully!');
    console.log('='.repeat(60));

    // Display summary
    const allTemplates = await prisma.bomVariationTemplate.findMany({
      select: {
        id: true,
        variationName: true,
        items: true,
        defaultNotes: true
      }
    });

    console.log(`\nTotal templates in database: ${allTemplates.length}\n`);
    allTemplates.forEach((template) => {
      console.log(`${template.id}. ${template.variationName}`);
      console.log(`   Items: ${template.items.length}`);
      console.log(`   Notes: ${template.defaultNotes.length}`);
    });

  } catch (error) {
    console.error('\n❌ Error seeding variation templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedVariationTemplates()
  .then(() => {
    console.log('\n✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
