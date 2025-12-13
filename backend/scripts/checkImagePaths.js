const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkImagePaths() {
  const items = await prisma.bomMasterItem.findMany({
    where: {
      serialNumber: {
        in: ['100', '47', '110', '29', '15', '26']
      }
    },
    select: {
      serialNumber: true,
      sunrackCode: true,
      genericName: true,
      profileImagePath: true
    },
    orderBy: {
      serialNumber: 'asc'
    }
  });

  console.log('\nChecking profile image paths:\n');
  items.forEach(item => {
    console.log(`Serial: ${item.serialNumber}`);
    console.log(`  Sunrack Code: ${item.sunrackCode}`);
    console.log(`  Generic Name: ${item.genericName}`);
    console.log(`  Image Path: ${item.profileImagePath || 'NULL'}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

checkImagePaths();
