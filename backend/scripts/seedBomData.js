const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting BOM data seeding...');

  // Upsert BOM items (create or update)
  const items = [
  {
    "serialNumber": "1",
    "sunrackCode": "SRC-001",
    "itemDescription": "Rail Nut 1",
    "genericName": "Big Rail Nut",
    "designWeight": 0.6693300000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "2",
    "sunrackCode": "SRC-002",
    "itemDescription": "Mini Rail - 80mm Height - 26mm Crest width - 74° Angle - Internal",
    "genericName": "80mm Mini Rail",
    "designWeight": 1.0192500000000002,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "3",
    "sunrackCode": "SRC-003",
    "itemDescription": "2 Part - Seam Clamp - Type 1 - Part B",
    "genericName": "Standing Seam Clamp - Part B (Type 1)",
    "designWeight": 0.74331,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "4",
    "sunrackCode": "SRC-004",
    "itemDescription": "2 Part - Seam Clamp - Type 1 - Part A",
    "genericName": "Standing Seam Clamp - Part A (Type 1)",
    "designWeight": 1.46448,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "5",
    "sunrackCode": "SRC-005",
    "itemDescription": "Walkway - 150mm Width",
    "genericName": "150mm Walkway Section",
    "designWeight": 0.9325800000000001,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "6",
    "sunrackCode": "SRC-006",
    "itemDescription": "Base Rail - 25mm Height - With Flange",
    "genericName": "25mm Base Rail",
    "designWeight": 0.5305500000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "7",
    "sunrackCode": "SRC-007",
    "itemDescription": "Mid Clamp - 29mm Height - 25mm Gap - 3mm Thickness",
    "genericName": "Mid Clamp - 25mm Module Gap",
    "designWeight": 0.8005500000000001,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "8",
    "sunrackCode": "SRC-008",
    "itemDescription": "End Clamp - 35mm Height - 2mm Gap - 3mm Thickness",
    "genericName": "35mm End Clamp (Type 1)",
    "designWeight": 0.50436,
    "selectedRmVendor": "VARN"
  },
  {
    "serialNumber": "9",
    "sunrackCode": "SRC-009",
    "itemDescription": "Short Rail - 100mm Height - Small Rail Nut (RN3)",
    "genericName": "100mm Short Rail (In)",
    "designWeight": 1.31841,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "10",
    "sunrackCode": "SRC-010",
    "itemDescription": "End Clamp - 40mm Height - 2mm Gap - 3mm Thickness",
    "genericName": "40mm End Clamp (Type 1)",
    "designWeight": 0.54486,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "11",
    "sunrackCode": "SRC-011",
    "itemDescription": "V Rail - 75mm Height - Type 2",
    "genericName": "V Rail (Type 2)",
    "designWeight": 0.9282600000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "12",
    "sunrackCode": "SRC-012",
    "itemDescription": "Seam Clamp - 50mm Height - 14mm Gap - 25mm Seam Height - Top Rail",
    "genericName": "Standing Seam H Clamp (Type 1)",
    "designWeight": 1.46583,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "13",
    "sunrackCode": "SRC-013",
    "itemDescription": "Short Rail - 65mm Height - Small Rail Nut (RN3)",
    "genericName": "65mm Short Rail (In)_V2",
    "designWeight": 0.8850600000000001,
    "selectedRmVendor": "VARN"
  },
  {
    "serialNumber": "14",
    "sunrackCode": "SRC-014",
    "itemDescription": "Strut Rail - 21mm Height",
    "genericName": "21mm Strut Channel",
    "designWeight": 0.62856,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "15",
    "sunrackCode": "SRC-015",
    "itemDescription": "Rail Nut 3",
    "genericName": "Small Rail Nut",
    "designWeight": 0.48978000000000005,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "16",
    "sunrackCode": "SRC-016",
    "itemDescription": "Purlin Clamp",
    "genericName": "Purlin Clamp",
    "designWeight": 1.21662,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "17",
    "sunrackCode": "SRC-017",
    "itemDescription": "Short Rail - 75mm Height - Small Rail Nut (RN3)",
    "genericName": "75mm Short Rail (In)_V2",
    "designWeight": 1.6394400000000002,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "18",
    "sunrackCode": "SRC-018",
    "itemDescription": "Strut Rail - 41mm Height",
    "genericName": "41mm Strut Channel",
    "designWeight": 0.70848,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "19",
    "sunrackCode": "SRC-019",
    "itemDescription": "Mid Clamp - 9mm Height - 21mm Gap - 3.5mm Thickness",
    "genericName": "Mid Clamp - 21mm Module Gap",
    "designWeight": 0.52893,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "20",
    "sunrackCode": "SRC-020",
    "itemDescription": "Round Hollow Tube - 9mm OD",
    "genericName": "9mm Circular Tube",
    "designWeight": 0.11442600000000001,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "21",
    "sunrackCode": "SRC-021",
    "itemDescription": "Seam Clamp - 50mm Height - 12mm Gap - 30mm Seam Height - Top Rail",
    "genericName": "Standing Seam H Clamp (Type 2)",
    "designWeight": 1.54062,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "22",
    "sunrackCode": "SRC-022",
    "itemDescription": "Mini Rail - 75mm Height - 26mm Crest width - 90° Angle - Internal",
    "genericName": "75/25mm - 90 -  Mini Rail",
    "designWeight": 1.0916100000000002,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "23",
    "sunrackCode": "SRC-023",
    "itemDescription": "Mini Rail - 70mm Height - 27mm Crest width - 69° Angle - Internal",
    "genericName": "70/27mm - 69 - Mini Rail",
    "designWeight": 1.0065600000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "24",
    "sunrackCode": "SRC-024",
    "itemDescription": "Mini Rail - 75mm Height - 36mm Crest width - 90° Angle - Internal",
    "genericName": "75/36mm - 90 - Mini Rail",
    "designWeight": 1.23903,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "25",
    "sunrackCode": "SRC-025",
    "itemDescription": "End Clamp - 30mm Height - 16mm Gap - 4mm Thickness",
    "genericName": "30mm End Clamp",
    "designWeight": 0.6102000000000001,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "26",
    "sunrackCode": "SRC-026",
    "itemDescription": "Long Rail - 40mm Height - External",
    "genericName": "40mm Long Rail",
    "designWeight": 0.49194,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "27",
    "sunrackCode": "SRC-027",
    "itemDescription": "U Cleat Inner",
    "genericName": "Inner U Cleat",
    "designWeight": 0.7735500000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "28",
    "sunrackCode": "SRC-028",
    "itemDescription": "Rail Nut - External",
    "genericName": "Hook Rail Nut",
    "designWeight": 0.9890100000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "29",
    "sunrackCode": "SRC-029",
    "itemDescription": "Mid Clamp - 15mm Height - 25mm Gap - 4mm Thickness",
    "genericName": "Mid Clamp (M+)",
    "designWeight": 0.75465,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "30",
    "sunrackCode": "SRC-030",
    "itemDescription": "2 Part - Seam Clamp - Proflex Roof - Part A",
    "genericName": "Proflex - Standing Seam Clamp - Part A",
    "designWeight": 1.5967799999999999,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "31",
    "sunrackCode": "SRC-031",
    "itemDescription": "2 Part - Seam Clamp - Proflex Roof - Part B",
    "genericName": "Proflex - Standing Seam Clamp - Part B",
    "designWeight": 0.8332200000000002,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "32",
    "sunrackCode": "SRC-032",
    "itemDescription": "Short Rail - 65mm Height - External",
    "genericName": "65mm Short Rail (Ex)",
    "designWeight": 0.74655,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "33",
    "sunrackCode": "SRC-033",
    "itemDescription": "Short Rail - 100mm Height - External",
    "genericName": "100mm Short Rail (Ex)",
    "designWeight": 1.07649,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "34",
    "sunrackCode": "SRC-034",
    "itemDescription": "Asbestos - Curved Base",
    "genericName": "Asbestos Curved Base",
    "designWeight": 0.86238,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "35",
    "sunrackCode": "SRC-035",
    "itemDescription": "L Cleat - 89mm Height - 50mm Width",
    "genericName": "89mm L Cleat",
    "designWeight": 1.9356300000000002,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "36",
    "sunrackCode": "SRC-036",
    "itemDescription": "Long Rail - 45mm Height - Internal",
    "genericName": "L Type Long Rail_V2",
    "designWeight": 0.6342300000000001,
    "selectedRmVendor": "VARN"
  },
  {
    "serialNumber": "37",
    "sunrackCode": "SRC-037",
    "itemDescription": "Short Rail - 70mm Height - Small Rail Nut (RN3)",
    "genericName": "70mm Short Rail (In)",
    "designWeight": 0.90234,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "38",
    "sunrackCode": "SRC-038",
    "itemDescription": "Seam Clamp - 38mm Height - 14mm Gap - 30mm Seam Height - Top Thread",
    "genericName": "Standing Seam Walkway Clamp 1",
    "designWeight": 1.55142,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "39",
    "sunrackCode": "SRC-039",
    "itemDescription": "2 Part - Seam Clamp - Type 2 - Part A - 80mm Height",
    "genericName": "Standing Seam Clamp - Part A (Type 2)",
    "designWeight": 1.03653,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "40",
    "sunrackCode": "SRC-040",
    "itemDescription": "2 Part - Seam Clamp - Type 2 - Part B",
    "genericName": "Standing Seam Clamp - Part B (Type 2)",
    "designWeight": 0.55377,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "41",
    "sunrackCode": "SRC-041",
    "itemDescription": "Walkway - For FRP - M Clamp",
    "genericName": "FRP Walkway M Clamp",
    "designWeight": 0.6029100000000001,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "42",
    "sunrackCode": "SRC-042",
    "itemDescription": "2 Part - Seam Clamp - Type 3 - Part A and B",
    "genericName": "Standing Seam Clamp (Type 3) (2x)",
    "designWeight": 0.6458400000000001,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "43",
    "sunrackCode": "SRC-043",
    "itemDescription": "Kalzip Seam Clamp - Part B",
    "genericName": "Kalzip Clamp - Part B",
    "designWeight": 0.5931900000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "44",
    "sunrackCode": "SRC-044",
    "itemDescription": "Kalzip Seam Clamp - Part A",
    "genericName": "Kalzip Clamp - Part A",
    "designWeight": 1.1256300000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "45",
    "sunrackCode": "SRC-045",
    "itemDescription": "Bracket for 60mm Hat Section",
    "genericName": "Hat Base",
    "designWeight": 0.86778,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "46",
    "sunrackCode": "SRC-046",
    "itemDescription": "Rectangular Hollow Section - 46H - 30mm Width",
    "genericName": "Rectangle Column",
    "designWeight": 0.541161,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "47",
    "sunrackCode": "SRC-047",
    "itemDescription": "Jointer for 40mm Height - External Long Rail",
    "genericName": "External Long Rail Jointer",
    "designWeight": 0.55242,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "48",
    "sunrackCode": "SRC-048",
    "itemDescription": "Bracket for 38mm Hand Rail",
    "genericName": "Round Tube Bracket",
    "designWeight": 1.3151700000000002,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "49",
    "sunrackCode": "SRC-049",
    "itemDescription": "Round Hollow Tube - 38mm OD",
    "genericName": "Hand Rail Tube",
    "designWeight": 0.43443000000000004,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "50",
    "sunrackCode": "SRC-050",
    "itemDescription": "Walkway - For FRP - M Clamp - Type 2",
    "genericName": "FRP Walkway M Clamp_V2",
    "designWeight": 0.50274,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "51",
    "sunrackCode": "SRC-051",
    "itemDescription": "Long Rail - 45mm Height - Internal - Type 2",
    "genericName": "L Type Long Rail_V3",
    "designWeight": 0.69093,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "52",
    "sunrackCode": "SRC-052",
    "itemDescription": "2 Part - Seam Clamp - Type 4 - Part B",
    "genericName": "Standing Seam Clamp - Part B (Type 4)",
    "designWeight": 0.47681999999999997,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "53",
    "sunrackCode": "SRC-053",
    "itemDescription": "Seam Clamp - 75mm Height - 21mm Gap - 30mm Seam Height - External Rail",
    "genericName": "75mm Standing Seam Clamp - External",
    "designWeight": 1.7298900000000004,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "54",
    "sunrackCode": "SRC-054",
    "itemDescription": "Mini Rail - 65mm Height - 17mm Crest width - 74° Angle - External",
    "genericName": "65/17mm - 74 - Mini Rail (Ex)",
    "designWeight": 0.8575200000000001,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "55",
    "sunrackCode": "SRC-055",
    "itemDescription": "L Cleat - Equal L - 25mm Height",
    "genericName": "L Angle - 25x25mm",
    "designWeight": 0.29619000000000006,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "56",
    "sunrackCode": "SRC-056",
    "itemDescription": "End Clamp - 35mm Height - 20mm Gap - 3.5mm Thickness",
    "genericName": "35mm End Clamp (Type 2)",
    "designWeight": 0.6542100000000001,
    "selectedRmVendor": "VARN"
  },
  {
    "serialNumber": "57",
    "sunrackCode": "SRC-057",
    "itemDescription": "L Cleat - 45mm Height - 35mm Width",
    "genericName": "L Angle - 45x35mm",
    "designWeight": 0.5059800000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "58",
    "sunrackCode": "SRC-058",
    "itemDescription": "Mini Rail - 70mm Height - 42mm Crest width - 72° Angle - Internal",
    "genericName": "70/42mm Mini Rail",
    "designWeight": 1.09512,
    "selectedRmVendor": "VARN"
  },
  {
    "serialNumber": "59",
    "sunrackCode": "SRC-059",
    "itemDescription": "Jointer for 38mm OD Hand Rail",
    "genericName": "Round Tube Jointer",
    "designWeight": 0.5432400000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "60",
    "sunrackCode": "SRC-060",
    "itemDescription": "End Clamp -405mm Height - 25mm Gap - 3.5mm Thickness",
    "genericName": "40mm End Clamp (Type 2)",
    "designWeight": 0.7441200000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "61",
    "sunrackCode": "SRC-061",
    "itemDescription": "End Clamp - 35mm Height - 2mm Gap - 3.5mm Thickness",
    "genericName": "35mm End Clamp (M+)",
    "designWeight": 0.6739200000000001,
    "selectedRmVendor": "RC"
  },
  {
    "serialNumber": "62",
    "sunrackCode": "SRC-062",
    "itemDescription": "Walkway - 175mm Width",
    "genericName": "175mm Walkway Section (2x)",
    "designWeight": 1.1156400000000002,
    "selectedRmVendor": "Darshan"
  },
  {
    "serialNumber": "63",
    "sunrackCode": "SRC-063",
    "itemDescription": "Ballast Tray Clamp",
    "genericName": "Ballast Tray Clamp",
    "designWeight": 2.37492,
    "selectedRmVendor": "Darshan"
  },
  {
    "serialNumber": "64",
    "sunrackCode": "SRC-064",
    "itemDescription": "Mini Rail - 97mm Height - 36mm Crest width - 90° Angle - External",
    "genericName": "97/36mm - 90 - Mini Rail (Ex)",
    "designWeight": 1.16316,
    "selectedRmVendor": "SMALCO"
  },
  {
    "serialNumber": "65",
    "sunrackCode": "SRC-065",
    "itemDescription": "End Clamp - 33mm Height - 18mm Gap - 4mm Thickness",
    "genericName": "33mm End Clamp",
    "designWeight": 0.60858,
    "selectedRmVendor": "VARN"
  },
  {
    "serialNumber": "66",
    "sunrackCode": "SRC-066",
    "itemDescription": "Walkway - For FRP - C Clamp",
    "genericName": "FRP C Clamp",
    "designWeight": 0.6123600000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "67",
    "sunrackCode": "SRC-067",
    "itemDescription": "Kliplock 700 Seam Clamp - Part B",
    "genericName": "Kliplock 700 Clamp - Part B",
    "designWeight": 0.7095600000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "68",
    "sunrackCode": "SRC-068",
    "itemDescription": "Kliplock 700 Seam Clamp - Part A",
    "genericName": "Kliplock 700 Clamp - Part A",
    "designWeight": 1.09917,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "69",
    "sunrackCode": "SRC-069",
    "itemDescription": "Whistle Clamp",
    "genericName": "Whistle Clamp",
    "designWeight": 2.3257800000000004,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "70",
    "sunrackCode": "SRC-070",
    "itemDescription": "Floating - Ciel & Terre - Front Leg - 1",
    "genericName": "CNT - Front Leg",
    "designWeight": 0.8653500000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "71",
    "sunrackCode": "SRC-071",
    "itemDescription": "Floating - Ciel & Terre - Back Leg - 1",
    "genericName": "CNT - Back Leg",
    "designWeight": 2.16513,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "72",
    "sunrackCode": "SRC-072",
    "itemDescription": "Mid Clamp - 16mm Height - 21mm Gap - 4mm Thickness",
    "genericName": "Mid Clamp (T4)",
    "designWeight": 0.79353,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "73",
    "sunrackCode": "SRC-073",
    "itemDescription": "End Clamp - 35mm Height - 20mm Gap - 4mm Thickness",
    "genericName": "35mm End Clamp (T4)",
    "designWeight": 0.77031,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "74",
    "sunrackCode": "SRC-074",
    "itemDescription": "Short Rail - 80mm Height - External",
    "genericName": "80mm Short Rail(Ex)",
    "designWeight": 0.8712900000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "75",
    "sunrackCode": "SRC-075",
    "itemDescription": "Kalzip Seam Clamp - Flat Top - Part A",
    "genericName": "Kalzip Flat Top Clamp",
    "designWeight": 1.12806,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "76",
    "sunrackCode": "SRC-076",
    "itemDescription": "Long Rail - 60mm Height - Internal",
    "genericName": "L Type Long Rail - 60mm",
    "designWeight": 0.85239,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "77",
    "sunrackCode": "SRC-077",
    "itemDescription": "U Cleat - Outer - 82mm Height",
    "genericName": "Outer U Cleat - 82mm",
    "designWeight": 2.1470400000000005,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "78",
    "sunrackCode": "SRC-078",
    "itemDescription": "Mini Rail - Tata Profile",
    "genericName": "Tata Short Rail",
    "designWeight": 1.7174700000000003,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "79",
    "sunrackCode": "SRC-079",
    "itemDescription": "End Clamp - Tata Profile",
    "genericName": "Tata Universal Module Clamp",
    "designWeight": 1.5948900000000004,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "80",
    "sunrackCode": "SRC-080",
    "itemDescription": "Tata T Nut",
    "genericName": "Tata Rail Nut",
    "designWeight": 0.37287,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "81",
    "sunrackCode": "SRC-081",
    "itemDescription": "Multilock Seam Clamp - Part B",
    "genericName": "Multilock Seam Clamp - Part B",
    "designWeight": 0.5697000000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "82",
    "sunrackCode": "SRC-082",
    "itemDescription": "Multilock Seam Clamp - Part A",
    "genericName": "Multilock Seam Clamp - Part A",
    "designWeight": 1.019061,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "83",
    "sunrackCode": "SRC-083",
    "itemDescription": "Jointer for 45mm Height - Internal Long Rail - Type 2",
    "genericName": "L Type Long Rail Jointert_V2",
    "designWeight": 0.30564,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "84",
    "sunrackCode": "SRC-084",
    "itemDescription": "Seam Clamp - 100mm Height - 12mm Gap - 30mm Seam Height - Top Rail",
    "genericName": "Standing Seam Clamp - 100mm",
    "designWeight": 2.1691800000000003,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "85",
    "sunrackCode": "SRC-085",
    "itemDescription": "Long Rail - 60mm Height - External",
    "genericName": "External Long Rail_60mm",
    "designWeight": 0.8375400000000001,
    "selectedRmVendor": "RC"
  },
  {
    "serialNumber": "86",
    "sunrackCode": "SRC-086",
    "itemDescription": "Jointer for 60mm Height - External Long Rail",
    "genericName": "External 60mm Long Rail Jointer",
    "designWeight": 0.37583999999999995,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "87",
    "sunrackCode": "SRC-087",
    "itemDescription": "Floating - Ciel & Terre - Front Leg - 2",
    "genericName": "CNT - Face Leg",
    "designWeight": 1.40373,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "88",
    "sunrackCode": "SRC-088",
    "itemDescription": "Mini Rail - 98mm Height - 27mm Crest width - 75° Angle - External",
    "genericName": "98/27 - 75 - Mini Rail (Ex)",
    "designWeight": 1.27224,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "89",
    "sunrackCode": "SRC-089",
    "itemDescription": "Mini Rail - 98mm Height - 27mm Crest width - 69° Angle - External",
    "genericName": "98/27 - 69 - Mini Rail (Ex)",
    "designWeight": 1.27278,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "90",
    "sunrackCode": "SRC-090",
    "itemDescription": "Mini Rail - 98mm Height - 29mm Crest width - 73° Angle - External",
    "genericName": "98/29 - 73 - Mini Rail (Ex)",
    "designWeight": 1.28655,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "91",
    "sunrackCode": "SRC-091",
    "itemDescription": "Long Rail for Seam Clamp",
    "genericName": "Emmvee Long Rail",
    "designWeight": 0.64341,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "92",
    "sunrackCode": "SRC-092",
    "itemDescription": "Strut Rail - 73mm Height - Araymond Compatible",
    "genericName": "Araymond Strut Rail - 73mm",
    "designWeight": 1.39212,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "93",
    "sunrackCode": "SRC-093",
    "itemDescription": "Short Rail - 100mm Height - Araymond",
    "genericName": "100mm Short Rail (AR)",
    "designWeight": 1.3300200000000002,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "94",
    "sunrackCode": "SRC-094",
    "itemDescription": "U Cleat - Outer - 145mm Height",
    "genericName": "UX Long Rail - Large U Base",
    "designWeight": 3.0623400000000003,
    "selectedRmVendor": "SMALCO"
  },
  {
    "serialNumber": "95",
    "sunrackCode": "SRC-095",
    "itemDescription": "Base Rail - 25mm Height - No Flange",
    "genericName": "25mm Base Rail W/O Flange",
    "designWeight": 0.38043000000000005,
    "selectedRmVendor": "RC"
  },
  {
    "serialNumber": "96",
    "sunrackCode": "SRC-096",
    "itemDescription": "Multilock Seam Clamp - Flat Top - Part A",
    "genericName": "Multilok Flat Top Seam Clamp - Part A",
    "designWeight": 1.0918800000000002,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "97",
    "sunrackCode": "SRC-097",
    "itemDescription": "H Bracket - 83mm Height - 43mm inner width",
    "genericName": "H Bracket_V2",
    "designWeight": 2.36844,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "98",
    "sunrackCode": "SRC-098",
    "itemDescription": "Kliplock 700 Seam Clamp - Flat Top - Part A",
    "genericName": "Kliplock 700 Flat Top Clamp - Part A",
    "designWeight": 1.192509,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "99",
    "sunrackCode": "SRC-099",
    "itemDescription": "End Clamp - 35mm Height - 21mm Gap - 3.5mm Thickness",
    "genericName": "30mm End Clamp_V2",
    "designWeight": 0.6021,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "100",
    "sunrackCode": "SRC-100",
    "itemDescription": "Unified U Cleat - 76mm Height",
    "genericName": "Unified U Cleat",
    "designWeight": 1.8500400000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "101",
    "sunrackCode": "SRC-101",
    "itemDescription": "Long Rail Height Extender - 180mm",
    "genericName": "Height Extender - U Long Rail",
    "designWeight": 3.25566,
    "selectedRmVendor": "SMALCO"
  },
  {
    "serialNumber": "102",
    "sunrackCode": "SRC-102",
    "itemDescription": "Bitumen Rail Splice",
    "genericName": "Bitumen Rail Splice",
    "designWeight": 0.36234,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "103",
    "sunrackCode": "SRC-103",
    "itemDescription": "Aluminum RCC",
    "genericName": "RCC EW Channel (Purlin)",
    "designWeight": 1.11915,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "104",
    "sunrackCode": "SRC-104",
    "itemDescription": "Rectangular Hollow Section - 60H - 40mm Width",
    "genericName": "RCC Column 40X60",
    "designWeight": 1.18449,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "105",
    "sunrackCode": "SRC-105",
    "itemDescription": "Square Hollow Section - 40",
    "genericName": "RCC Bracing 40X40",
    "designWeight": 0.8847900000000001,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "106",
    "sunrackCode": "SRC-106",
    "itemDescription": "H Bracket - 83mm Height - 43mm inner width",
    "genericName": "H Bracket-V3",
    "designWeight": 3.0969,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "107",
    "sunrackCode": "SRC-107",
    "itemDescription": "Aluminum Purlin Splice",
    "genericName": "RCC EW Splice (Purlin splcie)",
    "designWeight": 1.10592,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "108",
    "sunrackCode": "SRC-108",
    "itemDescription": "Rafter Channel_V3",
    "genericName": "RCC NS CHANNEL (Rafter)",
    "designWeight": 1.15884,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "109",
    "sunrackCode": "SRC-109",
    "itemDescription": "Mono Rail - Height 100mm - Width - 27mm",
    "genericName": "100 - 27- Mono Rail (Ex)",
    "designWeight": 1.0208700000000002,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "110",
    "sunrackCode": "SRC-110",
    "itemDescription": "End Clamp - 30mm Height - 15mm Gap - 4mm Thickness",
    "genericName": "30mm End Clamp_Type 2",
    "designWeight": 0.6615,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "111",
    "sunrackCode": "SRC-111",
    "itemDescription": "Mid Clamp - 15mm Height - 27mm Gap - 4mm Thickness",
    "genericName": "Mid Clamp - 27mm Module Gap",
    "designWeight": 0.76275,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "112",
    "sunrackCode": "SRC-112",
    "itemDescription": "Round Hollow Tube - 10mm OD",
    "genericName": "M8 Spacer",
    "designWeight": 0.12474,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "113",
    "sunrackCode": "SRC-113",
    "itemDescription": "Mini Rail - 99mm Height - 23mm Crest width - 29° Angle - External",
    "genericName": "98/23 - 29 - Mini Rail (Ex)",
    "designWeight": 1.25388,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "114",
    "sunrackCode": "SRC-114",
    "itemDescription": "Flat Base Bracket - 41mm inner Width",
    "genericName": "Flat Base (Type 2)",
    "designWeight": 3.9943800000000005,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "115",
    "sunrackCode": "SRC-115",
    "itemDescription": "Purlin Clamp_Type 2",
    "genericName": "Purlin Clamp (Type 2)",
    "designWeight": 0.70821,
    "selectedRmVendor": "VARN"
  },
  {
    "serialNumber": "116",
    "sunrackCode": "SRC-116",
    "itemDescription": "Strip - 30x4.5",
    "genericName": "Teeth Washer",
    "designWeight": 0.32805,
    "selectedRmVendor": "VARN"
  },
  {
    "serialNumber": "117",
    "sunrackCode": "SRC-117",
    "itemDescription": "Bitumen Rail - 100mm Height - 99mm Base",
    "genericName": "Bitumen Rail - 100mm",
    "designWeight": 1.3378500000000002,
    "selectedRmVendor": "SMALCO"
  },
  {
    "serialNumber": "118",
    "sunrackCode": "SRC-118",
    "itemDescription": "Mini Rail - 100mm Height - 35mm Crest width - 105° Angle - External",
    "genericName": "100/35 - 105 - Mini Rail (Ex)",
    "designWeight": 1.1923200000000003,
    "selectedRmVendor": "SMALCO"
  },
  {
    "serialNumber": "119",
    "sunrackCode": "SRC-119",
    "itemDescription": "Seam Clamp - 65mm Height - 15mm Gap - 30mm Seam Height - Top Rail",
    "genericName": "Standing Seam Clamp - 65mm",
    "designWeight": 1.7901000000000002,
    "selectedRmVendor": "VARN"
  },
  {
    "serialNumber": "120",
    "sunrackCode": "SRC-120",
    "itemDescription": "150mm Height Toe Guard",
    "genericName": "Toe Guard",
    "designWeight": 0.864,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "121",
    "sunrackCode": "SRC-121",
    "itemDescription": "60mm Waaree Flexible Module Bracket",
    "genericName": "Waaree Flexible Module Bracket",
    "designWeight": 1.47258,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "122",
    "sunrackCode": "SRC-122",
    "itemDescription": "U Bracket - 65mm Height - 40mm Gap - No Flanges",
    "genericName": "U Bracket",
    "designWeight": 2.2658400000000003,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "123",
    "sunrackCode": "SRC-123",
    "itemDescription": "Flanges Module Mounting Bracket",
    "genericName": "Module Flange Bracket",
    "designWeight": 2.44701,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "124",
    "sunrackCode": "SRC-124",
    "itemDescription": "67mm - Bottom Hook Clamp",
    "genericName": "Sunrack Bottom Clamp",
    "designWeight": 0.5065200000000001,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "125",
    "sunrackCode": "SRC-125",
    "itemDescription": "117mm L Cleat for Long Rail",
    "genericName": "117mm L Cleat",
    "designWeight": 3.07152,
    "selectedRmVendor": "Excellence"
  },
  {
    "serialNumber": "126",
    "sunrackCode": "SRC-126",
    "itemDescription": "60mm T Bolt Short Rail",
    "genericName": "60mm T Bolt Short Rail",
    "designWeight": 0.65259,
    "selectedRmVendor": "RC"
  },
  {
    "serialNumber": "127",
    "sunrackCode": "SRC-127",
    "itemDescription": "Mid Clamp - 15mm Module Gap - Top Bolt",
    "genericName": "Mid Clamp - 15mm Module Gap",
    "designWeight": 0.40257,
    "selectedRmVendor": "RC"
  },
  {
    "serialNumber": "128",
    "sunrackCode": "SRC-128",
    "itemDescription": "Seam Clamp - 38mm Height - 21mm Gap - 30mm Seam Height - Top Thread",
    "genericName": "Standing Seam Walkway Clamp 2",
    "designWeight": 1.5101099999999998,
    "selectedRmVendor": "Reat"
  },
  {
    "serialNumber": "130",
    "sunrackCode": "SRC-130",
    "itemDescription": "C45 Strut Latch (for Magnelis Long Rail)",
    "genericName": "C45 Strut Latch (for Magnelis Long Rail)",
    "designWeight": 0.70821,
    "selectedRmVendor": "Ratco"
  },
  {
    "serialNumber": "129",
    "sunrackCode": "SRC-129",
    "itemDescription": "C45 Strut Base (for Magnelis Long Rail)",
    "genericName": "C45 Strut Base (for Magnelis Long Rail)",
    "designWeight": 3.03075,
    "selectedRmVendor": "Ratco"
  },
  {
    "serialNumber": "131",
    "sunrackCode": "SRC-131",
    "itemDescription": "U Base - 45mm Height - 26mm Gap",
    "genericName": "45x30 - U Channel",
    "designWeight": 0.67527,
    "selectedRmVendor": "Ratco"
  },
  {
    "serialNumber": "132",
    "sunrackCode": "SRC-132",
    "itemDescription": "C45 Rail Jointer (for Magnelis Long Rail)",
    "genericName": "C45 Rail Jointer (for Magnelis Long Rail)",
    "designWeight": 1.7450910000000002,
    "selectedRmVendor": "RC"
  },
  {
    "serialNumber": "133",
    "sunrackCode": "SRC-133",
    "itemDescription": "H Bracket - 102 / 41mm Gap - 120mm Height",
    "genericName": "H Bracket for 100mm Box Column",
    "designWeight": 4.531680000000001,
    "selectedRmVendor": "SMALCO"
  },
  {
    "serialNumber": "134",
    "sunrackCode": "SRC-134",
    "itemDescription": "100mm Box Column - Two M8 Opposite Slots",
    "genericName": "100mm Box Column",
    "designWeight": 3.32721,
    "selectedRmVendor": "SMALCO"
  },
  {
    "serialNumber": "135",
    "sunrackCode": "SRC-135",
    "itemDescription": "Slotted Elevator - 5Deg -",
    "genericName": "5 Deg Elevator",
    "designWeight": 1.74987,
    "selectedRmVendor": "SMALCO"
  },
  {
    "serialNumber": "136",
    "sunrackCode": "SRC-136",
    "itemDescription": "120mm Short Rail",
    "genericName": "120mm Short Rail",
    "designWeight": 1.3869900000000002,
    "selectedRmVendor": "SMALCO"
  },
  {
    "serialNumber": "137",
    "sunrackCode": "SRC-137",
    "itemDescription": "Strut Rail Nut",
    "genericName": "Strut Rail Nut",
    "designWeight": 0.6501600000000001,
    "selectedRmVendor": "Ratco"
  },
  {
    "serialNumber": "138",
    "sunrackCode": "SRC-138",
    "itemDescription": "150mm Short Rail",
    "genericName": "150mm Short Rail",
    "designWeight": 2.15946,
    "selectedRmVendor": "JM"
  },
  {
    "serialNumber": "139",
    "sunrackCode": "SRC-139",
    "itemDescription": "150mm Height - 50mm Width - 3 M8 Slots - Sliding notches",
    "genericName": "150mm Inter-Lock Column",
    "designWeight": 3.47571,
    "selectedRmVendor": "Darshan"
  },
  {
    "serialNumber": "140",
    "sunrackCode": "SRC-140",
    "itemDescription": "2 Part - Seam Clamp - Type 2 - Part A - 105mm Height",
    "genericName": "100mm Part A - 2 Part Seam Clamp",
    "designWeight": 1.0746000000000002,
    "selectedRmVendor": "Reat"
  }
];

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
      console.log(`✓ Upserted item ${item.serialNumber}: ${item.genericName}`);
    } catch (error) {
      console.error(`✗ Failed to upsert item ${item.serialNumber}:`, error.message);
    }
  }

  // Delete existing RM codes first to avoid duplicates
  console.log('\nCleaning existing RM codes...');
  await prisma.rmCode.deleteMany({});

  // Insert RM Codes
  console.log('Inserting RM codes...');
  const rmCodes = [
  {
    "itemSerialNumber": "1",
    "vendorName": "Reat",
    "code": "MA 01"
  },
  {
    "itemSerialNumber": "1",
    "vendorName": "Excellence",
    "code": "EX 25"
  },
  {
    "itemSerialNumber": "1",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "1",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "1",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "1",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "1",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "1",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "1",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "1",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "2",
    "vendorName": "Reat",
    "code": "MA 07"
  },
  {
    "itemSerialNumber": "2",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "2",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "2",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "2",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "2",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "2",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "2",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "2",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "2",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "3",
    "vendorName": "Reat",
    "code": "MA 09"
  },
  {
    "itemSerialNumber": "3",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "3",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "3",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "3",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "3",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "3",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "3",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "3",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "3",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "4",
    "vendorName": "Reat",
    "code": "MA 10"
  },
  {
    "itemSerialNumber": "4",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "4",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "4",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "4",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "4",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "4",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "4",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "4",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "4",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "5",
    "vendorName": "Reat",
    "code": "MA 11C"
  },
  {
    "itemSerialNumber": "5",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "5",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "5",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "5",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "5",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "5",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "5",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "5",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "5",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "6",
    "vendorName": "Reat",
    "code": "MA 12"
  },
  {
    "itemSerialNumber": "6",
    "vendorName": "Excellence",
    "code": "EX 30"
  },
  {
    "itemSerialNumber": "6",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "6",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "6",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "6",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "6",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "6",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "6",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "6",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "7",
    "vendorName": "Reat",
    "code": "MA 16"
  },
  {
    "itemSerialNumber": "7",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "7",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "7",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "7",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "7",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "7",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "7",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "7",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "7",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "8",
    "vendorName": "Reat",
    "code": "MA 17"
  },
  {
    "itemSerialNumber": "8",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "8",
    "vendorName": "VARN",
    "code": "SR 01"
  },
  {
    "itemSerialNumber": "8",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "8",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "8",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "8",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "8",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "8",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "8",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "9",
    "vendorName": "Reat",
    "code": "MA 23"
  },
  {
    "itemSerialNumber": "9",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "9",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "9",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "9",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "9",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "9",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "9",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "9",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "9",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "10",
    "vendorName": "Reat",
    "code": "MA 24"
  },
  {
    "itemSerialNumber": "10",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "10",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "10",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "10",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "10",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "10",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "10",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "10",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "10",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "11",
    "vendorName": "Reat",
    "code": "MA 25A"
  },
  {
    "itemSerialNumber": "11",
    "vendorName": "Excellence",
    "code": "EX 37"
  },
  {
    "itemSerialNumber": "11",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "11",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "11",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "11",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "11",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "11",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "11",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "11",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "12",
    "vendorName": "Reat",
    "code": "MA 26"
  },
  {
    "itemSerialNumber": "12",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "12",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "12",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "12",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "12",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "12",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "12",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "12",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "12",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "13",
    "vendorName": "Reat",
    "code": "MA 27"
  },
  {
    "itemSerialNumber": "13",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "13",
    "vendorName": "VARN",
    "code": "SR 04"
  },
  {
    "itemSerialNumber": "13",
    "vendorName": "RC",
    "code": "SU 04"
  },
  {
    "itemSerialNumber": "13",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "13",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "13",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "13",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "13",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "13",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "14",
    "vendorName": "Reat",
    "code": "MA 28"
  },
  {
    "itemSerialNumber": "14",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "14",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "14",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "14",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "14",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "14",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "14",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "14",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "14",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "15",
    "vendorName": "Reat",
    "code": "MA 29"
  },
  {
    "itemSerialNumber": "15",
    "vendorName": "Excellence",
    "code": "EX 20"
  },
  {
    "itemSerialNumber": "15",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "15",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "15",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "15",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "15",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "15",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "15",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "15",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "16",
    "vendorName": "Reat",
    "code": "MA 30"
  },
  {
    "itemSerialNumber": "16",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "16",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "16",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "16",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "16",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "16",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "16",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "16",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "16",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "17",
    "vendorName": "Reat",
    "code": "MA 31"
  },
  {
    "itemSerialNumber": "17",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "17",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "17",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "17",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "17",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "17",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "17",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "17",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "17",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "18",
    "vendorName": "Reat",
    "code": "MA 34"
  },
  {
    "itemSerialNumber": "18",
    "vendorName": "Excellence",
    "code": "EX 58"
  },
  {
    "itemSerialNumber": "18",
    "vendorName": "VARN",
    "code": "SR 10"
  },
  {
    "itemSerialNumber": "18",
    "vendorName": "RC",
    "code": "SR 01 (RC"
  },
  {
    "itemSerialNumber": "18",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "18",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "18",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "18",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "18",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "18",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "19",
    "vendorName": "Reat",
    "code": "MA 35"
  },
  {
    "itemSerialNumber": "19",
    "vendorName": "Excellence",
    "code": "EX 55"
  },
  {
    "itemSerialNumber": "19",
    "vendorName": "VARN",
    "code": "SR 02"
  },
  {
    "itemSerialNumber": "19",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "19",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "19",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "19",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "19",
    "vendorName": "Ratco",
    "code": "RL 49703"
  },
  {
    "itemSerialNumber": "19",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "19",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "20",
    "vendorName": "Reat",
    "code": "MA 36"
  },
  {
    "itemSerialNumber": "20",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "20",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "20",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "20",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "20",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "20",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "20",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "20",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "20",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "21",
    "vendorName": "Reat",
    "code": "MA 38"
  },
  {
    "itemSerialNumber": "21",
    "vendorName": "Excellence",
    "code": "EX 52"
  },
  {
    "itemSerialNumber": "21",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "21",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "21",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "21",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "21",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "21",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "21",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "21",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "22",
    "vendorName": "Reat",
    "code": "MA 39"
  },
  {
    "itemSerialNumber": "22",
    "vendorName": "Excellence",
    "code": "EX 19"
  },
  {
    "itemSerialNumber": "22",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "22",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "22",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "22",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "22",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "22",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "22",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "22",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "23",
    "vendorName": "Reat",
    "code": "MA 40"
  },
  {
    "itemSerialNumber": "23",
    "vendorName": "Excellence",
    "code": "EX 31"
  },
  {
    "itemSerialNumber": "23",
    "vendorName": "VARN",
    "code": "SR 07"
  },
  {
    "itemSerialNumber": "23",
    "vendorName": "RC",
    "code": "SU 01"
  },
  {
    "itemSerialNumber": "23",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "23",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "23",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "23",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "23",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "23",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "24",
    "vendorName": "Reat",
    "code": "MA 41"
  },
  {
    "itemSerialNumber": "24",
    "vendorName": "Excellence",
    "code": "EX 22"
  },
  {
    "itemSerialNumber": "24",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "24",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "24",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "24",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "24",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "24",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "24",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "24",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "25",
    "vendorName": "Reat",
    "code": "MA 42"
  },
  {
    "itemSerialNumber": "25",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "25",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "25",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "25",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "25",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "25",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "25",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "25",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "25",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "26",
    "vendorName": "Reat",
    "code": "MA 43"
  },
  {
    "itemSerialNumber": "26",
    "vendorName": "Excellence",
    "code": "EX 03"
  },
  {
    "itemSerialNumber": "26",
    "vendorName": "VARN",
    "code": "SR 14"
  },
  {
    "itemSerialNumber": "26",
    "vendorName": "RC",
    "code": "SU 08"
  },
  {
    "itemSerialNumber": "26",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "26",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "26",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "26",
    "vendorName": "Ratco",
    "code": "RL 49702"
  },
  {
    "itemSerialNumber": "26",
    "vendorName": "Sai deep",
    "code": "SD 4328"
  },
  {
    "itemSerialNumber": "26",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "27",
    "vendorName": "Reat",
    "code": "MA 44"
  },
  {
    "itemSerialNumber": "27",
    "vendorName": "Excellence",
    "code": "EX 15"
  },
  {
    "itemSerialNumber": "27",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "27",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "27",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "27",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "27",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "27",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "27",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "27",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "28",
    "vendorName": "Reat",
    "code": "MA 46"
  },
  {
    "itemSerialNumber": "28",
    "vendorName": "Excellence",
    "code": "EX 23"
  },
  {
    "itemSerialNumber": "28",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "28",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "28",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "28",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "28",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "28",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "28",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "28",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "29",
    "vendorName": "Reat",
    "code": "MA 47"
  },
  {
    "itemSerialNumber": "29",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "29",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "29",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "29",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "29",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "29",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "29",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "29",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "29",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "30",
    "vendorName": "Reat",
    "code": "MA 48"
  },
  {
    "itemSerialNumber": "30",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "30",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "30",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "30",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "30",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "30",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "30",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "30",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "30",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "31",
    "vendorName": "Reat",
    "code": "MA 49"
  },
  {
    "itemSerialNumber": "31",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "31",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "31",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "31",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "31",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "31",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "31",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "31",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "31",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "32",
    "vendorName": "Reat",
    "code": "MA 50"
  },
  {
    "itemSerialNumber": "32",
    "vendorName": "Excellence",
    "code": "EX 07"
  },
  {
    "itemSerialNumber": "32",
    "vendorName": "VARN",
    "code": "SR 05"
  },
  {
    "itemSerialNumber": "32",
    "vendorName": "RC",
    "code": "SU 07"
  },
  {
    "itemSerialNumber": "32",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "32",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "32",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "32",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "32",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "32",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "33",
    "vendorName": "Reat",
    "code": "MA 51"
  },
  {
    "itemSerialNumber": "33",
    "vendorName": "Excellence",
    "code": "EX 32"
  },
  {
    "itemSerialNumber": "33",
    "vendorName": "VARN",
    "code": "SR 06"
  },
  {
    "itemSerialNumber": "33",
    "vendorName": "RC",
    "code": "SU 06"
  },
  {
    "itemSerialNumber": "33",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "33",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "33",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "33",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "33",
    "vendorName": "Sai deep",
    "code": "SD 4330"
  },
  {
    "itemSerialNumber": "33",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "34",
    "vendorName": "Reat",
    "code": "MA 52"
  },
  {
    "itemSerialNumber": "34",
    "vendorName": "Excellence",
    "code": "EX 67"
  },
  {
    "itemSerialNumber": "34",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "34",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "34",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "34",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "34",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "34",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "34",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "34",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "35",
    "vendorName": "Reat",
    "code": "MA 54"
  },
  {
    "itemSerialNumber": "35",
    "vendorName": "Excellence",
    "code": "EX 21"
  },
  {
    "itemSerialNumber": "35",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "35",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "35",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "35",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "35",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "35",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "35",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "35",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "36",
    "vendorName": "Reat",
    "code": "MA 55"
  },
  {
    "itemSerialNumber": "36",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "36",
    "vendorName": "VARN",
    "code": "SR 08"
  },
  {
    "itemSerialNumber": "36",
    "vendorName": "RC",
    "code": "SU 05"
  },
  {
    "itemSerialNumber": "36",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "36",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "36",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "36",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "36",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "36",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "37",
    "vendorName": "Reat",
    "code": "MA 56"
  },
  {
    "itemSerialNumber": "37",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "37",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "37",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "37",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "37",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "37",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "37",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "37",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "37",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "38",
    "vendorName": "Reat",
    "code": "MA 57"
  },
  {
    "itemSerialNumber": "38",
    "vendorName": "Excellence",
    "code": "EX 16"
  },
  {
    "itemSerialNumber": "38",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "38",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "38",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "38",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "38",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "38",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "38",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "38",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "39",
    "vendorName": "Reat",
    "code": "MA 58"
  },
  {
    "itemSerialNumber": "39",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "39",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "39",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "39",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "39",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "39",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "39",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "39",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "39",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "40",
    "vendorName": "Reat",
    "code": "MA 59"
  },
  {
    "itemSerialNumber": "40",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "40",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "40",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "40",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "40",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "40",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "40",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "40",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "40",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "41",
    "vendorName": "Reat",
    "code": "MA 60"
  },
  {
    "itemSerialNumber": "41",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "41",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "41",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "41",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "41",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "41",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "41",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "41",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "41",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "42",
    "vendorName": "Reat",
    "code": "MA 63"
  },
  {
    "itemSerialNumber": "42",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "42",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "42",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "42",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "42",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "42",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "42",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "42",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "42",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "43",
    "vendorName": "Reat",
    "code": "MA 64"
  },
  {
    "itemSerialNumber": "43",
    "vendorName": "Excellence",
    "code": "EX 34"
  },
  {
    "itemSerialNumber": "43",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "43",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "43",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "43",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "43",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "43",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "43",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "43",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "44",
    "vendorName": "Reat",
    "code": "MA 65"
  },
  {
    "itemSerialNumber": "44",
    "vendorName": "Excellence",
    "code": "EX 33"
  },
  {
    "itemSerialNumber": "44",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "44",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "44",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "44",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "44",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "44",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "44",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "44",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "45",
    "vendorName": "Reat",
    "code": "MA 68"
  },
  {
    "itemSerialNumber": "45",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "45",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "45",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "45",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "45",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "45",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "45",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "45",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "45",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "46",
    "vendorName": "Reat",
    "code": "MA 69"
  },
  {
    "itemSerialNumber": "46",
    "vendorName": "Excellence",
    "code": "EX 62"
  },
  {
    "itemSerialNumber": "46",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "46",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "46",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "46",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "46",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "46",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "46",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "46",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "47",
    "vendorName": "Reat",
    "code": "MA 72"
  },
  {
    "itemSerialNumber": "47",
    "vendorName": "Excellence",
    "code": "EX 24"
  },
  {
    "itemSerialNumber": "47",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "47",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "47",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "47",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "47",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "47",
    "vendorName": "Ratco",
    "code": "RL 49705"
  },
  {
    "itemSerialNumber": "47",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "47",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "48",
    "vendorName": "Reat",
    "code": "MA 73"
  },
  {
    "itemSerialNumber": "48",
    "vendorName": "Excellence",
    "code": "EX 68"
  },
  {
    "itemSerialNumber": "48",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "48",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "48",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "48",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "48",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "48",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "48",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "48",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "49",
    "vendorName": "Reat",
    "code": "MA 74"
  },
  {
    "itemSerialNumber": "49",
    "vendorName": "Excellence",
    "code": "EX 63"
  },
  {
    "itemSerialNumber": "49",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "49",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "49",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "49",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "49",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "49",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "49",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "49",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "50",
    "vendorName": "Reat",
    "code": "MA 75"
  },
  {
    "itemSerialNumber": "50",
    "vendorName": "Excellence",
    "code": "EX 28"
  },
  {
    "itemSerialNumber": "50",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "50",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "50",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "50",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "50",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "50",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "50",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "50",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "51",
    "vendorName": "Reat",
    "code": "MA 76"
  },
  {
    "itemSerialNumber": "51",
    "vendorName": "Excellence",
    "code": "EX 09"
  },
  {
    "itemSerialNumber": "51",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "51",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "51",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "51",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "51",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "51",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "51",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "51",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "52",
    "vendorName": "Reat",
    "code": "MA 77"
  },
  {
    "itemSerialNumber": "52",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "52",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "52",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "52",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "52",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "52",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "52",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "52",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "52",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "53",
    "vendorName": "Reat",
    "code": "MA 81"
  },
  {
    "itemSerialNumber": "53",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "53",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "53",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "53",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "53",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "53",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "53",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "53",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "53",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "54",
    "vendorName": "Reat",
    "code": "MA 82"
  },
  {
    "itemSerialNumber": "54",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "54",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "54",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "54",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "54",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "54",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "54",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "54",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "54",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "55",
    "vendorName": "Reat",
    "code": "LA25x25"
  },
  {
    "itemSerialNumber": "55",
    "vendorName": "Excellence",
    "code": "EX 64"
  },
  {
    "itemSerialNumber": "55",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "55",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "55",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "55",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "55",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "55",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "55",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "55",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "56",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "56",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "56",
    "vendorName": "VARN",
    "code": "SR 03"
  },
  {
    "itemSerialNumber": "56",
    "vendorName": "RC",
    "code": "SU 12"
  },
  {
    "itemSerialNumber": "56",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "56",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "56",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "56",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "56",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "56",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "57",
    "vendorName": "Reat",
    "code": "MA 107"
  },
  {
    "itemSerialNumber": "57",
    "vendorName": "Excellence",
    "code": "EX 61"
  },
  {
    "itemSerialNumber": "57",
    "vendorName": "VARN",
    "code": "SR 09"
  },
  {
    "itemSerialNumber": "57",
    "vendorName": "RC",
    "code": "SU 03"
  },
  {
    "itemSerialNumber": "57",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "57",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "57",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "57",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "57",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "57",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "58",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "58",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "58",
    "vendorName": "VARN",
    "code": "SR 11"
  },
  {
    "itemSerialNumber": "58",
    "vendorName": "RC",
    "code": "SU 14"
  },
  {
    "itemSerialNumber": "58",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "58",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "58",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "58",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "58",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "58",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "59",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "59",
    "vendorName": "Excellence",
    "code": "EX 60"
  },
  {
    "itemSerialNumber": "59",
    "vendorName": "VARN",
    "code": "SR 12"
  },
  {
    "itemSerialNumber": "59",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "59",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "59",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "59",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "59",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "59",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "59",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "60",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "60",
    "vendorName": "Excellence",
    "code": "EX 54"
  },
  {
    "itemSerialNumber": "60",
    "vendorName": "VARN",
    "code": "SR 13"
  },
  {
    "itemSerialNumber": "60",
    "vendorName": "RC",
    "code": "SU 11"
  },
  {
    "itemSerialNumber": "60",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "60",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "60",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "60",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "60",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "60",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "61",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "61",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "61",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "61",
    "vendorName": "RC",
    "code": "SU 02"
  },
  {
    "itemSerialNumber": "61",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "61",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "61",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "61",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "61",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "61",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "62",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "62",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "62",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "62",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "62",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "62",
    "vendorName": "Darshan",
    "code": "DR 1"
  },
  {
    "itemSerialNumber": "62",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "62",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "62",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "62",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "63",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "63",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "63",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "63",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "63",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "63",
    "vendorName": "Darshan",
    "code": "DR 2"
  },
  {
    "itemSerialNumber": "63",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "63",
    "vendorName": "Ratco",
    "code": "RL 49706"
  },
  {
    "itemSerialNumber": "63",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "63",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "64",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "64",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "64",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "64",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "64",
    "vendorName": "SMALCO",
    "code": "SN 5303"
  },
  {
    "itemSerialNumber": "64",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "64",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "64",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "64",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "64",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "65",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "65",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "65",
    "vendorName": "VARN",
    "code": "SR 16"
  },
  {
    "itemSerialNumber": "65",
    "vendorName": "RC",
    "code": "SU 13"
  },
  {
    "itemSerialNumber": "65",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "65",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "65",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "65",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "65",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "65",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "66",
    "vendorName": "Reat",
    "code": "MA 84"
  },
  {
    "itemSerialNumber": "66",
    "vendorName": "Excellence",
    "code": "EX 29"
  },
  {
    "itemSerialNumber": "66",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "66",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "66",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "66",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "66",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "66",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "66",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "66",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "67",
    "vendorName": "Reat",
    "code": "MA 85"
  },
  {
    "itemSerialNumber": "67",
    "vendorName": "Excellence",
    "code": "EX 49"
  },
  {
    "itemSerialNumber": "67",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "67",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "67",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "67",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "67",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "67",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "67",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "67",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "68",
    "vendorName": "Reat",
    "code": "MA 86"
  },
  {
    "itemSerialNumber": "68",
    "vendorName": "Excellence",
    "code": "EX 65"
  },
  {
    "itemSerialNumber": "68",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "68",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "68",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "68",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "68",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "68",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "68",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "68",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "69",
    "vendorName": "Reat",
    "code": "MA 87"
  },
  {
    "itemSerialNumber": "69",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "69",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "69",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "69",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "69",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "69",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "69",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "69",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "69",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "70",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "70",
    "vendorName": "Excellence",
    "code": "EX 01"
  },
  {
    "itemSerialNumber": "70",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "70",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "70",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "70",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "70",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "70",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "70",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "70",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "71",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "71",
    "vendorName": "Excellence",
    "code": "EX 02"
  },
  {
    "itemSerialNumber": "71",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "71",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "71",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "71",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "71",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "71",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "71",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "71",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "72",
    "vendorName": "Reat",
    "code": "MA 112"
  },
  {
    "itemSerialNumber": "72",
    "vendorName": "Excellence",
    "code": "EX 04"
  },
  {
    "itemSerialNumber": "72",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "72",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "72",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "72",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "72",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "72",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "72",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "72",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "73",
    "vendorName": "Reat",
    "code": "MA 111"
  },
  {
    "itemSerialNumber": "73",
    "vendorName": "Excellence",
    "code": "EX 05"
  },
  {
    "itemSerialNumber": "73",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "73",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "73",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "73",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "73",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "73",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "73",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "73",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "74",
    "vendorName": "Reat",
    "code": "MA 108"
  },
  {
    "itemSerialNumber": "74",
    "vendorName": "Excellence",
    "code": "EX 06"
  },
  {
    "itemSerialNumber": "74",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "74",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "74",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "74",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "74",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "74",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "74",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "74",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "75",
    "vendorName": "Reat",
    "code": "MA 89"
  },
  {
    "itemSerialNumber": "75",
    "vendorName": "Excellence",
    "code": "EX 35"
  },
  {
    "itemSerialNumber": "75",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "75",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "75",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "75",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "75",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "75",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "75",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "75",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "76",
    "vendorName": "Reat",
    "code": "MA 90"
  },
  {
    "itemSerialNumber": "76",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "76",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "76",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "76",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "76",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "76",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "76",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "76",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "76",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "77",
    "vendorName": "Reat",
    "code": "MA 91"
  },
  {
    "itemSerialNumber": "77",
    "vendorName": "Excellence",
    "code": "EX 13"
  },
  {
    "itemSerialNumber": "77",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "77",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "77",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "77",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "77",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "77",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "77",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "77",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "78",
    "vendorName": "Reat",
    "code": "MA 92"
  },
  {
    "itemSerialNumber": "78",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "78",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "78",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "78",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "78",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "78",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "78",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "78",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "78",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "79",
    "vendorName": "Reat",
    "code": "MA 93"
  },
  {
    "itemSerialNumber": "79",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "79",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "79",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "79",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "79",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "79",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "79",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "79",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "79",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "80",
    "vendorName": "Reat",
    "code": "MA 94"
  },
  {
    "itemSerialNumber": "80",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "80",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "80",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "80",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "80",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "80",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "80",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "80",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "80",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "81",
    "vendorName": "Reat",
    "code": "MA 95"
  },
  {
    "itemSerialNumber": "81",
    "vendorName": "Excellence",
    "code": "EX 47"
  },
  {
    "itemSerialNumber": "81",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "81",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "81",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "81",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "81",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "81",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "81",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "81",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "82",
    "vendorName": "Reat",
    "code": "MA 97"
  },
  {
    "itemSerialNumber": "82",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "82",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "82",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "82",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "82",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "82",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "82",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "82",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "82",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "83",
    "vendorName": "Reat",
    "code": "MA 98"
  },
  {
    "itemSerialNumber": "83",
    "vendorName": "Excellence",
    "code": "EX 46"
  },
  {
    "itemSerialNumber": "83",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "83",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "83",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "83",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "83",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "83",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "83",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "83",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "84",
    "vendorName": "Reat",
    "code": "MA 99"
  },
  {
    "itemSerialNumber": "84",
    "vendorName": "Excellence",
    "code": "EX 57"
  },
  {
    "itemSerialNumber": "84",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "84",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "84",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "84",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "84",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "84",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "84",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "84",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "85",
    "vendorName": "Reat",
    "code": "MA 100"
  },
  {
    "itemSerialNumber": "85",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "85",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "85",
    "vendorName": "RC",
    "code": "SU 19"
  },
  {
    "itemSerialNumber": "85",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "85",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "85",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "85",
    "vendorName": "Ratco",
    "code": "RL 49707"
  },
  {
    "itemSerialNumber": "85",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "85",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "86",
    "vendorName": "Reat",
    "code": "MA 102"
  },
  {
    "itemSerialNumber": "86",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "86",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "86",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "86",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "86",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "86",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "86",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "86",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "86",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "87",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "87",
    "vendorName": "Excellence",
    "code": "EX 08"
  },
  {
    "itemSerialNumber": "87",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "87",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "87",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "87",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "87",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "87",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "87",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "87",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "88",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "88",
    "vendorName": "Excellence",
    "code": "EX 10"
  },
  {
    "itemSerialNumber": "88",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "88",
    "vendorName": "RC",
    "code": "SU 18"
  },
  {
    "itemSerialNumber": "88",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "88",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "88",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "88",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "88",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "88",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "89",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "89",
    "vendorName": "Excellence",
    "code": "EX 11"
  },
  {
    "itemSerialNumber": "89",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "89",
    "vendorName": "RC",
    "code": "SU 17"
  },
  {
    "itemSerialNumber": "89",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "89",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "89",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "89",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "89",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "89",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "90",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "90",
    "vendorName": "Excellence",
    "code": "EX 12"
  },
  {
    "itemSerialNumber": "90",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "90",
    "vendorName": "RC",
    "code": "SU 18"
  },
  {
    "itemSerialNumber": "90",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "90",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "90",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "90",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "90",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "90",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "91",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "91",
    "vendorName": "Excellence",
    "code": "EX 17"
  },
  {
    "itemSerialNumber": "91",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "91",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "91",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "91",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "91",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "91",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "91",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "91",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "92",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "92",
    "vendorName": "Excellence",
    "code": "EX 18"
  },
  {
    "itemSerialNumber": "92",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "92",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "92",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "92",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "92",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "92",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "92",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "92",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "93",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "93",
    "vendorName": "Excellence",
    "code": "EX 26"
  },
  {
    "itemSerialNumber": "93",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "93",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "93",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "93",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "93",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "93",
    "vendorName": "Ratco",
    "code": "RL 49701"
  },
  {
    "itemSerialNumber": "93",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "93",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "94",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "94",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "94",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "94",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "94",
    "vendorName": "SMALCO",
    "code": "SN 5306"
  },
  {
    "itemSerialNumber": "94",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "94",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "94",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "94",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "94",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "95",
    "vendorName": "Reat",
    "code": "MA 103"
  },
  {
    "itemSerialNumber": "95",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "95",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "95",
    "vendorName": "RC",
    "code": "SU 20"
  },
  {
    "itemSerialNumber": "95",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "95",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "95",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "95",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "95",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "95",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "96",
    "vendorName": "Reat",
    "code": "MA 104"
  },
  {
    "itemSerialNumber": "96",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "96",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "96",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "96",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "96",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "96",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "96",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "96",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "96",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "97",
    "vendorName": "Reat",
    "code": "MA 105"
  },
  {
    "itemSerialNumber": "97",
    "vendorName": "Excellence",
    "code": "EX 38"
  },
  {
    "itemSerialNumber": "97",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "97",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "97",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "97",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "97",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "97",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "97",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "97",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "98",
    "vendorName": "Reat",
    "code": "MA 106"
  },
  {
    "itemSerialNumber": "98",
    "vendorName": "Excellence",
    "code": "EX 50"
  },
  {
    "itemSerialNumber": "98",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "98",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "98",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "98",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "98",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "98",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "98",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "98",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "99",
    "vendorName": "Reat",
    "code": "MA 109"
  },
  {
    "itemSerialNumber": "99",
    "vendorName": "Excellence",
    "code": "EX 53"
  },
  {
    "itemSerialNumber": "99",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "99",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "99",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "99",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "99",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "99",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "99",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "99",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "100",
    "vendorName": "Reat",
    "code": "MA 110"
  },
  {
    "itemSerialNumber": "100",
    "vendorName": "Excellence",
    "code": "EX 39"
  },
  {
    "itemSerialNumber": "100",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "100",
    "vendorName": "RC",
    "code": "SU 16"
  },
  {
    "itemSerialNumber": "100",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "100",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "100",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "100",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "100",
    "vendorName": "Sai deep",
    "code": "SD 4329"
  },
  {
    "itemSerialNumber": "100",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "101",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "101",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "101",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "101",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "101",
    "vendorName": "SMALCO",
    "code": "SN 5307"
  },
  {
    "itemSerialNumber": "101",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "101",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "101",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "101",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "101",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "102",
    "vendorName": "Reat",
    "code": "MA 113"
  },
  {
    "itemSerialNumber": "102",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "102",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "102",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "102",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "102",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "102",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "102",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "102",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "102",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "103",
    "vendorName": "Reat",
    "code": "MA 114"
  },
  {
    "itemSerialNumber": "103",
    "vendorName": "Excellence",
    "code": "EX 42"
  },
  {
    "itemSerialNumber": "103",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "103",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "103",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "103",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "103",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "103",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "103",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "103",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "104",
    "vendorName": "Reat",
    "code": "MA 115"
  },
  {
    "itemSerialNumber": "104",
    "vendorName": "Excellence",
    "code": "EX 45"
  },
  {
    "itemSerialNumber": "104",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "104",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "104",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "104",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "104",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "104",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "104",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "104",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "105",
    "vendorName": "Reat",
    "code": "MA 116"
  },
  {
    "itemSerialNumber": "105",
    "vendorName": "Excellence",
    "code": "EX 44"
  },
  {
    "itemSerialNumber": "105",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "105",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "105",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "105",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "105",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "105",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "105",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "105",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "106",
    "vendorName": "Reat",
    "code": "MA 117"
  },
  {
    "itemSerialNumber": "106",
    "vendorName": "Excellence",
    "code": "EX 43"
  },
  {
    "itemSerialNumber": "106",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "106",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "106",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "106",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "106",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "106",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "106",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "106",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "107",
    "vendorName": "Reat",
    "code": "MA 118"
  },
  {
    "itemSerialNumber": "107",
    "vendorName": "Excellence",
    "code": "EX 40"
  },
  {
    "itemSerialNumber": "107",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "107",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "107",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "107",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "107",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "107",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "107",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "107",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "108",
    "vendorName": "Reat",
    "code": "MA 119"
  },
  {
    "itemSerialNumber": "108",
    "vendorName": "Excellence",
    "code": "EX 59"
  },
  {
    "itemSerialNumber": "108",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "108",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "108",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "108",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "108",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "108",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "108",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "108",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "109",
    "vendorName": "Reat",
    "code": "MA 120"
  },
  {
    "itemSerialNumber": "109",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "109",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "109",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "109",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "109",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "109",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "109",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "109",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "109",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "110",
    "vendorName": "Reat",
    "code": "MA 121"
  },
  {
    "itemSerialNumber": "110",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "110",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "110",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "110",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "110",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "110",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "110",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "110",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "110",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "111",
    "vendorName": "Reat",
    "code": "MA 122"
  },
  {
    "itemSerialNumber": "111",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "111",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "111",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "111",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "111",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "111",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "111",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "111",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "111",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "112",
    "vendorName": "Reat",
    "code": "MA 123"
  },
  {
    "itemSerialNumber": "112",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "112",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "112",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "112",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "112",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "112",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "112",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "112",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "112",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "113",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "113",
    "vendorName": "Excellence",
    "code": "EX 36"
  },
  {
    "itemSerialNumber": "113",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "113",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "113",
    "vendorName": "SMALCO",
    "code": "SN 5315"
  },
  {
    "itemSerialNumber": "113",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "113",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "113",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "113",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "113",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "114",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "114",
    "vendorName": "Excellence",
    "code": "EX 41"
  },
  {
    "itemSerialNumber": "114",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "114",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "114",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "114",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "114",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "114",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "114",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "114",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "115",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "115",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "115",
    "vendorName": "VARN",
    "code": "SR 18"
  },
  {
    "itemSerialNumber": "115",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "115",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "115",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "115",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "115",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "115",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "115",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "116",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "116",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "116",
    "vendorName": "VARN",
    "code": "SR 17"
  },
  {
    "itemSerialNumber": "116",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "116",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "116",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "116",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "116",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "116",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "116",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "117",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "117",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "117",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "117",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "117",
    "vendorName": "SMALCO",
    "code": "SN 5311"
  },
  {
    "itemSerialNumber": "117",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "117",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "117",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "117",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "117",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "118",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "118",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "118",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "118",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "118",
    "vendorName": "SMALCO",
    "code": "SN 5312"
  },
  {
    "itemSerialNumber": "118",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "118",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "118",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "118",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "118",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "119",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "119",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "119",
    "vendorName": "VARN",
    "code": "SR 15"
  },
  {
    "itemSerialNumber": "119",
    "vendorName": "RC",
    "code": "SU 15"
  },
  {
    "itemSerialNumber": "119",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "119",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "119",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "119",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "119",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "119",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "120",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "120",
    "vendorName": "Excellence",
    "code": "EX 51"
  },
  {
    "itemSerialNumber": "120",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "120",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "120",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "120",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "120",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "120",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "120",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "120",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "121",
    "vendorName": "Reat",
    "code": "MA 124"
  },
  {
    "itemSerialNumber": "121",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "121",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "121",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "121",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "121",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "121",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "121",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "121",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "121",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "122",
    "vendorName": "Reat",
    "code": "MA 125"
  },
  {
    "itemSerialNumber": "122",
    "vendorName": "Excellence",
    "code": "EX 66"
  },
  {
    "itemSerialNumber": "122",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "122",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "122",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "122",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "122",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "122",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "122",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "122",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "123",
    "vendorName": "Reat",
    "code": "MA 126"
  },
  {
    "itemSerialNumber": "123",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "123",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "123",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "123",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "123",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "123",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "123",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "123",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "123",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "124",
    "vendorName": "Reat",
    "code": "MA 127"
  },
  {
    "itemSerialNumber": "124",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "124",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "124",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "124",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "124",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "124",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "124",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "124",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "124",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "125",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "125",
    "vendorName": "Excellence",
    "code": "EX 56"
  },
  {
    "itemSerialNumber": "125",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "125",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "125",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "125",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "125",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "125",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "125",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "125",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "126",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "126",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "126",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "126",
    "vendorName": "RC",
    "code": "SU 09"
  },
  {
    "itemSerialNumber": "126",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "126",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "126",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "126",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "126",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "126",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "127",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "127",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "127",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "127",
    "vendorName": "RC",
    "code": "SU 10"
  },
  {
    "itemSerialNumber": "127",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "127",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "127",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "127",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "127",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "127",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "128",
    "vendorName": "Reat",
    "code": "MA 128"
  },
  {
    "itemSerialNumber": "128",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "128",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "128",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "128",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "128",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "128",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "128",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "128",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "128",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "130",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "130",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "130",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "130",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "130",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "130",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "130",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "130",
    "vendorName": "Ratco",
    "code": "RL 49708"
  },
  {
    "itemSerialNumber": "130",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "130",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "129",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "129",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "129",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "129",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "129",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "129",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "129",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "129",
    "vendorName": "Ratco",
    "code": "RL 49709"
  },
  {
    "itemSerialNumber": "129",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "129",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "131",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "131",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "131",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "131",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "131",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "131",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "131",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "131",
    "vendorName": "Ratco",
    "code": "RL 49710"
  },
  {
    "itemSerialNumber": "131",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "131",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "132",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "132",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "132",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "132",
    "vendorName": "RC",
    "code": "SU 21"
  },
  {
    "itemSerialNumber": "132",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "132",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "132",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "132",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "132",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "132",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "133",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "133",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "133",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "133",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "133",
    "vendorName": "SMALCO",
    "code": "SN 5313"
  },
  {
    "itemSerialNumber": "133",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "133",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "133",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "133",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "133",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "134",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "134",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "134",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "134",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "134",
    "vendorName": "SMALCO",
    "code": "SN 5314"
  },
  {
    "itemSerialNumber": "134",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "134",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "134",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "134",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "134",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "135",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "135",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "135",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "135",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "135",
    "vendorName": "SMALCO",
    "code": "SN 5317"
  },
  {
    "itemSerialNumber": "135",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "135",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "135",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "135",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "135",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "136",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "136",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "136",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "136",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "136",
    "vendorName": "SMALCO",
    "code": "SN 5318"
  },
  {
    "itemSerialNumber": "136",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "136",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "136",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "136",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "136",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "137",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "137",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "137",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "137",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "137",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "137",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "137",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "137",
    "vendorName": "Ratco",
    "code": "RL 49704"
  },
  {
    "itemSerialNumber": "137",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "137",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "138",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "138",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "138",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "138",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "138",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "138",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "138",
    "vendorName": "JM",
    "code": "SR 02 (JM)"
  },
  {
    "itemSerialNumber": "138",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "138",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "138",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "139",
    "vendorName": "Reat",
    "code": null
  },
  {
    "itemSerialNumber": "139",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "139",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "139",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "139",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "139",
    "vendorName": "Darshan",
    "code": "DR 3"
  },
  {
    "itemSerialNumber": "139",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "139",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "139",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "139",
    "vendorName": "Elantor",
    "code": null
  },
  {
    "itemSerialNumber": "140",
    "vendorName": "Reat",
    "code": "MA 129"
  },
  {
    "itemSerialNumber": "140",
    "vendorName": "Excellence",
    "code": null
  },
  {
    "itemSerialNumber": "140",
    "vendorName": "VARN",
    "code": null
  },
  {
    "itemSerialNumber": "140",
    "vendorName": "RC",
    "code": null
  },
  {
    "itemSerialNumber": "140",
    "vendorName": "SMALCO",
    "code": null
  },
  {
    "itemSerialNumber": "140",
    "vendorName": "Darshan",
    "code": null
  },
  {
    "itemSerialNumber": "140",
    "vendorName": "JM",
    "code": null
  },
  {
    "itemSerialNumber": "140",
    "vendorName": "Ratco",
    "code": null
  },
  {
    "itemSerialNumber": "140",
    "vendorName": "Sai deep",
    "code": null
  },
  {
    "itemSerialNumber": "140",
    "vendorName": "Elantor",
    "code": null
  }
];

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

  console.log('\n✓ Seeding completed!');
  console.log(`✓ Total items: ${items.length}`);
  console.log(`✓ Total RM codes: ${rmCodes.length}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
