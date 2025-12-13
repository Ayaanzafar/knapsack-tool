// Script to fix incorrect vendor names in both rm_codes and bom_master_items tables
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllVendorNames() {
  console.log('🔧 Starting vendor name corrections in all tables...\n');

  const vendorUpdates = [
    { old: 'Reat', new: 'Regal' },
    { old: 'SMALCO', new: 'SNALCO' },
    { old: 'Ratco', new: 'Ralco' },
    { old: 'Elantor', new: 'Eleanor' }
  ];

  try {
    // Fix rm_codes table
    console.log('📋 Updating rm_codes table:');
    console.log('============================');
    for (const update of vendorUpdates) {
      const count = await prisma.rmCode.count({
        where: { vendorName: update.old }
      });

      if (count === 0) {
        console.log(`   ⚠️  "${update.old}" - No records found`);
        continue;
      }

      const result = await prisma.rmCode.updateMany({
        where: { vendorName: update.old },
        data: { vendorName: update.new }
      });

      console.log(`   ✅ "${update.old}" -> "${update.new}" : ${result.count} records updated`);
    }

    // Fix bom_master_items table
    console.log('\n📋 Updating bom_master_items table:');
    console.log('====================================');
    for (const update of vendorUpdates) {
      const count = await prisma.bomMasterItem.count({
        where: { selectedRmVendor: update.old }
      });

      if (count === 0) {
        console.log(`   ⚠️  "${update.old}" - No records found`);
        continue;
      }

      const result = await prisma.bomMasterItem.updateMany({
        where: { selectedRmVendor: update.old },
        data: { selectedRmVendor: update.new }
      });

      console.log(`   ✅ "${update.old}" -> "${update.new}" : ${result.count} records updated`);
    }

    // Verification for rm_codes
    console.log('\n📊 Verification - rm_codes table:');
    console.log('==================================');
    const rmVendors = await prisma.rmCode.groupBy({
      by: ['vendorName'],
      _count: { vendorName: true },
      orderBy: { vendorName: 'asc' }
    });

    rmVendors.forEach(vendor => {
      console.log(`   ${vendor.vendorName.padEnd(12)} : ${vendor._count.vendorName} records`);
    });

    // Verification for bom_master_items
    console.log('\n📊 Verification - bom_master_items table:');
    console.log('==========================================');
    const masterVendors = await prisma.bomMasterItem.groupBy({
      by: ['selectedRmVendor'],
      _count: { selectedRmVendor: true },
      orderBy: { selectedRmVendor: 'asc' }
    });

    masterVendors.forEach(vendor => {
      console.log(`   ${(vendor.selectedRmVendor || 'NULL').padEnd(12)} : ${vendor._count.selectedRmVendor} records`);
    });

    console.log('\n✅ All vendor name corrections completed successfully!');
  } catch (error) {
    console.error('❌ Error updating vendor names:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixAllVendorNames()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
