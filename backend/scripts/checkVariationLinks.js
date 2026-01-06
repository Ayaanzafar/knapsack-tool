const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get variation templates
  const templates = await prisma.bomVariationTemplate.findMany({
    select: {
      id: true,
      variationName: true,
      _count: {
        select: { variationItems: true }
      }
    }
  });

  console.log('\n=== VARIATION TEMPLATES ===');
  console.table(templates);

  // Get sample variation items with master item details
  const variationItems = await prisma.bomVariationItem.findMany({
    take: 20,
    include: {
      template: {
        select: { variationName: true }
      },
      masterItem: {
        select: {
          serialNumber: true,
          genericName: true,
          sunrackProfileId: true,
          category: true
        }
      }
    }
  });

  console.log('\n=== SAMPLE VARIATION ITEMS (First 20) ===');
  const formatted = variationItems.map(item => ({
    template: item.template.variationName,
    serialNo: item.masterItem.serialNumber,
    itemName: item.masterItem.genericName,
    hasProfile: item.masterItem.sunrackProfileId ? 'YES' : 'NO',
    category: item.masterItem.category,
    formulaKey: item.formulaKey
  }));
  console.table(formatted);

  // Check if fasteners are in variation items
  const fastenerVariations = await prisma.bomVariationItem.findMany({
    where: {
      masterItem: {
        sunrackProfileId: null
      }
    },
    include: {
      template: { select: { variationName: true } },
      masterItem: { select: { serialNumber: true, genericName: true } }
    }
  });

  console.log('\n=== FASTENER VARIATION ITEMS (Total: ' + fastenerVariations.length + ') ===');
  const fastenerFormatted = fastenerVariations.map(item => ({
    template: item.template.variationName,
    serialNo: item.masterItem.serialNumber,
    fastenerName: item.masterItem.genericName,
    formulaKey: item.formulaKey
  }));
  console.table(fastenerFormatted.slice(0, 15));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
