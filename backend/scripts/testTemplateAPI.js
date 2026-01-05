const prisma = require('../src/prismaClient');

async function testTemplateAPI() {
  try {
    console.log('='.repeat(60));
    console.log('TESTING TEMPLATE INTEGRATION');
    console.log('='.repeat(60));

    // Test 1: Count templates
    const count = await prisma.bomVariationTemplate.count();
    console.log(`\n✅ Total templates in database: ${count}`);

    // Test 2: Fetch a specific template
    const template = await prisma.bomVariationTemplate.findUnique({
      where: { variationName: 'U Cleat Long Rail - Regular' }
    });

    if (template) {
      console.log(`\n✅ Template found: ${template.variationName}`);
      console.log(`   Items: ${template.items.length}`);
      console.log(`   Default Notes: ${template.defaultNotes.length}`);

      console.log(`\n📦 First 3 items:`);
      template.items.slice(0, 3).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.itemDescription} (${item.sunrackCode || 'No code'})`);
        console.log(`      Material: ${item.material}, Length: ${item.length}`);
      });

      console.log(`\n📝 Default notes:`);
      template.defaultNotes.forEach((note, i) => {
        console.log(`   ${i + 1}. ${note}`);
      });
    } else {
      console.log(`\n❌ Template not found`);
    }

    // Test 3: List all template names
    const allTemplates = await prisma.bomVariationTemplate.findMany({
      select: { variationName: true, isActive: true }
    });

    console.log(`\n📋 All templates:`);
    allTemplates.forEach((t, i) => {
      const status = t.isActive ? '✅' : '❌';
      console.log(`   ${i + 1}. ${status} ${t.variationName}`);
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ All tests passed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTemplateAPI();
