const { execSync } = require('child_process');
const path = require('path');

const migrations = [
  '01_migrate_fasteners.js',
  '02_migrate_formulas.js',
  '03_migrate_variation_items.js',
  '04_migrate_sunrack_profiles.js'
];

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║   DATABASE REFACTORING - DATA MIGRATION          ║');
console.log('╚════════════════════════════════════════════════════╝\n');

console.log('This will migrate data from bom_master_items to:');
console.log('  • fasteners table (new)');
console.log('  • sunrack_profiles table (updated)');
console.log('  • bom_formulas (new links)');
console.log('  • bom_variation_items (new links)\n');

console.log('═══════════════════════════════════════════════════\n');

let failedMigrations = [];

for (let i = 0; i < migrations.length; i++) {
  const migrationFile = migrations[i];
  const migrationPath = path.join(__dirname, migrationFile);

  try {
    console.log(`\n[${i + 1}/${migrations.length}] Running: ${migrationFile}`);
    execSync(`node "${migrationPath}"`, { stdio: 'inherit' });
    console.log(`\n✅ ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`\n❌ ${migrationFile} failed`);
    failedMigrations.push(migrationFile);
  }
}

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║   MIGRATION COMPLETE                              ║');
console.log('╚════════════════════════════════════════════════════╝\n');

if (failedMigrations.length > 0) {
  console.log('❌ Some migrations failed:');
  failedMigrations.forEach(file => console.log(`  - ${file}`));
  console.log('\nPlease fix the errors and run again.\n');
  process.exit(1);
} else {
  console.log('✅ All migrations completed successfully!\n');
  console.log('Next steps:');
  console.log('  1. Regenerate Prisma client: npx prisma generate');
  console.log('  2. Update backend code (routes and services)');
  console.log('  3. Update frontend code');
  console.log('  4. Test thoroughly');
  console.log('  5. Run cleanup migration to remove old columns\n');
}
