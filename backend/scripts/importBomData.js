const XLSX = require('xlsx');
const path = require('path');

// Path to your Excel file
const EXCEL_FILE_PATH = 'd:\\sunrack\\All Profiles - 05-12-2025 - Product Codes.xlsx';

// RM Vendor column mappings (based on Excel screenshot)
const RM_VENDORS = [
  { name: 'Reat', colName: 'Regal' },          // Column shows "Regal"
  { name: 'Excellence', colName: 'Excellence' },
  { name: 'VARN', colName: 'VARN' },
  { name: 'RC', colName: 'RC' },
  { name: 'SMALCO', colName: 'SNALCO' },       // Column shows "SNALCO"
  { name: 'Darshan', colName: 'Darshan' },
  { name: 'JM', colName: 'JM' },
  { name: 'Ratco', colName: 'Ralco' },         // Column shows "Ralco"
  { name: 'Sai deep', colName: 'Sai deep' },
  { name: 'Elantor', colName: 'Eleanor' }      // Column shows "Eleanor"
];

function readExcelFile() {
  console.log('Reading Excel file from:', EXCEL_FILE_PATH);

  try {
    // Read the Excel file
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    console.log('Reading sheet:', sheetName);

    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON with header row specified
    // defval: null means empty cells will be null instead of undefined
    const data = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      header: 1  // Read as array of arrays (by row)
    });

    console.log(`\nFound ${data.length} rows in Excel\n`);

    // Display first few rows to understand structure
    if (data.length > 0) {
      console.log('First 3 rows:');
      for (let i = 0; i < Math.min(3, data.length); i++) {
        console.log(`Row ${i}:`, data[i]);
      }
    }

    return { data, columns: [] };

  } catch (error) {
    console.error('Error reading Excel file:', error.message);
    return null;
  }
}

function generatePrismaSeedData(excelData, columns) {
  console.log('\n=== GENERATING PRISMA SEED DATA ===\n');

  const items = [];
  const rmCodes = [];

  // Column positions based on Excel structure
  const COL_SNO = 0;
  const COL_RM_START = 1;  // Regal/Reat
  const COL_RM_END = 10;   // Eleanor/Elantor (10 vendors total)
  const COL_PROFILE_IMAGE = 11;
  const COL_DESCRIPTION = 12;
  const COL_GENERIC_NAME = 13;
  const COL_DESIGN_WEIGHT = 14;

  // Skip first 2 rows (headers with "RM CODE" and vendor names)
  // Start from row 2 (0-indexed) which has the actual data
  const dataRows = excelData.slice(2);

  dataRows.forEach((row, index) => {
    if (!row || row.length === 0) return;

    // Extract serial number
    const serialNumber = row[COL_SNO]?.toString().trim();

    // Skip if no serial number
    if (!serialNumber || serialNumber === '') return;

    // Extract other fields
    const genericName = row[COL_GENERIC_NAME]?.toString().trim() || 'N/A';
    const itemDescription = row[COL_DESCRIPTION]?.toString().trim() || genericName;
    const designWeight = parseFloat(row[COL_DESIGN_WEIGHT] || 0);

    // Skip rows without valid generic name
    if (!genericName || genericName === 'N/A' || genericName === '') {
      return;
    }

    // Extract Sunrack Code (if available, otherwise generate)
    const sunrackCode = `SRC-${serialNumber.padStart(3, '0')}`;

    // Extract RM codes and determine selected vendor
    let selectedVendor = 'Reat';
    const extractedRmCodes = [];

    RM_VENDORS.forEach((vendor, vendorIndex) => {
      const colIndex = COL_RM_START + vendorIndex;
      const code = row[colIndex]?.toString().trim() || null;

      extractedRmCodes.push({
        vendorName: vendor.name,
        code: code
      });

      // Set first non-null vendor as selected
      if (code && selectedVendor === 'Reat' && vendor.name !== 'Reat') {
        selectedVendor = vendor.name;
      } else if (code && vendor.name === 'Reat') {
        selectedVendor = 'Reat';  // Prefer Reat if it has a code
      }
    });

    // Create BOM item object
    const bomItem = {
      serialNumber: serialNumber,
      sunrackCode: sunrackCode,
      itemDescription: itemDescription,
      genericName: genericName,
      designWeight: designWeight,
      selectedRmVendor: selectedVendor
    };

    items.push(bomItem);

    // Add RM codes to the list
    extractedRmCodes.forEach(rmCode => {
      rmCodes.push({
        itemSerialNumber: serialNumber,
        vendorName: rmCode.vendorName,
        code: rmCode.code
      });
    });
  });

  return { items, rmCodes };
}

function generateSQLStatements(items, rmCodes) {
  console.log('\n=== GENERATING SQL STATEMENTS ===\n');

  // Generate UPDATE statements for existing items
  console.log('-- UPDATE existing BOM items with new fields\n');

  items.forEach(item => {
    console.log(`UPDATE bom_master_items SET
  generic_name = '${item.genericName.replace(/'/g, "''")}',
  design_weight = ${item.designWeight},
  selected_rm_vendor = '${item.selectedRmVendor}'
WHERE serial_number = '${item.serialNumber}';`);
  });

  console.log('\n\n-- INSERT RM Codes\n');

  // Group RM codes by item for better readability
  const itemSerialNumbers = [...new Set(rmCodes.map(rc => rc.itemSerialNumber))];

  itemSerialNumbers.forEach(serialNumber => {
    const itemRmCodes = rmCodes.filter(rc => rc.itemSerialNumber === serialNumber);

    console.log(`-- RM Codes for Item ${serialNumber}`);
    itemRmCodes.forEach(rm => {
      const codeValue = rm.code ? `'${rm.code}'` : 'NULL';
      console.log(`INSERT INTO rm_codes (item_serial_number, vendor_name, code) VALUES ('${rm.itemSerialNumber}', '${rm.vendorName}', ${codeValue});`);
    });
    console.log('');
  });
}

function generatePrismaSeeder(items, rmCodes) {
  console.log('\n=== GENERATING PRISMA SEED FILE ===\n');

  const seedFileContent = `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting BOM data seeding...');

  // Upsert BOM items (create or update)
  const items = ${JSON.stringify(items, null, 2)};

  for (const item of items) {
    try {
      await prisma.bomMasterItem.upsert({
        where: { serialNumber: item.serialNumber },
        update: {
          genericName: item.genericName,
          itemDescription: item.itemDescription,
          designWeight: item.designWeight,
          selectedRmVendor: item.selectedRmVendor
        },
        create: {
          serialNumber: item.serialNumber,
          sunrackCode: item.sunrackCode,
          itemDescription: item.itemDescription,
          genericName: item.genericName,
          designWeight: item.designWeight,
          selectedRmVendor: item.selectedRmVendor,
          uom: 'nos',  // Default value
          material: 'Aluminum',  // Default value
          category: 'Profile',  // Default value
          isActive: true
        }
      });
      console.log(\`✓ Upserted item \${item.serialNumber}: \${item.genericName}\`);
    } catch (error) {
      console.error(\`✗ Failed to upsert item \${item.serialNumber}:\`, error.message);
    }
  }

  // Delete existing RM codes first to avoid duplicates
  console.log('\\nCleaning existing RM codes...');
  await prisma.rmCode.deleteMany({});

  // Insert RM Codes
  console.log('Inserting RM codes...');
  const rmCodes = ${JSON.stringify(rmCodes, null, 2)};

  for (const rmCode of rmCodes) {
    try {
      await prisma.rmCode.create({
        data: {
          itemSerialNumber: rmCode.itemSerialNumber,
          vendorName: rmCode.vendorName,
          code: rmCode.code
        }
      });
    } catch (error) {
      // Ignore errors
    }
  }

  console.log('\\n✓ Seeding completed!');
  console.log(\`✓ Total items: \${items.length}\`);
  console.log(\`✓ Total RM codes: \${rmCodes.length}\`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

  return seedFileContent;
}

// Main execution
console.log('========================================');
console.log('  BOM DATA IMPORT SCRIPT');
console.log('========================================\n');

const result = readExcelFile();

if (result && result.data.length > 0) {
  const { items, rmCodes } = generatePrismaSeedData(result.data, result.columns);

  console.log(`\n✓ Processed ${items.length} BOM items`);
  console.log(`✓ Processed ${rmCodes.length} RM codes\n`);

  // Generate SQL statements
  generateSQLStatements(items, rmCodes);

  // Generate Prisma seed file
  const seedFileContent = generatePrismaSeeder(items, rmCodes);

  // Write seed file
  const fs = require('fs');
  const seedFilePath = path.join(__dirname, 'seedBomData.js');
  fs.writeFileSync(seedFilePath, seedFileContent);

  console.log(`\n✓ Prisma seed file created at: ${seedFilePath}`);
  console.log('\nTo run the seed:');
  console.log('  node scripts/seedBomData.js');

} else {
  console.error('Failed to read Excel file or no data found.');
}
