const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const itemNumber = '26';  // The item to check

  console.log('=== CHECKING ITEM 26 FROM DATABASE ===\n');

  const item = await prisma.bomMasterItem.findUnique({
    where: { serialNumber: itemNumber },
    include: {
      rmCodes: {
        orderBy: {
          vendorName: 'asc'
        }
      }
    }
  });

  if (!item) {
    console.log('❌ Item not found in database');
    return;
  }

  console.log(`S.No: ${item.serialNumber}`);
  console.log(`Sunrack Code: ${item.sunrackCode}`);
  console.log(`Generic Name: ${item.genericName}`);
  console.log(`Description: ${item.itemDescription}`);
  console.log(`Design Weight: ${item.designWeight} kg`);
  console.log(`Selected RM Vendor: ${item.selectedRmVendor}`);
  console.log(`\nRM Codes:`);

  // Group by vendor
  const vendors = ['Reat', 'Excellence', 'VARN', 'RC', 'SMALCO', 'Darshan', 'JM', 'Ratco', 'Sai deep', 'Elantor'];

  vendors.forEach(vendorName => {
    const rmCode = item.rmCodes.find(rm => rm.vendorName === vendorName);
    const code = rmCode?.code || 'NULL';
    console.log(`  ${vendorName.padEnd(12)}: ${code}`);
  });

  console.log('\n=== COMPARISON WITH EXCEL ===\n');
  console.log('Expected from Excel:');
  console.log('  Reat (Regal)  : MA 43');
  console.log('  Excellence    : EX 03');
  console.log('  VARN          : SR 14');
  console.log('  RC            : SU 08');
  console.log('  Generic Name  : 40mm Long Rail');
  console.log('  Design Weight : 0.492');

  console.log('\nMatches:');
  const reatCode = item.rmCodes.find(rm => rm.vendorName === 'Reat')?.code;
  const excelCode = item.rmCodes.find(rm => rm.vendorName === 'Excellence')?.code;
  const varnCode = item.rmCodes.find(rm => rm.vendorName === 'VARN')?.code;
  const rcCode = item.rmCodes.find(rm => rm.vendorName === 'RC')?.code;

  console.log(`  Reat Code:       ${reatCode === 'MA 43' ? '✓' : '✗'} (${reatCode})`);
  console.log(`  Excellence Code: ${excelCode === 'EX 03' ? '✓' : '✗'} (${excelCode})`);
  console.log(`  VARN Code:       ${varnCode === 'SR 14' ? '✓' : '✗'} (${varnCode})`);
  console.log(`  RC Code:         ${rcCode === 'SU 08' ? '✓' : '✗'} (${rcCode})`);
  console.log(`  Generic Name:    ${item.genericName === '40mm Long Rail' ? '✓' : '✗'} (${item.genericName})`);
  console.log(`  Design Weight:   ${item.designWeight == 0.492 ? '✓' : '✗'} (${item.designWeight})`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
