const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyTemplateItems() {
  try {
    console.log('='.repeat(80));
    console.log('VERIFYING TEMPLATE ITEMS IN DATABASE');
    console.log('='.repeat(80));

    // Get first template to show complete structure
    const template = await prisma.bomVariationTemplate.findFirst({
      where: { variationName: "U Cleat Long Rail - Regular" }
    });

    console.log('\n📦 TEMPLATE: U Cleat Long Rail - Regular');
    console.log(`   ID: ${template.id}`);
    console.log(`   Variation Name: ${template.variationName}`);
    console.log(`   Total Items Stored: ${template.items.length}`);
    console.log(`   Total Notes Stored: ${template.defaultNotes.length}`);

    console.log('\n📝 DEFAULT NOTES:');
    template.defaultNotes.forEach((note, i) => {
      console.log(`   ${i + 1}. ${note}`);
    });

    console.log('\n📦 ITEMS LIST (All items stored in database):');
    console.log('='.repeat(80));

    template.items.forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.itemDescription}`);
      console.log(`   Sunrack Code: ${item.sunrackCode || 'N/A (Fastener)'}`);
      console.log(`   Material: ${item.material}`);
      console.log(`   Length: ${item.length}`);
      console.log(`   UoM: ${item.uom}`);
      console.log(`   Serial Number: ${item.serialNumber}`);
      console.log(`   Quantity Formula: ${item.quantityFormula}`);
    });

    // Show count for all templates
    console.log('\n\n' + '='.repeat(80));
    console.log('ALL TEMPLATES IN DATABASE:');
    console.log('='.repeat(80));

    const allTemplates = await prisma.bomVariationTemplate.findMany({
      orderBy: { id: 'asc' }
    });

    allTemplates.forEach((t, i) => {
      console.log(`${i + 1}. ${t.variationName}`);
      console.log(`   → ${t.items.length} items stored in database`);
      console.log(`   → ${t.defaultNotes.length} default notes stored`);

      // Show first 3 items as sample
      console.log('   Sample items:');
      t.items.slice(0, 3).forEach((item, idx) => {
        const code = item.sunrackCode || 'FASTENER';
        console.log(`      ${idx + 1}. [${code}] ${item.itemDescription.substring(0, 40)}`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTemplateItems();
