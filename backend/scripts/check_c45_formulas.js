const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const items = await prisma.bomVariationItem.findMany({
    where: { templateId: 9 },
    include: {
      sunrackProfile: true,
      fastener: true
    }
  });

  console.log('C45 Long Rail (Template 9) - Variation Items:');
  console.log('-'.repeat(80));
  items.forEach(function(item, idx) {
    var name = item.sunrackProfile ? item.sunrackProfile.genericName : (item.fastener ? item.fastener.genericName : item.displayOverride);
    var formula = item.formulaKey || 'NULL';
    console.log((idx + 1) + '. ' + (name || 'UNKNOWN').substring(0, 40).padEnd(40) + ' | Formula: ' + formula);
  });

  await prisma.$disconnect();
}
check();
