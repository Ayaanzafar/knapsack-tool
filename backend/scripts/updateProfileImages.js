/**
 * Update Profile Images in Database
 * Scans backend/static/profile-images/ folder and updates database with image paths
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateProfileImages() {
  try {
    console.log('🚀 Updating Profile Images in Database...\n');

    // Define image folder path
    const imageFolder = path.join(__dirname, '..', 'static', 'profile-images');

    // Check if folder exists
    if (!fs.existsSync(imageFolder)) {
      console.error(`❌ Error: Folder does not exist: ${imageFolder}`);
      console.log('Please create the folder and add images first.');
      process.exit(1);
    }

    // Read all files in the folder
    const files = fs.readdirSync(imageFolder);
    const imageFiles = files.filter(f =>
      f.toLowerCase().endsWith('.png') ||
      f.toLowerCase().endsWith('.jpg') ||
      f.toLowerCase().endsWith('.jpeg')
    );

    console.log(`📂 Image folder: ${imageFolder}`);
    console.log(`📊 Found ${imageFiles.length} image files\n`);

    if (imageFiles.length === 0) {
      console.log('⚠️  No image files found in the folder.');
      console.log('Please add images to:', imageFolder);
      process.exit(0);
    }

    // Get all profiles from database
    const allProfiles = await prisma.sunrackProfile.findMany({
      orderBy: { sNo: 'asc' }
    });

    console.log(`💾 Database has ${allProfiles.length} profiles\n`);

    // Process each image file
    let updated = 0;
    let notMatched = 0;
    const updateResults = [];
    const unmatchedFiles = [];

    for (const filename of imageFiles) {
      // Extract code from filename (remove extension)
      const codeFromFile = path.basename(filename, path.extname(filename));

      // Normalize: "MA-43" becomes "MA 43" for matching
      const normalizedCode = codeFromFile.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

      // Find matching profile
      const profile = allProfiles.find(p => {
        const normalize = (c) => c ? c.replace(/-/g, ' ').replace(/\s+/g, ' ').trim() : null;
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
        // Update database with image path
        const imagePath = `/static/profile-images/${filename}`;

        await prisma.sunrackProfile.update({
          where: { id: profile.id },
          data: { profileImage: imagePath }
        });

        updated++;
        updateResults.push({
          filename: filename,
          code: codeFromFile,
          matchedCode: profile.regalCode || profile.excellenceCode || profile.varnCode || profile.rcCode || profile.snalcoCode,
          sNo: profile.sNo,
          genericName: profile.genericName
        });

        console.log(`✓ Updated: ${filename.padEnd(20)} → S.No ${profile.sNo} (${profile.genericName})`);
      } else {
        notMatched++;
        unmatchedFiles.push(filename);
        console.log(`⚠️  No match: ${filename}`);
      }
    }

    console.log('\n' + '='.repeat(100));
    console.log('SUMMARY');
    console.log('='.repeat(100));
    console.log(`✅ Successfully updated: ${updated} profiles`);
    console.log(`⚠️  No match found: ${notMatched} files`);
    console.log('');

    if (unmatchedFiles.length > 0) {
      console.log('Unmatched files:');
      unmatchedFiles.forEach(f => console.log(`  - ${f}`));
      console.log('');
      console.log('Tip: Make sure filenames match the codes exactly (e.g., MA-43.png, SR-03.png)');
      console.log('');
    }

    // Show updated profiles
    if (updateResults.length > 0) {
      console.log('Updated profiles:');
      console.log(`${'Filename'.padEnd(20)} | ${'Code'.padEnd(12)} | ${'S.No'.padEnd(5)} | Generic Name`);
      console.log('-'.repeat(100));
      updateResults.forEach(r => {
        console.log(
          `${r.filename.padEnd(20)} | ${r.matchedCode.padEnd(12)} | ${r.sNo.toString().padEnd(5)} | ${r.genericName}`
        );
      });
    }

    console.log('\n✨ Database update completed!\n');

    // Verify some key profiles
    console.log('🔍 Verification - Checking key profiles:');
    const keyProfiles = await prisma.sunrackProfile.findMany({
      where: {
        OR: [
          { regalCode: 'MA 43' },
          { regalCode: 'MA 110' },
          { varnCode: 'SR 03' },
          { regalCode: 'MA 52' }
        ]
      }
    });

    keyProfiles.forEach(p => {
      const hasImage = p.profileImage ? '✓' : '✗';
      console.log(`  ${hasImage} ${(p.regalCode || p.varnCode).padEnd(10)} - ${p.genericName.substring(0, 40).padEnd(40)} - ${p.profileImage || 'NO IMAGE'}`);
    });

  } catch (error) {
    console.error('❌ Error updating database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateProfileImages()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
