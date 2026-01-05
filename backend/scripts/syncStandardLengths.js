const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  { serialNumber: "19", standardLength: 50, description: "Mid Clamp - 9mm Height - 21mm Gap - 3.5mm Thickness" },
  { serialNumber: "28", standardLength: 20, description: "Rail Nut - External" },
  { serialNumber: "47", standardLength: 150, description: "Jointer for 40mm Height - External Long Rail" },
  { serialNumber: "99", standardLength: 50, description: "End Clamp - 35mm Height - 21mm Gap - 3.5mm Thickness" },
  { serialNumber: "100", standardLength: 40, description: "Unified U Cleat - 76mm Height" },
  { serialNumber: "56", standardLength: 50, description: "End Clamp - 35mm Height - 20mm Gap - 3.5mm Thickness (Type 2)" }
  // { serialNumber: "110", standardLength: 50, description: "End Clamp - 30mm Height - 15mm Gap - 4mm Thickness" }
];

async function main() {
  console.log(`Starting update of standardLength for ${updates.length} items...`);

  for (const item of updates) {
    try {
      const result = await prisma.bomMasterItem.update({
        where: { serialNumber: item.serialNumber },
        data: { standardLength: item.standardLength }
      });
      console.log(`✅ Updated ${item.serialNumber} (${item.description}): standardLength = ${item.standardLength}`);
    } catch (error) {
      if (error.code === 'P2025') {
        console.warn(`⚠️ Item with serialNumber ${item.serialNumber} not found.`);
      } else {
        console.error(`❌ Error updating ${item.serialNumber}:`, error.message);
      }
    }
  }

  console.log('Update process completed.');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
