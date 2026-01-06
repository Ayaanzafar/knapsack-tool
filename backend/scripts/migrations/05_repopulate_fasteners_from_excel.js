const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const prisma = new PrismaClient();

async function main() {
  console.log('\n========================================');
  console.log('  STEP 5: Repopulate Fasteners from Excel');
  console.log('========================================\n');

  // Read Excel file
  const workbook = XLSX.readFile('Long Rail MMS Variants_8_types.xlsx');

  const allFasteners = new Map();

  // Read sheets 1-8 (the 8 variations)
  for (let sheetNum = 1; sheetNum <= 8; sheetNum++) {
    const sheet = workbook.Sheets[sheetNum.toString()];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Skip header rows (0, 1) and start from row 2
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) break;

      const sunrackCode = row[1];
      const itemDesc = row[3];
      const material = row[4];
      const length = row[5];
      const uom = row[6];

      // Fasteners have empty sunrackCode
      if (itemDesc && (!sunrackCode || sunrackCode.toString().trim() === '')) {
        // Extract length from item description if not in length column
        let standardLength = length;

        // Parse length from description for screws
        if (!standardLength || standardLength === undefined) {
          // Try to extract from description like "4.2X19mm" or "5.5X63mm"
          const match = itemDesc.match(/(\d+\.?\d*)[xX×](\d+)/);
          if (match) {
            standardLength = parseInt(match[2]); // Get the second number (length)
          }
        }

        // Create unique key
        const key = `${itemDesc.trim()}|${material}|${standardLength}`;

        if (!allFasteners.has(key)) {
          allFasteners.set(key, {
            itemDescription: itemDesc.trim(),
            genericName: itemDesc.trim().replace(/\r\n/g, ' '),
            material: material,
            standardLength: standardLength && standardLength !== 'undefined' ? parseInt(standardLength) : null,
            uom: uom || 'Nos',
            category: 'FASTENER'
          });
        }
      }
    }
  }

  console.log(`Found ${allFasteners.size} unique fasteners in Excel\n`);

  // Step 1: Clear existing fasteners and related links
  console.log('Step 1: Clearing existing fasteners...');

  // Delete variation item links
  const deletedVariationItems = await prisma.bomVariationItem.deleteMany({
    where: { fastenerId: { not: null } }
  });
  console.log(`  Deleted ${deletedVariationItems.count} variation item links`);

  // Delete formula links
  const deletedFormulas = await prisma.bomFormula.deleteMany({
    where: { fastenerId: { not: null } }
  });
  console.log(`  Deleted ${deletedFormulas.count} formula links`);

  // Delete all fasteners
  const deletedFasteners = await prisma.fastener.deleteMany({});
  console.log(`  Deleted ${deletedFasteners.count} old fasteners\n`);

  // Step 2: Insert correct fasteners from Excel
  console.log('Step 2: Inserting correct fasteners from Excel...\n');

  let idx = 1;
  const fastenerIdMap = new Map(); // Map old serial numbers to new IDs

  for (const [key, fastener] of allFasteners) {
    const newFastener = await prisma.fastener.create({
      data: {
        itemDescription: fastener.itemDescription,
        genericName: fastener.genericName,
        material: fastener.material,
        standardLength: fastener.standardLength,
        uom: fastener.uom,
        category: fastener.category,
        isActive: true
      }
    });

    console.log(`✓ [${idx}/${allFasteners.size}] Created: ${newFastener.genericName}`);
    console.log(`  ID: ${newFastener.id} | Material: ${newFastener.material} | Length: ${newFastener.standardLength}mm`);

    // Store mapping for later (we'll need this to re-link formulas and variations)
    fastenerIdMap.set(fastener.genericName, newFastener.id);

    idx++;
  }

  console.log('\n========================================');
  console.log('  Repopulation Summary');
  console.log('========================================');
  console.log(`✓ Removed old fasteners: ${deletedFasteners.count}`);
  console.log(`✓ Created new fasteners: ${allFasteners.size}`);
  console.log('========================================\n');

  console.log('⚠️  IMPORTANT: You need to re-run:');
  console.log('   - 02_migrate_formulas.js (to re-link formulas)');
  console.log('   - 03_migrate_variation_items.js (to re-link variation items)\n');
}

main()
  .catch((error) => {
    console.error('\n❌ Repopulation failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
