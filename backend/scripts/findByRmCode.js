const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rmCodeToFind = 'MA 43';

  console.log(`=== FINDING ITEM WITH RM CODE: ${rmCodeToFind} ===\n`);

  // Find the RM code first
  const rmCode = await prisma.rmCode.findFirst({
    where: { code: rmCodeToFind },
    include: {
      masterItem: true
    }
  });

  if (!rmCode) {
    console.log('❌ RM Code not found');
    return;
  }

  const item = rmCode.masterItem;

  console.log('✓ Found!');
  console.log(`\nItem Details:`);
  console.log(`  Serial Number:  ${item.serialNumber}`);
  console.log(`  Generic Name:   ${item.genericName}`);
  console.log(`  Description:    ${item.itemDescription}`);
  console.log(`  Design Weight:  ${item.designWeight} kg`);
  console.log(`  Sunrack Code:   ${item.sunrackCode}`);
  console.log(`\nRM Code Details:`);
  console.log(`  Vendor:         ${rmCode.vendorName}`);
  console.log(`  Code:           ${rmCode.code}`);

  // Get all RM codes for this item
  console.log(`\nAll RM Codes for this item:`);
  const allRmCodes = await prisma.rmCode.findMany({
    where: { itemSerialNumber: item.serialNumber },
    orderBy: { vendorName: 'asc' }
  });

  allRmCodes.forEach(rm => {
    if (rm.code) {
      console.log(`  - ${rm.vendorName.padEnd(12)}: ${rm.code}`);
    }
  });

  console.log('\n=== EXPECTED FROM EXCEL ===');
  console.log('Serial Number: 26');
  console.log('Generic Name:  40mm Long Rail');
  console.log('Design Weight: 0.492 kg');
  console.log('RM Codes:      Reat=MA 43, Excellence=EX 03, VARN=SR 14, RC=SU 08');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
