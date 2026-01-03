/**
 * Extract profiles needed for first 8 BOM variations
 * Reads the variation Excel and creates a filtered list
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function getVariationProfiles() {
  try {
    console.log('🚀 Extracting profiles for first 8 variations...\n');

    // Read the variations Excel
    const excelPath = path.join(__dirname, '..', 'Long Rail MMS Variants_8_types.xlsx');
    const workbook = XLSX.readFile(excelPath);

    const codesUsed = new Set();

    // Process sheets 1-8 (the 8 variations)
    for (let i = 1; i <= 8; i++) {
      const sheetName = i.toString();
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const variationName = data[0][0];
      console.log(`📋 Processing: ${variationName}`);

      // Start from row 2 (skip headers)
      for (let j = 2; j < data.length; j++) {
        const row = data[j];
        if (row && row[1]) { // Column 1 is Sunrack Code
          const code = String(row[1]).trim();
          if (code && code !== 'N/A') {
            codesUsed.add(code);
          }
        }
      }
    }

    console.log(`\n✓ Found ${codesUsed.size} unique codes across 8 variations\n`);
    console.log('Codes found:', Array.from(codesUsed).sort().join(', '));

    // Now match these codes to profiles in database
    console.log('\n🔍 Matching codes to profiles in database...\n');

    const allProfiles = await prisma.sunrackProfile.findMany({
      orderBy: { sNo: 'asc' }
    });

    const matchedProfiles = [];
    const unmatchedCodes = [];

    codesUsed.forEach(code => {
      // Normalize code: remove dashes, normalize spaces, trim
      // "MA -43" or "MA - 43" becomes "MA 43"
      const normalizedCode = code.replace(/-/g, '').replace(/\s+/g, ' ').trim();

      // Try to find matching profile (normalize database codes too)
      const profile = allProfiles.find(p => {
        const normalize = (c) => c ? c.replace(/-/g, '').replace(/\s+/g, ' ').trim() : null;
        return (
          normalize(p.regalCode) === normalizedCode ||
          normalize(p.excellenceCode) === normalizedCode ||
          normalize(p.varnCode) === normalizedCode ||
          normalize(p.rcCode) === normalizedCode ||
          normalize(p.snalcoCode) === normalizedCode ||
          normalize(p.darshanCode) === normalizedCode ||
          normalize(p.jmCode) === normalizedCode ||
          normalize(p.ralcoCode) === normalizedCode ||
          normalize(p.saiDeepCode) === normalizedCode ||
          normalize(p.eleanorCode) === normalizedCode
        );
      });

      if (profile) {
        // Determine which code matched and get the image filename
        let imageCode, codeSource;

        if (profile.regalCode) {
          imageCode = profile.regalCode.replace(/\s+/g, '-');
          codeSource = 'Regal';
        } else if (profile.excellenceCode) {
          imageCode = profile.excellenceCode.replace(/\s+/g, '-');
          codeSource = 'Excellence';
        } else if (profile.varnCode) {
          imageCode = profile.varnCode.replace(/\s+/g, '-');
          codeSource = 'VARN';
        } else if (profile.rcCode) {
          imageCode = profile.rcCode.replace(/\s+/g, '-');
          codeSource = 'RC';
        } else if (profile.snalcoCode) {
          imageCode = profile.snalcoCode.replace(/\s+/g, '-');
          codeSource = 'SNALCO';
        }

        matchedProfiles.push({
          excelCode: code,
          sNo: profile.sNo,
          imageFilename: `${imageCode}.png`,
          codeSource: codeSource,
          regalCode: profile.regalCode || '-',
          genericName: profile.genericName,
          profileDescription: profile.profileDescription
        });
      } else {
        unmatchedCodes.push(code);
      }
    });

    console.log(`✓ Matched: ${matchedProfiles.length} profiles`);
    console.log(`⚠️  Unmatched: ${unmatchedCodes.length} codes\n`);

    if (unmatchedCodes.length > 0) {
      console.log('Unmatched codes (might be typos or missing):');
      unmatchedCodes.forEach(code => console.log(`  - ${code}`));
      console.log('');
    }

    // Sort by image filename for easier reference
    matchedProfiles.sort((a, b) => a.imageFilename.localeCompare(b.imageFilename));

    // Generate text output
    let textContent = '='.repeat(120) + '\n';
    textContent += 'PROFILES NEEDED FOR FIRST 8 BOM VARIATIONS\n';
    textContent += '='.repeat(120) + '\n\n';
    textContent += `Total profiles to rename: ${matchedProfiles.length}\n\n`;
    textContent += 'Save images with these exact filenames in: backend/assets/profile-images/\n\n';
    textContent += '='.repeat(120) + '\n\n';

    textContent += `${'Image Filename'.padEnd(25)}| ${'Excel Code'.padEnd(12)}| ${'Source'.padEnd(12)}| Generic Name\n`;
    textContent += '-'.repeat(120) + '\n';

    matchedProfiles.forEach(p => {
      textContent += `${p.imageFilename.padEnd(25)}| ${p.excelCode.padEnd(12)}| ${p.codeSource.padEnd(12)}| ${p.genericName}\n`;
    });

    textContent += '\n' + '='.repeat(120) + '\n\n';
    textContent += 'QUICK CHECKLIST:\n';
    textContent += '-'.repeat(120) + '\n';
    matchedProfiles.forEach((p, idx) => {
      textContent += `☐ ${(idx + 1).toString().padStart(2)}. ${p.imageFilename.padEnd(25)} (${p.genericName})\n`;
    });

    // Save files
    const txtPath = path.join(__dirname, '..', 'VARIATION_PROFILES_NEEDED.txt');
    fs.writeFileSync(txtPath, textContent, 'utf8');
    console.log(`✅ Text file saved: ${txtPath}`);

    const jsonPath = path.join(__dirname, '..', 'VARIATION_PROFILES_NEEDED.json');
    fs.writeFileSync(jsonPath, JSON.stringify(matchedProfiles, null, 2), 'utf8');
    console.log(`✅ JSON file saved: ${jsonPath}`);

    const csvContent = 'Image Filename,Excel Code,Source,Regal Code,Generic Name,Profile Description\n' +
      matchedProfiles.map(p =>
        `"${p.imageFilename}","${p.excelCode}","${p.codeSource}","${p.regalCode}","${p.genericName}","${p.profileDescription}"`
      ).join('\n');
    const csvPath = path.join(__dirname, '..', 'VARIATION_PROFILES_NEEDED.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    console.log(`✅ CSV file saved: ${csvPath}`);

    console.log('\n📊 Summary:');
    console.log(`   Total profiles needed: ${matchedProfiles.length}`);
    console.log(`   Unmatched codes: ${unmatchedCodes.length}`);

    console.log('\n✨ Files generated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

getVariationProfiles()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
