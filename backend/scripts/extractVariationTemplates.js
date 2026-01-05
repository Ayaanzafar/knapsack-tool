const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Read the Excel file
const filePath = path.join(__dirname, '..', 'Long Rail MMS Variants_8_types.xlsx');
const workbook = XLSX.readFile(filePath);

// Sheet names for the 8 variations (sheets numbered 1-8)
const variationSheets = ['1', '2', '3', '4', '5', '6', '7', '8'];

const templates = [];

variationSheets.forEach((sheetName) => {
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // First row is the variation name
  const variationName = data[0][0];

  // Second row is headers: S.N, Sunrack Code, Profile Image, Item Description, Material, Length (mm), UoM, Quantity
  const headers = data[1];
  const snIndex = 0;
  const codeIndex = 1;
  const descIndex = 3;
  const materialIndex = 4;
  const lengthIndex = 5;
  const uomIndex = 6;
  const quantityFormulaIndex = 7;

  // Extract items starting from row 3 (index 2)
  const items = [];
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0 || !row[snIndex]) break; // Stop at empty row

    const item = {
      serialNumber: row[snIndex],
      sunrackCode: row[codeIndex] || null,
      itemDescription: row[descIndex] || '',
      material: row[materialIndex] || '',
      length: row[lengthIndex] || null,
      uom: row[uomIndex] || 'Nos',
      quantityFormula: row[quantityFormulaIndex] || ''
    };

    items.push(item);
  }

  templates.push({
    variationName,
    items,
    totalItems: items.length
  });
});

// Print the extracted data
console.log('====================================');
console.log('EXTRACTED VARIATION TEMPLATES');
console.log('====================================\n');

templates.forEach((template, index) => {
  console.log(`\n${index + 1}. ${template.variationName}`);
  console.log(`   Total Items: ${template.totalItems}`);
  console.log(`   Items:`);
  template.items.forEach((item, i) => {
    const code = item.sunrackCode ? `[${item.sunrackCode}]` : '[FASTENER]';
    console.log(`   ${i + 1}. ${code} ${item.itemDescription.substring(0, 50)}`);
  });
});

// Save to JSON file
const outputPath = path.join(__dirname, '..', 'variation_templates_extracted.json');
fs.writeFileSync(outputPath, JSON.stringify(templates, null, 2));
console.log(`\n\n✅ Data saved to: ${outputPath}`);
console.log(`\nTotal variations extracted: ${templates.length}`);
