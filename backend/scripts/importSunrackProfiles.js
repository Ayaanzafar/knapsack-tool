/**
 * Import Sunrack Profiles from Excel
 * Reads "All Profiles - 05-12-2025 - Product Codes.xlsx" and imports into sunrack_profiles table
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

async function importSunrackProfiles() {
  try {
    console.log('🚀 Starting Sunrack Profiles Import...\n');

    // Read Excel file
    const excelFilePath = path.join(__dirname, '..', 'All Profiles - 05-12-2025 - Product Codes.xlsx');
    console.log(`📂 Reading Excel file: ${excelFilePath}`);

    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = 'Profiles';
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    console.log(`✓ Excel file loaded: ${data.length} rows found\n`);

    // Header is row 0, manufacturer names in row 1, data starts from row 2
    const headerRow = data[0];
    const manufacturerRow = data[1];

    console.log('Column mapping:');
    console.log('  Col 0: S.No');
    console.log('  Col 1: Regal (MA)');
    console.log('  Col 2: Excellence (EX)');
    console.log('  Col 3: VARN (SR)');
    console.log('  Col 4: RC');
    console.log('  Col 5: SNALCO');
    console.log('  Col 6: Darshan');
    console.log('  Col 7: JM');
    console.log('  Col 8: Ralco');
    console.log('  Col 9: Sai deep');
    console.log('  Col 10: Eleanor');
    console.log('  Col 11: Profile Image');
    console.log('  Col 12: Profile Description');
    console.log('  Col 13: Generic Name');
    console.log('  Col 14: Design Weight\n');

    // Clear existing data
    console.log('🗑️  Clearing existing profiles...');
    const deleteResult = await prisma.sunrackProfile.deleteMany({});
    console.log(`✓ Deleted ${deleteResult.count} existing profiles\n`);

    // Import profiles
    let imported = 0;
    let skipped = 0;

    console.log('📥 Importing profiles...\n');

    for (let i = 2; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows
      if (!row || !row[0]) {
        skipped++;
        continue;
      }

      const sNo = parseInt(row[0]);
      const regalCode = row[1] ? String(row[1]).trim() : null;
      const excellenceCode = row[2] ? String(row[2]).trim() : null;
      const varnCode = row[3] ? String(row[3]).trim() : null;
      const rcCode = row[4] ? String(row[4]).trim() : null;
      const snalcoCode = row[5] ? String(row[5]).trim() : null;
      const darshanCode = row[6] ? String(row[6]).trim() : null;
      const jmCode = row[7] ? String(row[7]).trim() : null;
      const ralcoCode = row[8] ? String(row[8]).trim() : null;
      const saiDeepCode = row[9] ? String(row[9]).trim() : null;
      const eleanorCode = row[10] ? String(row[10]).trim() : null;
      const profileImage = row[11] ? String(row[11]).trim() : null;
      const profileDescription = row[12] ? String(row[12]).trim() : null;
      const genericName = row[13] ? String(row[13]).trim() : null;
      const designWeight = row[14] ? parseFloat(row[14]) : 0;

      // Validate required fields
      if (!profileDescription || !genericName) {
        console.log(`⚠️  Skipping row ${i}: Missing required fields`);
        skipped++;
        continue;
      }

      try {
        await prisma.sunrackProfile.create({
          data: {
            sNo,
            regalCode,
            excellenceCode,
            varnCode,
            rcCode,
            snalcoCode,
            darshanCode,
            jmCode,
            ralcoCode,
            saiDeepCode,
            eleanorCode,
            profileImage,
            profileDescription,
            genericName,
            designWeight
          }
        });

        imported++;

        // Show progress every 20 items
        if (imported % 20 === 0) {
          console.log(`  ✓ Imported ${imported} profiles...`);
        }

      } catch (error) {
        console.error(`❌ Error importing row ${i} (S.No ${sNo}):`, error.message);
        skipped++;
      }
    }

    console.log(`\n✅ Import completed!`);
    console.log(`   Imported: ${imported} profiles`);
    console.log(`   Skipped: ${skipped} rows\n`);

    // Show sample data
    console.log('📊 Sample imported data:');
    const samples = await prisma.sunrackProfile.findMany({
      take: 5,
      orderBy: { sNo: 'asc' }
    });

    samples.forEach(profile => {
      console.log(`  ${profile.sNo}. ${profile.regalCode || 'N/A'} - ${profile.genericName}`);
    });

    console.log('\n✨ All done!');

  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
importSunrackProfiles()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
