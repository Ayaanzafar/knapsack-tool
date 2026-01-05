const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const filePath = path.join(__dirname, '..', 'Long Rail MMS Variants_8_types.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('====================================');
console.log('ANALYZING BOM VARIATIONS FROM EXCEL');
console.log('====================================\n');

// Get all sheet names
const sheetNames = workbook.SheetNames;
console.log(`Found ${sheetNames.length} sheets:\n`);
sheetNames.forEach((name, index) => {
  console.log(`${index + 1}. ${name}`);
});
console.log('\n');

// Analyze each sheet
const variationData = {};

sheetNames.forEach((sheetName, index) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`VARIATION ${index + 1}: ${sheetName}`);
  console.log('='.repeat(80));

  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log(`\nTotal rows: ${data.length}`);
  console.log('\nFirst 20 rows:');
  console.log(JSON.stringify(data.slice(0, 20), null, 2));

  // Try to identify the structure
  console.log('\n--- Analyzing Structure ---');

  // Find header row (usually contains "S.No", "Item Description", "Quantity", etc.)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    const rowStr = JSON.stringify(row).toLowerCase();
    if (rowStr.includes('item description') || rowStr.includes('description') || rowStr.includes('s.no')) {
      headerRowIndex = i;
      console.log(`Header row found at index ${i}:`, row);
      break;
    }
  }

  if (headerRowIndex >= 0) {
    const headers = data[headerRowIndex];
    console.log('\nHeaders:', headers);

    // Extract items
    console.log('\n--- Items ---');
    const items = [];
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 0 && row[0]) { // Has some data
        items.push(row);
        console.log(`${i - headerRowIndex}. ${JSON.stringify(row)}`);
      }
    }

    variationData[sheetName] = {
      headers,
      items,
      totalItems: items.length
    };
  } else {
    console.log('Could not identify header row');
    console.log('\nAll rows:');
    data.forEach((row, i) => {
      console.log(`Row ${i}:`, JSON.stringify(row));
    });
  }
});

console.log('\n\n');
console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(JSON.stringify(variationData, null, 2));
