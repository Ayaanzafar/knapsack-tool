const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.rmCode.count();
  const profileRmCodes = await prisma.rmCode.count({
    where: { masterItem: { sunrackProfileId: { not: null } } }
  });
  const fastenerRmCodes = await prisma.rmCode.count({
    where: { masterItem: { sunrackProfileId: null } }
  });
  
  const sample = await prisma.rmCode.findMany({
    take: 20,
    include: {
      masterItem: {
        select: {
          serialNumber: true,
          genericName: true,
          sunrackProfileId: true
        }
      }
    }
  });

  console.log('\n=== RM CODES STATISTICS ===');
  console.log('Total RM Codes:', total);
  console.log('Profile RM Codes:', profileRmCodes);
  console.log('Fastener RM Codes:', fastenerRmCodes);
  
  console.log('\n=== SAMPLE RM CODES (First 20) ===');
  console.table(sample.map(rc => ({
    itemSerial: rc.masterItem.serialNumber,
    itemName: rc.masterItem.genericName.substring(0, 30),
    vendor: rc.vendorName,
    code: rc.code,
    type: rc.masterItem.sunrackProfileId ? 'Profile' : 'Fastener'
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
