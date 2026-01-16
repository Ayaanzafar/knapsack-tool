/**
 * Generate Image Filename Mapping for Sunrack Profiles
 * Creates a mapping file showing what filename to use for each profile image
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Determine the best code to use for image filename
 * Priority: Regal > Excellence > VARN > RC > SNALCO > Darshan > JM > Ralco > SaiDeep > Eleanor
 */
function getBestCodeForImage(profile) {
  // Priority 1: Regal (MA codes)
  if (profile.regalCode) {
    return {
      code: profile.regalCode.replace(/\s+/g, '-'), // Replace spaces with hyphens
      source: 'Regal',
      priority: 1
    };
  }

  // Priority 2: Excellence (EX codes)
  if (profile.excellenceCode) {
    return {
      code: profile.excellenceCode.replace(/\s+/g, '-'),
      source: 'Excellence',
      priority: 2
    };
  }

  // Priority 3: VARN (SR codes)
  if (profile.varnCode) {
    return {
      code: profile.varnCode.replace(/\s+/g, '-'),
      source: 'VARN',
      priority: 3
    };
  }

  // Priority 4: RC (SU codes)
  if (profile.rcCode) {
    return {
      code: profile.rcCode.replace(/\s+/g, '-'),
      source: 'RC',
      priority: 4
    };
  }

  // Priority 5: SNALCO (SN codes)
  if (profile.snalcoCode) {
    return {
      code: profile.snalcoCode.replace(/\s+/g, '-'),
      source: 'SNALCO',
      priority: 5
    };
  }

  // Priority 6: Darshan (DR codes)
  if (profile.darshanCode) {
    return {
      code: profile.darshanCode.replace(/\s+/g, '-'),
      source: 'Darshan',
      priority: 6
    };
  }

  // Priority 7: JM
  if (profile.jmCode) {
    return {
      code: profile.jmCode.replace(/\s+/g, '-'),
      source: 'JM',
      priority: 7
    };
  }

  // Priority 8: Ralco (RL codes)
  if (profile.ralcoCode) {
    return {
      code: profile.ralcoCode.replace(/\s+/g, '-'),
      source: 'Ralco',
      priority: 8
    };
  }

  // Priority 9: Sai Deep
  if (profile.saiDeepCode) {
    return {
      code: profile.saiDeepCode.replace(/\s+/g, '-'),
      source: 'SaiDeep',
      priority: 9
    };
  }

  // Priority 10: Eleanor
  if (profile.eleanorCode) {
    return {
      code: profile.eleanorCode.replace(/\s+/g, '-'),
      source: 'Eleanor',
      priority: 10
    };
  }

  // Fallback: Use S.No if no codes available
  return {
    code: `PROFILE-${profile.sNo}`,
    source: 'Fallback',
    priority: 99
  };
}

async function generateImageMapping() {
  try {
    console.log('🚀 Generating Image Filename Mapping...\n');

    // Fetch all profiles
    const profiles = await prisma.sunrackProfile.findMany({
      orderBy: { sNo: 'asc' }
    });

    console.log(`📊 Processing ${profiles.length} profiles...\n`);

    // Generate mapping data
    const mapping = profiles.map(profile => {
      const imageCode = getBestCodeForImage(profile);

      return {
        sNo: profile.sNo,
        regalCode: profile.regalCode || '-',
        excellenceCode: profile.excellenceCode || '-',
        varnCode: profile.varnCode || '-',
        rcCode: profile.rcCode || '-',
        snalcoCode: profile.snalcoCode || '-',
        genericName: profile.genericName,
        imageFilename: `${imageCode.code}.png`,
        codeSource: imageCode.source,
        priority: imageCode.priority,
        allCodes: [
          profile.regalCode,
          profile.excellenceCode,
          profile.varnCode,
          profile.rcCode,
          profile.snalcoCode,
          profile.darshanCode,
          profile.jmCode,
          profile.ralcoCode,
          profile.saiDeepCode,
          profile.eleanorCode
        ].filter(c => c).join(' | ')
      };
    });

    // Generate CSV output
    const csvHeader = 'S.No,Image Filename,Code Source,Generic Name,Regal,Excellence,VARN,RC,SNALCO,All Available Codes\n';
    const csvRows = mapping.map(m =>
      `${m.sNo},"${m.imageFilename}",${m.codeSource},"${m.genericName}",${m.regalCode},${m.excellenceCode},${m.varnCode},${m.rcCode},${m.snalcoCode},"${m.allCodes}"`
    ).join('\n');
    const csvContent = csvHeader + csvRows;

    // Save CSV file
    const csvPath = path.join(__dirname, '..', 'IMAGE_FILENAME_MAPPING.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    console.log(`✅ CSV mapping saved to: ${csvPath}\n`);

    // Generate readable text output
    let textContent = '='.repeat(120) + '\n';
    textContent += 'SUNRACK PROFILE IMAGE FILENAME MAPPING\n';
    textContent += '='.repeat(120) + '\n\n';
    textContent += 'Use this guide to name your profile images. Save images with the exact filename shown.\n';
    textContent += 'Example: For MA-43, save the image as "MA-43.png"\n\n';
    textContent += '='.repeat(120) + '\n\n';

    textContent += `${'S.No'.padEnd(6)}| ${'Image Filename'.padEnd(25)}| ${'Source'.padEnd(12)}| Generic Name\n`;
    textContent += '-'.repeat(120) + '\n';

    mapping.forEach(m => {
      textContent += `${m.sNo.toString().padEnd(6)}| ${m.imageFilename.padEnd(25)}| ${m.codeSource.padEnd(12)}| ${m.genericName}\n`;
    });

    textContent += '\n' + '='.repeat(120) + '\n\n';
    textContent += 'SUMMARY BY CODE SOURCE:\n';
    textContent += '-'.repeat(120) + '\n';

    // Group by source
    const groupedBySource = mapping.reduce((acc, m) => {
      if (!acc[m.codeSource]) acc[m.codeSource] = 0;
      acc[m.codeSource]++;
      return acc;
    }, {});

    Object.entries(groupedBySource).sort((a, b) => {
      const priorities = {
        'Regal': 1, 'Excellence': 2, 'VARN': 3, 'RC': 4, 'SNALCO': 5,
        'Darshan': 6, 'JM': 7, 'Ralco': 8, 'SaiDeep': 9, 'Eleanor': 10, 'Fallback': 99
      };
      return (priorities[a[0]] || 99) - (priorities[b[0]] || 99);
    }).forEach(([source, count]) => {
      textContent += `${source.padEnd(15)}: ${count} profiles\n`;
    });

    textContent += '\n' + '='.repeat(120) + '\n\n';
    textContent += 'NOTES:\n';
    textContent += '1. Image Priority Order: Regal > Excellence > VARN > RC > SNALCO > Darshan > JM > Ralco > SaiDeep > Eleanor\n';
    textContent += '2. All spaces in codes are replaced with hyphens (e.g., "MA 43" becomes "MA-43")\n';
    textContent += '3. Recommended image format: PNG (transparent background preferred)\n';
    textContent += '4. Save all images in: backend/static/profile-images/\n';
    textContent += '5. After saving images, run the image path update script to update the database\n\n';

    // Save text file
    const textPath = path.join(__dirname, '..', 'IMAGE_FILENAME_MAPPING.txt');
    fs.writeFileSync(textPath, textContent, 'utf8');
    console.log(`✅ Text mapping saved to: ${textPath}\n`);

    // Generate JSON output for programmatic use
    const jsonPath = path.join(__dirname, '..', 'IMAGE_FILENAME_MAPPING.json');
    fs.writeFileSync(jsonPath, JSON.stringify(mapping, null, 2), 'utf8');
    console.log(`✅ JSON mapping saved to: ${jsonPath}\n`);

    // Display summary
    console.log('📋 Summary:');
    console.log(`   Total profiles: ${profiles.length}`);
    Object.entries(groupedBySource).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} profiles`);
    });

    console.log('\n✨ Mapping files generated successfully!');
    console.log('\n📁 Output files:');
    console.log(`   - ${csvPath}`);
    console.log(`   - ${textPath}`);
    console.log(`   - ${jsonPath}`);

  } catch (error) {
    console.error('❌ Error generating mapping:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateImageMapping()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
