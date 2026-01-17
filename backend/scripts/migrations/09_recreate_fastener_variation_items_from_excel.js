const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const prisma = new PrismaClient();

async function main() {
  console.log('\n========================================');
  console.log('  STEP 9: Recreate Fastener Variation Items from Excel');
  console.log('========================================\n');

  // Read Excel file
  const workbook = XLSX.readFile('Long Rail MMS Variants_8_types.xlsx');

  const variationMapping = {
    '1': 'U Cleat Long Rail - Regular',
    '2': 'U Cleat Long Rail - Regular - Asbestos',
    '3': 'U Cleat Long Rail - Regular - Seam Clamp',
    '4': 'U Cleat Long Rail - Large Span/Height',
    '5': 'U Cleat Long Rail - Large Span - Asbestos',
    '6': 'U Cleat Long Rail - Large Height - Seam Clamp',
    '7': 'Double U Cleat Long Rail -160mm Height',
    '8': 'Double U Cleat Long Rail -180mm Height'
  };

  let totalCreated = 0;
  let errorCount = 0;

  // Read sheets 1-8 (the 8 variations)
  for (let sheetNum = 1; sheetNum <= 8; sheetNum++) {
    const sheet = workbook.Sheets[sheetNum.toString()];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const variationName = variationMapping[sheetNum];

    console.log(`\n--- Processing: ${variationName} ---`);

    // Find the template
    const template = await prisma.bomVariationTemplate.findUnique({
      where: { variationName }
    });

    if (!template) {
      console.error(`✗ Template not found: ${variationName}`);
      errorCount++;
      continue;
    }

    // Parse rows (skip header rows 0, 1)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) break;

      const sn = row[0];
      const sunrackCode = row[1];
      const itemDesc = row[3];
      const length = row[5];

      // Fasteners have empty sunrackCode
      if (itemDesc && (!sunrackCode || sunrackCode.toString().trim() === '')) {
        try {
          // Extract length for matching
          let standardLength = length;
          if (!standardLength) {
            const match = itemDesc.match(/(\d+\.?\d*)[xX×](\d+)/);
            if (match) {
              standardLength = parseInt(match[2]);
            }
          }

          // Find the fastener
          const fastener = await prisma.fastener.findFirst({
            where: {
              genericName: { contains: itemDesc.trim().substring(0, 30) },
              standardLength: standardLength ? parseInt(standardLength) : null
            }
          });

          if (!fastener) {
            console.error(`  ✗ Fastener not found: ${itemDesc.substring(0, 40)}`);
            errorCount++;
            continue;
          }

          // Check if already exists
          const existing = await prisma.bomVariationItem.findFirst({
            where: {
              templateId: template.id,
              fastenerId: fastener.id
            }
          });

          if (existing) {
            console.log(`  ⊙ Exists: ${fastener.genericName.substring(0, 40)}`);
            continue;
          }

          // Determine formula key based on fastener
          let formulaKey = null;
          if (fastener.genericName.includes('M8 Hex Head Fastener Set') && fastener.standardLength === 65) {
            formulaKey = 'M8x60_BOLT';
          } else if (fastener.genericName.includes('M8 Hex Head Fastener Set') && fastener.standardLength === 60) {
            formulaKey = 'M8x60_BOLT_SHORT';
          } else if (fastener.genericName.includes('Allen Head Bolt with Spring Washer') && fastener.standardLength === 20) {
            formulaKey = 'M8x20_BOLT';
          } else if (fastener.genericName.includes('Allen Head Bolt with Spring Washer') && fastener.standardLength === 25) {
            formulaKey = 'M8x25_BOLT';
          } else if (fastener.genericName.includes('4.2X19mm')) {
            formulaKey = 'SDS_4_2X13MM';
          } else if (fastener.genericName.includes('4.8X19mm')) {
            formulaKey = 'SDS_4_8X19MM';
          } else if (fastener.genericName.includes('5.5X63mm')) {
            formulaKey = 'SDS_5_5X63MM';
          } else if (fastener.genericName.includes('6.3X63mm')) {
            formulaKey = 'SDS_6_3X63MM';
          } else if (fastener.genericName.includes('Rubber Pad')) {
            formulaKey = 'RUBBER_PAD';
          } else if (fastener.genericName.includes('Plain & Spring Washer')) {
            formulaKey = 'M8_BOLT_PLAIN_SPRING';
          } else if (fastener.genericName.includes('Grub Screw')) {
            formulaKey = 'M8_GRUB_SCREW';
          }

          // Create variation item
          await prisma.bomVariationItem.create({
            data: {
              templateId: template.id,
              fastenerId: fastener.id,
              formulaKey: formulaKey,
              sortOrder: parseInt(sn) || 0  // Use S.N from Excel as sort order
            }
          });

          totalCreated++;
          console.log(`  ✓ Created: ${fastener.genericName.substring(0, 40)} (Formula: ${formulaKey})`);
        } catch (error) {
          errorCount++;
          console.error(`  ✗ Error: ${itemDesc.substring(0, 40)} - ${error.message}`);
        }
      }
    }
  }

  console.log('\n========================================');
  console.log('  Summary');
  console.log('========================================');
  console.log(`✓ Created: ${totalCreated}`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log('========================================\n');

  if (errorCount > 0) {
    throw new Error(`Recreation completed with ${errorCount} errors`);
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Recreation failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
