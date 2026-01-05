const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function viewTemplateData() {
  try {
    console.log('='.repeat(80));
    console.log('BOM VARIATION TEMPLATES - DATABASE VIEW');
    console.log('='.repeat(80));

    const templates = await prisma.bomVariationTemplate.findMany({
      orderBy: { id: 'asc' }
    });

    templates.forEach((template, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`TEMPLATE ${index + 1}: ${template.variationName}`);
      console.log('='.repeat(80));

      console.log(`\nID: ${template.id}`);
      console.log(`Active: ${template.isActive}`);
      console.log(`Order: ${template.order}`);

      console.log(`\n📝 DEFAULT NOTES (${template.defaultNotes.length}):`);
      template.defaultNotes.forEach((note, i) => {
        console.log(`   ${i + 1}. ${note}`);
      });

      console.log(`\n📦 ITEMS (${template.items.length}):`);
      template.items.forEach((item, i) => {
        const code = item.sunrackCode ? `[${item.sunrackCode}]` : '[FASTENER]';
        const desc = item.itemDescription.replace(/\r\n/g, ' ').substring(0, 50);
        console.log(`   ${i + 1}. ${code.padEnd(15)} ${desc}`);
        console.log(`      Material: ${item.material}, Length: ${item.length}, Formula: ${item.quantityFormula.substring(0, 60)}...`);
      });
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log(`TOTAL TEMPLATES: ${templates.length}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

viewTemplateData();
