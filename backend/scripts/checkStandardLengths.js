
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStandardLengths() {
  try {
    const items = await prisma.bomMasterItem.findMany({
      where: {
        standardLength: {
          not: null
        }
      },
      select: {
        serialNumber: true,
        standardLength: true,
        itemDescription: true
      }
    });

    console.log(JSON.stringify(items, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStandardLengths();
