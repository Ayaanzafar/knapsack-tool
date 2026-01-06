const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const itemsWithoutFormula = await prisma.bomVariationItem.findMany({
    where: { formulaKey: null },
    include: {
      template: { select: { variationName: true } },
      sunrackProfile: { select: { genericName: true } },
      fastener: { select: { genericName: true } }
    }
  });

  if (itemsWithoutFormula.length === 0) {
    console.log('✅ All variation items have formula keys!');
  } else {
    console.log(`⚠️  Found ${itemsWithoutFormula.length} items without formula_key:\n`);
    itemsWithoutFormula.forEach(item => {
      const itemName = item.sunrackProfile?.genericName || item.fastener?.genericName || 'Unknown';
      console.log(`  - [${item.id}] ${item.template.variationName}: ${itemName}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
