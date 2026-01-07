const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedProduction() {
  console.log('🚀 Starting production database seed...');
  
  const dataPath = path.join(__dirname, 'production_data.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ production_data.json not found!');
    console.error('   Please make sure to upload this file along with the script.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`📦 Loaded data export from: ${data.timestamp}`);
  console.log('   Counts to import:', data.counts);

  try {
    // 1. Sunrack Profiles
    console.log('\n--- 1. Seeding Sunrack Profiles ---');
    for (const profile of data.profiles) {
      await prisma.sunrackProfile.upsert({
        where: { id: profile.id },
        update: {
          ...profile,
          created_at: undefined, // Let Prisma handle timestamps or keep original? keeping original is better for sync
          updated_at: undefined,
          createdAt: new Date(profile.createdAt),
          updatedAt: new Date(profile.updatedAt),
          // Remove relation fields if any existed in export (Prisma doesn't export them by default but safe to be sure)
          bomMasterItems: undefined,
          formulas: undefined,
          variationItems: undefined
        },
        create: {
          ...profile,
          created_at: undefined, 
          updated_at: undefined,
          createdAt: new Date(profile.createdAt),
          updatedAt: new Date(profile.updatedAt),
          bomMasterItems: undefined,
          formulas: undefined,
          variationItems: undefined
        }
      });
    }
    console.log(`✅ Synced ${data.profiles.length} profiles`);

    // 2. Fasteners
    console.log('\n--- 2. Seeding Fasteners ---');
    for (const fastener of data.fasteners) {
      await prisma.fastener.upsert({
        where: { id: fastener.id },
        update: {
          ...fastener,
          createdAt: new Date(fastener.createdAt),
          updatedAt: new Date(fastener.updatedAt),
          formulas: undefined,
          variationItems: undefined
        },
        create: {
          ...fastener,
          createdAt: new Date(fastener.createdAt),
          updatedAt: new Date(fastener.updatedAt),
          formulas: undefined,
          variationItems: undefined
        }
      });
    }
    console.log(`✅ Synced ${data.fasteners.length} fasteners`);

    // 3. BOM Variation Templates
    console.log('\n--- 3. Seeding Variation Templates ---');
    for (const template of data.templates) {
      await prisma.bomVariationTemplate.upsert({
        where: { id: template.id },
        update: {
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt),
          variationItems: undefined
        },
        create: {
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt),
          variationItems: undefined
        }
      });
    }
    console.log(`✅ Synced ${data.templates.length} templates`);

    // 4. BOM Formulas
    console.log('\n--- 4. Seeding BOM Formulas ---');
    for (const formula of data.formulas) {
      // Need to handle potential nulls for relationships if they don't exist yet, 
      // but since we seeded profiles and fasteners first, it should be fine.
      
      // Clean up relation fields just in case
      const { masterItem, sunrackProfile, fastener, ...formulaData } = formula;

      await prisma.bomFormula.upsert({
        where: { id: formula.id },
        update: {
          ...formulaData,
          createdAt: new Date(formula.createdAt),
          updatedAt: new Date(formula.updatedAt)
        },
        create: {
          ...formulaData,
          createdAt: new Date(formula.createdAt),
          updatedAt: new Date(formula.updatedAt)
        }
      });
    }
    console.log(`✅ Synced ${data.formulas.length} formulas`);

    // 5. BOM Variation Items
    console.log('\n--- 5. Seeding Variation Items ---');
    // For variation items, since they are link tables, we want to match IDs exactly.
    for (const item of data.variationItems) {
      // Clean up relation objects
      const { template, masterItem, sunrackProfile, fastener, ...itemData } = item;

      await prisma.bomVariationItem.upsert({
        where: { id: item.id },
        update: {
          ...itemData,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        },
        create: {
          ...itemData,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }
      });
    }
    console.log(`✅ Synced ${data.variationItems.length} variation items`);

    console.log('\n🎉 Production seed completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedProduction();
