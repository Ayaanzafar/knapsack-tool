const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBoms() {
  try {
    const boms = await prisma.generatedBom.findMany({
      orderBy: { id: 'desc' },
      take: 5,
      select: {
        id: true,
        bomMetadata: true,
        generatedAt: true
      }
    });

    console.log('\n=== Recent BOMs in Database ===\n');
    boms.forEach(b => {
      const moduleWp = b.bomMetadata?.moduleWp || 'N/A';
      const aluminumRate = b.bomMetadata?.aluminumRate || 'N/A';
      console.log(`BOM ID: ${b.id}`);
      console.log(`  Created: ${new Date(b.generatedAt).toLocaleString()}`);
      console.log(`  Module Wp: ${moduleWp}`);
      console.log(`  Aluminum Rate: ${aluminumRate}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBoms();
