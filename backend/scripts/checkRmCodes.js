const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRmCodes() {
  const items = await prisma.bomMasterItem.findMany({
    where: {
      serialNumber: {
        in: ['100', '47', '110', '29', '15', '26']
      }
    },
    include: {
      rmCodes: {
        where: {
          vendorName: 'Regal'
        }
      }
    },
    orderBy: {
      serialNumber: 'asc'
    }
  });

  console.log('\n=== RM Codes (Regal Vendor) ===\n');
  items.forEach(item => {
    const regalCode = item.rmCodes.find(rm => rm.vendorName === 'Regal');
    console.log(`Serial ${item.serialNumber.padEnd(4)} | ${item.genericName.padEnd(35)} | RM Code: ${regalCode?.code || 'NULL'}`);
  });

  await prisma.$disconnect();
}

checkRmCodes();
