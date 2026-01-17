const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const prisma = new PrismaClient();

/**
 * Script to set sort_order for all variation items
 * - For templates 1-8: Use existing ID order (they were added in sequence)
 * - For templates 9-11 (C45): Read from Excel to get exact order
 */

async function main() {
  console.log('\n========================================');
  console.log('  Setting Sort Order for Variation Items');
  console.log('========================================\n');

  // =============================================
  // STEP 1: Update templates 1-8 based on ID order
  // =============================================
  console.log('--- STEP 1: Updating Templates 1-8 ---\n');

  for (let templateId = 1; templateId <= 8; templateId++) {
    const items = await prisma.bomVariationItem.findMany({
      where: { templateId },
      orderBy: { id: 'asc' }
    });

    console.log(`Template ${templateId}: ${items.length} items`);

    for (let i = 0; i < items.length; i++) {
      await prisma.bomVariationItem.update({
        where: { id: items[i].id },
        data: { sortOrder: i + 1 }
      });
    }
  }

  // =============================================
  // STEP 2: Update C45 templates from Excel
  // =============================================
  console.log('\n--- STEP 2: Updating C45 Templates (9-11) from Excel ---\n');

  const excelPath = path.join(__dirname, '../../Long Rail MMS Variants_2.xlsx');
  let workbook;
  try {
    workbook = XLSX.readFile(excelPath);
  } catch (error) {
    console.error('Error reading Excel file:', error.message);
    console.log('Falling back to ID-based order for C45 templates');

    // Fallback: use ID order for C45 templates too
    for (let templateId = 9; templateId <= 11; templateId++) {
      const items = await prisma.bomVariationItem.findMany({
        where: { templateId },
        orderBy: { id: 'asc' }
      });
      console.log(`Template ${templateId}: ${items.length} items (fallback order)`);
      for (let i = 0; i < items.length; i++) {
        await prisma.bomVariationItem.update({
          where: { id: items[i].id },
          data: { sortOrder: i + 1 }
        });
      }
    }

    await prisma.$disconnect();
    return;
  }

  const c45Mapping = {
    '9': { templateId: 9, name: 'C45 Long Rail' },
    '10': { templateId: 10, name: 'C45 Long Rail - Asbestos' },
    '11': { templateId: 11, name: 'C45 Long Rail - Seam Clamp' }
  };

  // Helper to normalize codes
  const normalizeCode = (code) => {
    if (!code) return '';
    return code.toString().trim().toUpperCase().replace(/\s*-\s*/g, ' ').replace(/\s+/g, ' ');
  };

  for (const [sheetNum, config] of Object.entries(c45Mapping)) {
    const sheet = workbook.Sheets[sheetNum];
    if (!sheet) {
      console.log(`Sheet ${sheetNum} not found, skipping`);
      continue;
    }

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Find header row
    let headerRowIdx = -1;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row && row.some(cell => cell && cell.toString().trim() === 'S.N')) {
        headerRowIdx = i;
        break;
      }
    }

    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 4;

    // Build order map from Excel: { sunrackCode/description -> sortOrder }
    const excelOrder = [];
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const snCell = row[1]?.toString()?.trim() || '';
      if (!snCell || snCell.toLowerCase().startsWith('note') || snCell.length > 5) continue;

      const sn = parseInt(row[1]) || null;
      if (!sn || isNaN(sn)) continue;

      const sunrackCode = row[2]?.toString()?.trim() || '';
      const itemDesc = row[4]?.toString()?.trim() || '';

      excelOrder.push({
        sortOrder: sn,
        sunrackCode: normalizeCode(sunrackCode),
        itemDesc: itemDesc.toLowerCase()
      });
    }

    console.log(`\nTemplate ${config.templateId} (${config.name}): ${excelOrder.length} items in Excel`);

    // Get all variation items for this template with their profile/fastener data
    const items = await prisma.bomVariationItem.findMany({
      where: { templateId: config.templateId },
      include: {
        sunrackProfile: true,
        fastener: true
      }
    });

    // Match and update sort order
    for (const item of items) {
      const profile = item.sunrackProfile;
      const fastener = item.fastener;

      let matchedOrder = null;

      if (profile) {
        // Try to match by sunrack code
        const profileCodes = [
          profile.regalCode, profile.ralcoCode, profile.snalcoCode,
          profile.excellenceCode, profile.varnCode
        ].filter(Boolean).map(c => normalizeCode(c));

        for (const excelItem of excelOrder) {
          if (excelItem.sunrackCode && profileCodes.includes(excelItem.sunrackCode)) {
            matchedOrder = excelItem.sortOrder;
            break;
          }
        }

        // Fallback: match by name
        if (!matchedOrder) {
          const profileName = (profile.genericName || '').toLowerCase();
          for (const excelItem of excelOrder) {
            if (excelItem.itemDesc && profileName.includes(excelItem.itemDesc.substring(0, 15))) {
              matchedOrder = excelItem.sortOrder;
              break;
            }
          }
        }
      } else if (fastener) {
        // Match fastener by description
        const fastenerDesc = (fastener.genericName || fastener.itemDescription || '').toLowerCase();
        for (const excelItem of excelOrder) {
          if (!excelItem.sunrackCode && excelItem.itemDesc) {
            // Fastener - no sunrack code
            if (fastenerDesc.includes(excelItem.itemDesc.substring(0, 15)) ||
                excelItem.itemDesc.includes(fastenerDesc.substring(0, 15))) {
              matchedOrder = excelItem.sortOrder;
              break;
            }
          }
        }
      }

      if (matchedOrder) {
        await prisma.bomVariationItem.update({
          where: { id: item.id },
          data: { sortOrder: matchedOrder }
        });
        const name = profile?.genericName || fastener?.genericName || item.displayOverride;
        console.log(`  ${matchedOrder}. ${name?.substring(0, 40)}`);
      } else {
        // Fallback: use a high number
        const name = profile?.genericName || fastener?.genericName || item.displayOverride;
        console.log(`  ?? ${name?.substring(0, 40)} (no match found)`);
      }
    }
  }

  // =============================================
  // VERIFICATION
  // =============================================
  console.log('\n--- VERIFICATION ---\n');

  const allTemplates = await prisma.bomVariationTemplate.findMany({
    include: {
      variationItems: {
        orderBy: { sortOrder: 'asc' }
      }
    }
  });

  for (const template of allTemplates) {
    console.log(`Template ${template.id} (${template.variationName}): ${template.variationItems.length} items`);
    template.variationItems.forEach((item, idx) => {
      console.log(`  ${item.sortOrder}. ${item.displayOverride?.substring(0, 40) || 'N/A'}`);
    });
    console.log('');
  }

  console.log('========================================');
  console.log('  Sort order update complete!');
  console.log('========================================\n');

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
