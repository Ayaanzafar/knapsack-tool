const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const prisma = new PrismaClient();

/**
 * Script to add C45 Long Rail variations
 * 1. Add 2 missing profiles (C45 Rail, LA 35x45x1.2 Jointer)
 * 2. Add 3 missing fasteners
 * 3. Create 3 new templates
 * 4. Create variation items linking profiles/fasteners to templates
 */

async function main() {
  console.log('\n========================================');
  console.log('  Adding C45 Long Rail Variations');
  console.log('========================================\n');

  // =============================================
  // STEP 1: Add missing profiles
  // =============================================
  console.log('--- STEP 1: Adding Missing Profiles ---\n');

  // Get max sNo for new profiles
  const maxSnoResult = await prisma.sunrackProfile.aggregate({
    _max: { sNo: true }
  });
  let nextSNo = (maxSnoResult._max.sNo || 140) + 1;

  const profilesToAdd = [
    {
      sNo: nextSNo++,
      regalCode: null,
      excellenceCode: null,
      varnCode: null,
      rcCode: null,
      snalcoCode: null,
      darshanCode: null,
      jmCode: null,
      ralcoCode: 'C45 Rail',  // Using as the code
      saiDeepCode: null,
      eleanorCode: null,
      profileDescription: 'C45 Rail - Magnelis Long Rail',
      genericName: 'C45 Rail',
      designWeight: 1.21,
      material: 'Magnelis',
      standardLength: null,  // Cut length from calculation
      uom: 'Nos',
      category: 'Profile'
    },
    {
      sNo: nextSNo++,
      regalCode: null,
      excellenceCode: null,
      varnCode: null,
      rcCode: null,
      snalcoCode: null,
      darshanCode: null,
      jmCode: null,
      ralcoCode: 'LA 35x45x1.2',  // Using as the code
      saiDeepCode: null,
      eleanorCode: null,
      profileDescription: 'Jointer for C45 Magnelis Long Rail',
      genericName: 'C45 Magnelis Jointer',
      designWeight: 0.50,
      material: 'Magnelis',
      standardLength: 150,
      uom: 'Nos',
      category: 'Profile'
    }
  ];

  const addedProfiles = [];
  for (const profile of profilesToAdd) {
    // Check if already exists
    const existing = await prisma.sunrackProfile.findFirst({
      where: {
        OR: [
          { ralcoCode: profile.ralcoCode },
          { genericName: profile.genericName }
        ]
      }
    });

    if (existing) {
      console.log(`  Profile already exists: ${profile.genericName} (ID: ${existing.id})`);
      addedProfiles.push(existing);
    } else {
      const created = await prisma.sunrackProfile.create({ data: profile });
      console.log(`  Created profile: ${profile.genericName} (ID: ${created.id}, sNo: ${created.sNo})`);
      addedProfiles.push(created);
    }
  }

  // =============================================
  // STEP 2: Add missing fasteners
  // =============================================
  console.log('\n--- STEP 2: Adding Missing Fasteners ---\n');

  const fastenersToAdd = [
    {
      itemDescription: 'M8 Allen Head Bolt for Latch',
      genericName: 'M8 Allen Head Bolt for Latch',
      material: 'SS304',
      standardLength: 16,
      uom: 'Nos',
      category: 'FASTENER',
      costPerPiece: 30.00,
      isActive: true
    },
    {
      itemDescription: 'M8 Allen Head Bolt with Spring Washer',
      genericName: 'M8 Allen Head Bolt with Spring Washer - 40mm',
      material: 'SS304',
      standardLength: 40,
      uom: 'Nos',
      category: 'FASTENER',
      costPerPiece: 30.00,
      isActive: true
    },
    {
      itemDescription: 'M8 Allen Head Bolt with Spring Washer',
      genericName: 'M8 Allen Head Bolt with Spring Washer - 45mm',
      material: 'SS304',
      standardLength: 45,
      uom: 'Nos',
      category: 'FASTENER',
      costPerPiece: 30.00,
      isActive: true
    }
  ];

  const addedFasteners = [];
  for (const fastener of fastenersToAdd) {
    // Check if already exists by generic name and length
    const existing = await prisma.fastener.findFirst({
      where: {
        genericName: fastener.genericName,
        standardLength: fastener.standardLength
      }
    });

    if (existing) {
      console.log(`  Fastener already exists: ${fastener.genericName} (ID: ${existing.id})`);
      addedFasteners.push(existing);
    } else {
      const created = await prisma.fastener.create({ data: fastener });
      console.log(`  Created fastener: ${fastener.genericName} (ID: ${created.id})`);
      addedFasteners.push(created);
    }
  }

  // =============================================
  // STEP 3: Create templates
  // =============================================
  console.log('\n--- STEP 3: Creating Templates ---\n');

  const templatesToCreate = [
    {
      variationName: 'C45 Long Rail',
      defaultNotes: [
        'This BOM is for C45 Long Rail',
        'Purlin to Purlin distance assumed to be 1500mm',
        'All items are as per standard specifications'
      ],
      order: 'standard',
      isActive: true
    },
    {
      variationName: 'C45 Long Rail - Asbestos',
      defaultNotes: [
        'This BOM is for C45 Long Rail - Asbestos',
        'Purlin to Purlin distance assumed to be 1500mm',
        'All items are as per standard specifications'
      ],
      order: 'standard',
      isActive: true
    },
    {
      variationName: 'C45 Long Rail - Seam Clamp',
      defaultNotes: [
        'This BOM is for C45 Long Rail - Seam Clamp',
        'Purlin to Purlin distance assumed to be 1500mm',
        'All items are as per standard specifications'
      ],
      order: 'standard',
      isActive: true
    }
  ];

  const createdTemplates = [];
  for (const template of templatesToCreate) {
    const existing = await prisma.bomVariationTemplate.findUnique({
      where: { variationName: template.variationName }
    });

    if (existing) {
      console.log(`  Template already exists: ${template.variationName} (ID: ${existing.id})`);
      createdTemplates.push(existing);
    } else {
      const created = await prisma.bomVariationTemplate.create({ data: template });
      console.log(`  Created template: ${template.variationName} (ID: ${created.id})`);
      createdTemplates.push(created);
    }
  }

  // =============================================
  // STEP 4: Create variation items
  // =============================================
  console.log('\n--- STEP 4: Creating Variation Items ---\n');

  // Helper function to normalize codes for matching
  const normalizeCode = (code) => {
    if (!code) return '';
    return code.toString().trim().toUpperCase().replace(/\s*-\s*/g, ' ').replace(/\s+/g, ' ');
  };

  // Get all profiles for matching
  const allProfiles = await prisma.sunrackProfile.findMany();
  const allFasteners = await prisma.fastener.findMany();

  // Function to find profile by code
  const findProfileByCode = (code) => {
    const normalizedCode = normalizeCode(code);
    return allProfiles.find(p => {
      const codes = [
        p.regalCode, p.excellenceCode, p.varnCode, p.rcCode,
        p.snalcoCode, p.darshanCode, p.jmCode, p.ralcoCode,
        p.saiDeepCode, p.eleanorCode
      ].filter(Boolean).map(c => normalizeCode(c));
      return codes.includes(normalizedCode);
    });
  };

  // Function to find fastener by description and length
  const findFastener = (description, length) => {
    // Normalize the search string - remove extra spaces, trim
    const normalizedDesc = description.toLowerCase().replace(/\s+/g, ' ').trim();
    const lengthNum = parseInt(length) || null;

    return allFasteners.find(f => {
      const fDesc = (f.itemDescription || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const fGeneric = (f.genericName || '').toLowerCase().replace(/\s+/g, ' ').trim();

      // Check for length match first if length is specified
      if (lengthNum && f.standardLength) {
        // Must match length
        if (f.standardLength !== lengthNum) return false;
      }

      // Check description match
      const searchStr = normalizedDesc.substring(0, 20);
      const descMatch = fDesc.includes(searchStr) || fGeneric.includes(searchStr);

      // Special handling for "M8x16" format vs "M8 Allen Head Bolt for Latch"
      if (normalizedDesc.includes('m8x16') || normalizedDesc.includes('latch')) {
        if (fGeneric.includes('latch') || fDesc.includes('latch')) {
          return true;
        }
      }

      return descMatch;
    });
  };

  // Read Excel to get variation items
  const excelPath = path.join(__dirname, '../../Long Rail MMS Variants_2.xlsx');
  const workbook = XLSX.readFile(excelPath);

  const sheetMapping = {
    '9': 'C45 Long Rail',
    '10': 'C45 Long Rail - Asbestos',
    '11': 'C45 Long Rail - Seam Clamp'
  };

  let totalItemsCreated = 0;

  for (const [sheetNum, variationName] of Object.entries(sheetMapping)) {
    console.log(`\n  Processing: ${variationName}`);

    const template = createdTemplates.find(t => t.variationName === variationName);
    if (!template) {
      console.log(`    Template not found for ${variationName}`);
      continue;
    }

    const sheet = workbook.Sheets[sheetNum];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Find header row
    let headerRowIdx = -1;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row && row.some(cell => cell?.toString()?.trim() === 'S.N')) {
        headerRowIdx = i;
        break;
      }
    }

    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 4;

    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const snCell = row[1]?.toString()?.trim() || '';
      if (!snCell || snCell.toLowerCase().startsWith('note') || snCell.length > 5) continue;

      const sn = parseInt(row[1]) || null;
      if (!sn || isNaN(sn)) continue;

      const sunrackCode = row[2]?.toString()?.trim() || '';
      const itemDesc = row[4]?.toString()?.trim() || '';
      const length = row[6];

      const isProfile = sunrackCode && sunrackCode.length > 0;

      let variationItemData = {
        templateId: template.id,
        sunrackProfileId: null,
        fastenerId: null,
        displayOverride: itemDesc,
        formulaKey: null
      };

      if (isProfile) {
        const profile = findProfileByCode(sunrackCode);
        if (profile) {
          variationItemData.sunrackProfileId = profile.id;

          // Set formula key based on item
          if (itemDesc.toLowerCase().includes('rail') && !itemDesc.toLowerCase().includes('nut')) {
            variationItemData.formulaKey = 'C45_RAIL';
          } else if (itemDesc.toLowerCase().includes('base')) {
            variationItemData.formulaKey = 'C45_BASE';
          } else if (itemDesc.toLowerCase().includes('latch')) {
            variationItemData.formulaKey = 'C45_LATCH';
          } else if (itemDesc.toLowerCase().includes('jointer')) {
            variationItemData.formulaKey = 'RAIL_JOINTER';
          } else if (itemDesc.toLowerCase().includes('end clamp')) {
            variationItemData.formulaKey = 'END_CLAMP';
          } else if (itemDesc.toLowerCase().includes('mid clamp')) {
            variationItemData.formulaKey = 'MID_CLAMP';
          } else if (itemDesc.toLowerCase().includes('rail nut')) {
            variationItemData.formulaKey = 'RAIL_NUT';
          } else if (itemDesc.toLowerCase().includes('asbestos') || itemDesc.toLowerCase().includes('curved base')) {
            variationItemData.formulaKey = 'ASBESTOS_BASE';
          } else if (itemDesc.toLowerCase().includes('seam clamp')) {
            variationItemData.formulaKey = 'SEAM_CLAMP';
          }
        } else {
          console.log(`    Warning: Profile not found for code: ${sunrackCode}`);
          continue;
        }
      } else {
        // Fastener
        const lengthNum = parseInt(length) || null;
        const fastener = findFastener(itemDesc, lengthNum);
        if (fastener) {
          variationItemData.fastenerId = fastener.id;

          // Set formula key based on fastener
          if (itemDesc.toLowerCase().includes('hex head fastener set')) {
            variationItemData.formulaKey = 'M8x60_BOLT';
          } else if (itemDesc.toLowerCase().includes('allen head bolt') && itemDesc.toLowerCase().includes('latch')) {
            variationItemData.formulaKey = 'M8_LATCH_BOLT';
          } else if (itemDesc.toLowerCase().includes('allen head bolt') && lengthNum === 40) {
            variationItemData.formulaKey = 'M8x40_ALLEN_BOLT';
          } else if (itemDesc.toLowerCase().includes('allen head bolt') && lengthNum === 45) {
            variationItemData.formulaKey = 'M8x45_ALLEN_BOLT';
          } else if (itemDesc.toLowerCase().includes('4.2x19')) {
            variationItemData.formulaKey = 'SDS_4_2X19MM';
          } else if (itemDesc.toLowerCase().includes('5.5x63')) {
            variationItemData.formulaKey = 'SDS_5_5X63MM';
          } else if (itemDesc.toLowerCase().includes('rubber pad')) {
            variationItemData.formulaKey = 'RUBBER_PAD';
          } else if (itemDesc.toLowerCase().includes('grub screw')) {
            variationItemData.formulaKey = 'M8_GRUB_SCREW';
          }
        } else {
          console.log(`    Warning: Fastener not found: ${itemDesc} (length: ${lengthNum})`);
          continue;
        }
      }

      // Check if variation item already exists FOR THIS SPECIFIC TEMPLATE
      let existingItem = null;
      if (variationItemData.sunrackProfileId) {
        existingItem = await prisma.bomVariationItem.findFirst({
          where: {
            templateId: template.id,
            sunrackProfileId: variationItemData.sunrackProfileId
          }
        });
      } else if (variationItemData.fastenerId) {
        existingItem = await prisma.bomVariationItem.findFirst({
          where: {
            templateId: template.id,
            fastenerId: variationItemData.fastenerId
          }
        });
      }

      if (existingItem) {
        console.log(`    Item already exists: ${itemDesc.substring(0, 40)}`);
      } else {
        await prisma.bomVariationItem.create({ data: variationItemData });
        console.log(`    Created: ${itemDesc.substring(0, 40)} (Formula: ${variationItemData.formulaKey || 'N/A'})`);
        totalItemsCreated++;
      }
    }
  }

  // =============================================
  // SUMMARY
  // =============================================
  console.log('\n========================================');
  console.log('  SUMMARY');
  console.log('========================================');
  console.log(`  Profiles added/found: ${addedProfiles.length}`);
  console.log(`  Fasteners added/found: ${addedFasteners.length}`);
  console.log(`  Templates created/found: ${createdTemplates.length}`);
  console.log(`  Variation items created: ${totalItemsCreated}`);
  console.log('========================================\n');

  console.log('NEXT STEP: Enable C45 options in frontend by removing "disabled: true"');
  console.log('File: knapsack-front/src/constants/longRailVariation.js');
  console.log('Lines 27-29: Remove "disabled: true" from C45 options\n');
}

main()
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
