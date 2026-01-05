const prisma = require('../src/prismaClient');

async function compareItems() {
  try {
    console.log('='.repeat(80));
    console.log('DATABASE vs TEMPLATE COMPARISON');
    console.log('='.repeat(80));

    // 1. Get all items from database
    const dbItems = await prisma.bomMasterItem.findMany({
      where: { isActive: true },
      select: { sunrackCode: true, genericName: true },
      orderBy: { serialNumber: 'asc' }
    });

    console.log('\n📊 ITEMS IN DATABASE (bom_master_items):');
    console.log('-'.repeat(80));
    dbItems.forEach((item, i) => {
      const code = item.sunrackCode || 'NULL';
      console.log(`${i + 1}. [${code}] ${item.genericName}`);
    });

    // 2. Get template items
    const template = await prisma.bomVariationTemplate.findUnique({
      where: { variationName: 'U Cleat Long Rail - Regular' }
    });

    console.log('\n\n📋 ITEMS IN TEMPLATE (U Cleat Long Rail - Regular):');
    console.log('-'.repeat(80));
    if (template) {
      template.items.forEach((item, i) => {
        const code = item.sunrackCode || 'NULL';
        console.log(`${i + 1}. [${code}] ${item.itemDescription}`);
      });
    }

    // 3. Find mismatches
    console.log('\n\n🔍 MISMATCH ANALYSIS:');
    console.log('-'.repeat(80));

    if (template) {
      console.log('\n❌ Items in TEMPLATE but NOT in DATABASE:');
      let foundMissing = false;
      template.items.forEach(tItem => {
        const normalizeCode = (code) => code ? code.replace(/[\s\-]+/g, '').toUpperCase() : '';
        const tCode = normalizeCode(tItem.sunrackCode);

        const found = dbItems.find(dbItem => {
          const dbCode = normalizeCode(dbItem.sunrackCode);
          return dbCode === tCode;
        });

        if (!found && tItem.sunrackCode) {
          foundMissing = true;
          console.log(`   - [${tItem.sunrackCode}] ${tItem.itemDescription}`);
        }
      });
      if (!foundMissing) {
        console.log('   ✅ All template items found in database (by code)');
      }

      console.log('\n🔍 Items in TEMPLATE WITHOUT sunrack code (fasteners):');
      template.items.forEach(tItem => {
        if (!tItem.sunrackCode || tItem.sunrackCode === 'null') {
          console.log(`   - ${tItem.itemDescription}`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareItems();
