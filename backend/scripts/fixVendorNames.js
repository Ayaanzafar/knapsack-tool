// Script to fix incorrect vendor names in rm_codes table
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixVendorNames() {
  console.log('🔧 Starting vendor name corrections...\n');

  const vendorUpdates = [
    { old: 'Reat', new: 'Regal' },
    { old: 'SMALCO', new: 'SNALCO' },
    { old: 'Ratco', new: 'Ralco' },
    { old: 'Elantor', new: 'Eleanor' }
  ];

  try {
    for (const update of vendorUpdates) {
      console.log(`📝 Updating "${update.old}" -> "${update.new}"...`);

      // Count how many records will be updated
      const count = await prisma.rmCode.count({
        where: {
          vendorName: update.old
        }
      });

      if (count === 0) {
        console.log(`   ⚠️  No records found with vendor name "${update.old}"`);
        continue;
      }

      // Perform the update
      const result = await prisma.rmCode.updateMany({
        where: {
          vendorName: update.old
        },
        data: {
          vendorName: update.new
        }
      });

      console.log(`   ✅ Updated ${result.count} record(s)\n`);
    }

    // Verify the changes
    console.log('\n📊 Verification - Current vendor names in database:');
    const vendors = await prisma.rmCode.groupBy({
      by: ['vendorName'],
      _count: {
        vendorName: true
      },
      orderBy: {
        vendorName: 'asc'
      }
    });

    console.log('\nVendor Name | Record Count');
    console.log('------------|-------------');
    vendors.forEach(vendor => {
      console.log(`${vendor.vendorName.padEnd(11)} | ${vendor._count.vendorName}`);
    });

    console.log('\n✅ Vendor name corrections completed successfully!');
  } catch (error) {
    console.error('❌ Error updating vendor names:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixVendorNames()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
