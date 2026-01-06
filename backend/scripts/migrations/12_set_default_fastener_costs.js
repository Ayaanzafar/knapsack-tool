const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n========================================');
  console.log('  STEP 12: Set Default Fastener Costs');
  console.log('========================================\n');

  const updateResult = await prisma.fastener.updateMany({
    data: {
      costPerPiece: 30.00
    }
  });

  console.log(`✅ Updated ${updateResult.count} fasteners with default cost of ₹30.00`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
