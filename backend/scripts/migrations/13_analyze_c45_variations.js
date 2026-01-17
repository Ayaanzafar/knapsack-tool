const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const prisma = new PrismaClient();

/**
 * Script to analyze C45 Long Rail variations from Excel file
 * Reads tabs 9, 10, 11 from Long Rail MMS Variants_2.xlsx
 * Reports which items exist and which need to be added
 */

async function main() {
  console.log('\n========================================');
  console.log('  Analyzing C45 Long Rail Variations');
  console.log('  From: Long Rail MMS Variants_2.xlsx');
  console.log('========================================\n');

  // Read Excel file
  const excelPath = path.join(__dirname, '../../Long Rail MMS Variants_2.xlsx');
  console.log(`Reading Excel file: ${excelPath}\n`);

  let workbook;
  try {
    workbook = XLSX.readFile(excelPath);
  } catch (error) {
    console.error('Error reading Excel file:', error.message);
    process.exit(1);
  }

  // List all sheet names
  console.log('Available sheets in Excel:');
  workbook.SheetNames.forEach((name, idx) => {
    console.log(`  ${idx + 1}. "${name}"`);
  });
  console.log('');

  // Mapping for C45 variations - using sheet names (10th, 11th, 12th in array = index 9, 10, 11)
  const variationMapping = {
    '9': 'C45 Long Rail',           // Sheet named "9"
    '10': 'C45 Long Rail - Asbestos',
    '11': 'C45 Long Rail - Seam Clamp'
  };

  // Get existing profiles and fasteners from database
  const existingProfiles = await prisma.sunrackProfile.findMany();
  const existingFasteners = await prisma.fastener.findMany();
  const existingTemplates = await prisma.bomVariationTemplate.findMany();

  console.log('Current Database State:');
  console.log(`  - Profiles: ${existingProfiles.length}`);
  console.log(`  - Fasteners: ${existingFasteners.length}`);
  console.log(`  - Templates: ${existingTemplates.length}`);
  console.log('');

  // Check if C45 templates already exist
  console.log('Checking for existing C45 templates:');
  for (const [sheetNum, variationName] of Object.entries(variationMapping)) {
    const exists = existingTemplates.find(t => t.variationName === variationName);
    console.log(`  ${variationName}: ${exists ? '✓ EXISTS (ID: ' + exists.id + ')' : '✗ NOT FOUND - needs to be created'}`);
  }
  console.log('');

  // Analyze each C45 sheet
  const allItems = {};
  const missingProfiles = [];
  const missingFasteners = [];
  const foundProfiles = [];
  const foundFasteners = [];

  for (const [sheetNum, variationName] of Object.entries(variationMapping)) {
    console.log(`\n========================================`);
    console.log(`  Sheet ${sheetNum}: ${variationName}`);
    console.log(`========================================`);

    // Get sheet by name (sheets are named "9", "10", "11")
    const sheet = workbook.Sheets[sheetNum];

    if (!sheet) {
      console.error(`  ✗ Sheet "${sheetNum}" not found!`);
      continue;
    }

    // Parse sheet data
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Show first 10 rows to understand structure
    console.log('\nFirst 10 rows (raw data):');
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i] || [];
      console.log(`  Row ${i}: ${JSON.stringify(row.slice(0, 10))}`);
    }

    // Find the header row (contains "S.N" or similar)
    let headerRowIdx = -1;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row && row.some(cell => cell?.toString()?.trim() === 'S.N' || cell?.toString()?.trim() === 'S.N.')) {
        headerRowIdx = i;
        break;
      }
    }

    console.log(`\nHeader row found at index: ${headerRowIdx}`);
    if (headerRowIdx >= 0) {
      console.log(`Header: ${JSON.stringify(data[headerRowIdx])}`);
    }

    console.log('\n--- Parsed Items ---');
    console.log('-'.repeat(120));
    console.log(`${'S.N'.padEnd(5)} | ${'Sunrack Code'.padEnd(15)} | ${'Profile'.padEnd(25)} | ${'Item Description'.padEnd(30)} | ${'Material'.padEnd(12)} | ${'Length'.padEnd(8)} | Status`);
    console.log('-'.repeat(120));

    const items = [];

    // Parse rows starting from headerRowIdx + 1
    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 4;
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      // Data is offset by 1 column (column 0 is empty)
      // Skip empty rows or notes
      const snCell = row[1]?.toString()?.trim() || '';
      if (!snCell || snCell.toLowerCase().startsWith('note') || snCell.length > 5) continue;

      // Parse based on actual structure (offset by 1):
      // Col 0: empty, Col 1: S.N, Col 2: Sunrack Code, Col 3: Profile (empty), Col 4: Item Description, Col 5: Material, Col 6: Length, Col 7: UoM
      const sn = parseInt(row[1]) || null;
      if (!sn || isNaN(sn)) continue;  // Must have a valid serial number

      const sunrackCode = row[2]?.toString()?.trim() || '';
      const profile = row[3]?.toString()?.trim() || '';
      const itemDesc = row[4]?.toString()?.trim() || '';
      const material = row[5]?.toString()?.trim() || '';
      const length = row[6];
      const uom = row[7]?.toString()?.trim() || '';

      const item = {
        sn,
        sunrackCode,
        profile,
        itemDescription: itemDesc,
        material,
        length,
        uom,
        isProfile: sunrackCode && sunrackCode.length > 0,
        isFastener: !sunrackCode || sunrackCode.length === 0
      };
      items.push(item);

      // Check if item exists in database
      let status = '';
      let statusSymbol = '';

      if (item.isProfile) {
        // Normalize code for comparison (remove hyphens, extra spaces)
        const normalizeCode = (code) => {
          if (!code) return '';
          return code.toString().trim().toUpperCase().replace(/\s*-\s*/g, ' ').replace(/\s+/g, ' ');
        };

        const normalizedSearchCode = normalizeCode(sunrackCode);

        // Check by sunrack code (try different vendor code columns)
        const foundProfile = existingProfiles.find(p => {
          const codes = [
            p.regalCode, p.excellenceCode, p.varnCode, p.rcCode,
            p.snalcoCode, p.darshanCode, p.jmCode, p.ralcoCode,
            p.saiDeepCode, p.eleanorCode
          ].filter(Boolean).map(c => normalizeCode(c));
          return codes.includes(normalizedSearchCode);
        });

        if (foundProfile) {
          status = `Found (ID: ${foundProfile.id}, sNo: ${foundProfile.sNo})`;
          statusSymbol = '✓';
          if (!foundProfiles.find(f => f.dbId === foundProfile.id)) {
            foundProfiles.push({ ...item, dbId: foundProfile.id, dbSNo: foundProfile.sNo });
          }
        } else {
          status = 'MISSING - needs to be added';
          statusSymbol = '✗';
          if (!missingProfiles.find(m => m.sunrackCode === sunrackCode)) {
            missingProfiles.push(item);
          }
        }
      } else {
        // Fastener - check by description/generic name
        const searchStr = itemDesc.toLowerCase().substring(0, 20);
        const foundFastener = existingFasteners.find(f => {
          return f.itemDescription?.toLowerCase().includes(searchStr) ||
                 f.genericName?.toLowerCase().includes(searchStr);
        });

        if (foundFastener) {
          status = `Found (ID: ${foundFastener.id})`;
          statusSymbol = '✓';
          if (!foundFasteners.find(f => f.dbId === foundFastener.id)) {
            foundFasteners.push({ ...item, dbId: foundFastener.id });
          }
        } else {
          status = 'MISSING - needs to be added';
          statusSymbol = '✗';
          if (!missingFasteners.find(m => m.itemDescription === itemDesc)) {
            missingFasteners.push(item);
          }
        }
      }

      const snStr = (sn || '').toString().padEnd(5);
      const codeStr = sunrackCode.padEnd(15);
      const profStr = (profile.substring(0, 25)).padEnd(25);
      const descStr = (itemDesc.substring(0, 30)).padEnd(30);
      const matStr = (material || '-').padEnd(12);
      const lenStr = (length?.toString() || '-').padEnd(8);

      console.log(`${snStr} | ${codeStr} | ${profStr} | ${descStr} | ${matStr} | ${lenStr} | ${statusSymbol} ${status}`);
    }

    allItems[variationName] = items;
    console.log('-'.repeat(120));
    console.log(`Total valid items in this sheet: ${items.length}`);
  }

  // Summary
  console.log('\n\n========================================');
  console.log('  SUMMARY');
  console.log('========================================\n');

  console.log('Templates to create:');
  for (const [sheetNum, variationName] of Object.entries(variationMapping)) {
    const exists = existingTemplates.find(t => t.variationName === variationName);
    if (!exists) {
      console.log(`  - ${variationName}`);
    }
  }

  console.log(`\nProfiles found in DB: ${foundProfiles.length}`);
  foundProfiles.forEach(p => {
    console.log(`  ✓ ${p.sunrackCode} - ${p.itemDescription?.substring(0, 50)}`);
  });

  console.log(`\nProfiles MISSING (need to add to sunrack_profiles): ${missingProfiles.length}`);
  missingProfiles.forEach(p => {
    console.log(`  ✗ ${p.sunrackCode} - ${p.itemDescription} [Material: ${p.material || 'N/A'}]`);
  });

  console.log(`\nFasteners found in DB: ${foundFasteners.length}`);
  foundFasteners.forEach(f => {
    console.log(`  ✓ ${f.itemDescription?.substring(0, 60)}`);
  });

  console.log(`\nFasteners MISSING (need to add to fasteners): ${missingFasteners.length}`);
  missingFasteners.forEach(f => {
    console.log(`  ✗ ${f.itemDescription} [Material: ${f.material || 'N/A'}]`);
  });

  // Material types found
  const allMaterials = new Set();
  Object.values(allItems).forEach(items => {
    items.forEach(item => {
      if (item.material) allMaterials.add(item.material);
    });
  });

  console.log(`\nMaterial types found in C45 sheets:`);
  allMaterials.forEach(m => console.log(`  - ${m}`));

  console.log('\n========================================');
  console.log('  NEXT STEPS');
  console.log('========================================');
  console.log('1. Add missing profiles to sunrack_profiles table');
  console.log('2. Add missing fasteners to fasteners table');
  console.log('3. Create 3 new templates in bom_variation_templates');
  console.log('4. Create bom_variation_items linking items to templates');
  console.log('5. Enable C45 options in frontend longRailVariation.js');
  console.log('========================================\n');
}

main()
  .catch((error) => {
    console.error('\n Analysis failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
