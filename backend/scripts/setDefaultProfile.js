const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== SETTING DEFAULT PROFILE FOR TABS ===\n');

  // Find "40mm Long Rail" profile
  const defaultProfile = await prisma.bomMasterItem.findFirst({
    where: {
      genericName: '40mm Long Rail'
    }
  });

  if (!defaultProfile) {
    console.log('❌ Default profile "40mm Long Rail" not found in database');
    console.log('Available profiles:');
    const allProfiles = await prisma.bomMasterItem.findMany({
      select: {
        serialNumber: true,
        genericName: true
      },
      take: 10
    });
    allProfiles.forEach(p => console.log(`  - ${p.serialNumber}: ${p.genericName}`));
    return;
  }

  console.log(`✓ Found default profile:`);
  console.log(`  Serial Number: ${defaultProfile.serialNumber}`);
  console.log(`  Generic Name: ${defaultProfile.genericName}`);
  console.log(`  Sunrack Code: ${defaultProfile.sunrackCode}`);
  console.log('');

  // Update all tabs that don't have a profile selected
  const updateResult = await prisma.tab.updateMany({
    where: {
      longRailProfileSerialNumber: null
    },
    data: {
      longRailProfileSerialNumber: defaultProfile.serialNumber
    }
  });

  console.log(`✓ Updated ${updateResult.count} tabs with default profile`);
  console.log('');

  // Verify
  const tabsWithProfile = await prisma.tab.count({
    where: {
      longRailProfileSerialNumber: { not: null }
    }
  });

  console.log(`✓ Total tabs with profile set: ${tabsWithProfile}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
