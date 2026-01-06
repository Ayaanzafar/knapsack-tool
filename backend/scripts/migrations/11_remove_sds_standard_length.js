const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n========================================');
  console.log('  STEP 11: Remove Standard Length for SDS');
  console.log('========================================\n');

  // List of fasteners that should have NULL standard length based on Excel
  const itemsToUpdate = [
    'Self Drilling Screw -  4.2X19mm - Hex Head',
    'Self Drilling Screw -  4.8X19mm - Hex Head',
    'Self Drilling Screw -  5.5X63mm - Hex Head',
    'Self Drilling Screw -  6.3X63mm - Hex Head',
    'Rubber Pad 40x40mm for U- cleat' // This one is also empty in Excel ("__EMPTY_4" is missing or ignored, wait, let me check log again)
  ];

  // Looking at the log:
  // Item 10, 11, 12 (SDS) have NO "__EMPTY_4" property (Length)
  // Item 13 (Rubber Pad) HAS "__EMPTY_4": 40 (wait, checking log...)
  
  // Re-checking log for Rubber Pad:
  // {
  //   "U Cleat Long Rail - Regular": 13,
  //   "__EMPTY_2": "Rubber Pad 40x40mm for U- cleat",
  //   "__EMPTY_5": "Nos"
  // }
  // Wait, in previous output:
  // {
  //   "__EMPTY_2": "Rubber Pad 40x40mm for U- cleat",
  //   "__EMPTY_3": "EPDM",
  //   "__EMPTY_5": "Nos",
  // }
  // It seems Rubber Pad ALSO has empty length in the JSON output provided.
  // Ah, wait. In the JSON output from `read_file` earlier:
  // "Rubber Pad 40x40mm for U- cleat" ... "__EMPTY_5": "Nos"
  // Length is MISSING.
  
  // So: SDS and Rubber Pad should have NULL length.

  const targetFasteners = [
      'Self Drilling Screw',
      'Rubber Pad'
  ];

  let updateCount = 0;

  for (const searchTerm of targetFasteners) {
      const fasteners = await prisma.fastener.findMany({
          where: {
              genericName: { contains: searchTerm }
          }
      });

      for (const fastener of fasteners) {
          // Check if it currently has a length
          if (fastener.standardLength !== null) {
              await prisma.fastener.update({
                  where: { id: fastener.id },
                  data: { standardLength: null }
              });
              console.log(`✅ Removed length for: ${fastener.genericName} (was ${fastener.standardLength})`);
              updateCount++;
          } else {
              console.log(`✓ Length already null for: ${fastener.genericName}`);
          }
      }
  }

  console.log(`\nUpdated ${updateCount} fasteners.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
