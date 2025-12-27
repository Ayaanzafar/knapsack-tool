// Test what constants the backend is actually using
delete require.cache[require.resolve('./src/constants/bomDefaults')];
const constants = require('./src/constants/bomDefaults');

console.log('\n=== Backend Constants (Fresh Load) ===');
console.log('DEFAULT_MODULE_WP:', constants.DEFAULT_MODULE_WP);
console.log('DEFAULT_ALUMINIUM_RATE_PER_KG:', constants.DEFAULT_ALUMINIUM_RATE_PER_KG);
console.log('DEFAULT_SPARE_PERCENTAGE:', constants.DEFAULT_SPARE_PERCENTAGE);
console.log('===================================\n');
