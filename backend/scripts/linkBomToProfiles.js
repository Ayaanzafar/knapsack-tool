/**
 * Link BOM Master Items to Sunrack Profiles
 * Matches items by sunrack code and creates the foreign key relationship
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function linkBomToProfiles() {
  try {
    console.log('🚀 Linking BOM Master Items to Sunrack Profiles...\n');

    // Get all BOM master items
    const bomItems = await prisma.bomMasterItem.findMany({
      orderBy: { serialNumber: 'asc' }
    });

    console.log(`📊 Found ${bomItems.length} BOM master items\n`);

    // Get all sunrack profiles
    const profiles = await prisma.sunrackProfile.findMany();

    console.log(`📊 Found ${profiles.length} sunrack profiles\n`);

    let linked = 0;
    let alreadyLinked = 0;
    let fasteners = 0;
    let notFound = 0;

    console.log('Processing BOM items...\n');

    for (const item of bomItems) {
      // Check if already linked
      if (item.sunrackProfileId) {
        alreadyLinked++;
        console.log(`  ⏭️  Already linked: ${item.serialNumber} - ${item.itemDescription}`);
        continue;
      }

      // Check if it's a fastener (no sunrack code)
      if (!item.sunrackCode || item.itemType === 'FASTENER') {
        fasteners++;
        console.log(`  🔩 Fastener (no link): ${item.serialNumber} - ${item.itemDescription}`);
        continue;
      }

      // Try to find matching profile
      // Normalize codes: remove spaces, dashes, make comparison flexible
      const normalizeCode = (code) => {
        if (!code) return null;
        return code.replace(/[-\s]/g, '').toUpperCase().trim();
      };

      const itemCodeNormalized = normalizeCode(item.sunrackCode);

      const matchingProfile = profiles.find(p => {
        return (
          normalizeCode(p.regalCode) === itemCodeNormalized ||
          normalizeCode(p.excellenceCode) === itemCodeNormalized ||
          normalizeCode(p.varnCode) === itemCodeNormalized ||
          normalizeCode(p.rcCode) === itemCodeNormalized ||
          normalizeCode(p.snalcoCode) === itemCodeNormalized ||
          normalizeCode(p.darshanCode) === itemCodeNormalized ||
          normalizeCode(p.jmCode) === itemCodeNormalized ||
          normalizeCode(p.ralcoCode) === itemCodeNormalized ||
          normalizeCode(p.saiDeepCode) === itemCodeNormalized ||
          normalizeCode(p.eleanorCode) === itemCodeNormalized
        );
      });

      if (matchingProfile) {
        // Link the BOM item to the profile
        await prisma.bomMasterItem.update({
          where: { id: item.id },
          data: { sunrackProfileId: matchingProfile.id }
        });

        linked++;
        console.log(`  ✅ Linked: ${item.sunrackCode.padEnd(10)} → Profile S.No ${matchingProfile.sNo} (${matchingProfile.genericName})`);
      } else {
        notFound++;
        console.log(`  ⚠️  No match: ${item.sunrackCode.padEnd(10)} - ${item.itemDescription}`);
      }
    }

    console.log('\n' + '='.repeat(100));
    console.log('SUMMARY');
    console.log('='.repeat(100));
    console.log(`✅ Newly linked:       ${linked} items`);
    console.log(`⏭️  Already linked:     ${alreadyLinked} items`);
    console.log(`🔩 Fasteners (no link): ${fasteners} items`);
    console.log(`⚠️  Not found:          ${notFound} items`);
    console.log(`📊 Total processed:    ${bomItems.length} items`);
    console.log('');

    // Verify the linking
    console.log('🔍 Verification - Checking linked items:');
    const linkedItems = await prisma.bomMasterItem.findMany({
      where: { sunrackProfileId: { not: null } },
      include: { sunrackProfile: true }
    });

    console.log(`\nTotal linked items: ${linkedItems.length}\n`);

    linkedItems.slice(0, 10).forEach(item => {
      console.log(
        `  ${item.serialNumber.padEnd(3)} | ` +
        `${item.sunrackCode?.padEnd(10) || 'N/A'.padEnd(10)} | ` +
        `${item.itemDescription.substring(0, 35).padEnd(35)} → ` +
        `${item.sunrackProfile.genericName}`
      );
    });

    if (linkedItems.length > 10) {
      console.log(`  ... and ${linkedItems.length - 10} more`);
    }

    console.log('\n✨ Linking completed!\n');

  } catch (error) {
    console.error('❌ Error during linking:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
linkBomToProfiles()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
