// Comprehensive seed script to populate BOM master items, formulas, and RM codes
// This script reads from bom_data_export.json and seeds the entire BOM catalog
// Usage: node scripts/seedBomComplete.js

const prisma = require('../src/prismaClient');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Starting comprehensive BOM data seeding...\n');

  // Read the exported data
  const dataPath = path.join(__dirname, '..', 'bom_data_export.json');

  if (!fs.existsSync(dataPath)) {
    console.error('Error: bom_data_export.json not found!');
    console.log('Please ensure the file exists in the backend directory.');
    process.exit(1);
  }

  const bomData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Found ${bomData.length} BOM items to seed\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const item of bomData) {
    try {
      // Check if item already exists
      const existing = await prisma.bomMasterItem.findUnique({
        where: { serialNumber: item.serialNumber }
      });

      if (existing) {
        console.log(`Skipping ${item.serialNumber} - ${item.genericName} (already exists)`);
        skippedCount++;
        continue;
      }

      // Create the BOM master item
      await prisma.bomMasterItem.create({
        data: {
          serialNumber: item.serialNumber,
          sunrackCode: item.sunrackCode,
          itemDescription: item.itemDescription,
          genericName: item.genericName,
          designWeight: item.designWeight,
          material: item.material,
          standardLength: item.standardLength,
          uom: item.uom,
          category: item.category,
          profileImagePath: item.profileImagePath,
          selectedRmVendor: item.selectedRmVendor,
          costPerPiece: item.costPerPiece,
          itemType: item.itemType,
          isActive: item.isActive
        }
      });

      console.log(`Created: ${item.serialNumber} - ${item.genericName}`);

      // Create formulas if any
      if (item.formulas && item.formulas.length > 0) {
        for (const formula of item.formulas) {
          await prisma.bomFormula.create({
            data: {
              itemSerialNumber: item.serialNumber,
              formulaKey: formula.formulaKey,
              formulaDescription: formula.formulaDescription,
              calculationLevel: formula.calculationLevel,
              isActive: formula.isActive
            }
          });
        }
        console.log(`  Added ${item.formulas.length} formula(s)`);
      }

      // Create RM codes if any
      if (item.rmCodes && item.rmCodes.length > 0) {
        for (const rmCode of item.rmCodes) {
          await prisma.rmCode.create({
            data: {
              itemSerialNumber: item.serialNumber,
              vendorName: rmCode.vendorName,
              code: rmCode.code
            }
          });
        }
        console.log(`  Added ${item.rmCodes.length} RM code(s)`);
      }

      successCount++;
    } catch (error) {
      console.error(`Error creating ${item.serialNumber}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Seeding completed!');
  console.log(`Successfully created: ${successCount} items`);
  console.log(`Skipped (already exist): ${skippedCount} items`);
  console.log(`Errors: ${errorCount} items`);
  console.log(`Total processed: ${successCount + skippedCount + errorCount} items`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
