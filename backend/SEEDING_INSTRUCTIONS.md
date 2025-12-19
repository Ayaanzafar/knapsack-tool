# BOM Data Seeding Instructions

This guide will help you seed your production/server database with all BOM master items, formulas, and RM codes from your local database.

## Prerequisites

1. You have already exported your local data (file: `bom_data_export.json`)
2. Your server has Node.js and the backend code deployed
3. Your server's `.env` file is configured with the production database URL

## Steps to Seed Production Database

### Step 1: Copy Files to Server

Upload these files to your server's backend directory:
```bash
backend/
├── bom_data_export.json          # Exported data (149 items)
└── scripts/
    └── seedBomComplete.js         # Seed script
```

### Step 2: Install Dependencies on Server

```bash
cd /path/to/backend
npm install
```

### Step 3: Run Prisma Migration

Make sure your database schema is up to date:
```bash
npx prisma migrate deploy
```

### Step 4: Run the Seed Script

```bash
node scripts/seedBomComplete.js
```

## What the Script Does

The seed script will:
- ✅ Read all 149 BOM items from `bom_data_export.json`
- ✅ Create each BOM master item
- ✅ Create associated formulas for each item
- ✅ Create associated RM codes (vendor codes) for each item
- ✅ Skip items that already exist (safe to run multiple times)
- ✅ Show progress and summary at the end

## Expected Output

```
🌱 Starting comprehensive BOM data seeding...

📊 Found 149 BOM items to seed

✅ Created: 1 - Big Rail Nut
   ➕ Added 10 RM code(s)
✅ Created: 2 - 80mm Mini Rail
   ➕ Added 10 RM code(s)
...
⏭️  Skipping 149 - Item Name (already exists)

============================================================
🎉 Seeding completed!
✅ Successfully created: 149 items
⏭️  Skipped (already exist): 0 items
❌ Errors: 0 items
📊 Total processed: 149 items
============================================================
```

## Troubleshooting

### Error: "bom_data_export.json not found"
- Make sure you copied the JSON file to the backend directory

### Error: "Unique constraint failed"
- This means some items already exist
- The script will skip existing items automatically

### Database Connection Error
- Check your `.env` file has the correct `DATABASE_URL`
- Make sure the database is accessible from the server

## Data Overview

Your export contains:
- **149 BOM Master Items**
- **Profiles, Accessories, Fasteners, Hardware**
- **All formulas for quantity calculations**
- **All RM codes for 10 vendors** (Regal, Excellence, VARN, RC, SNALCO, Darshan, JM, Ralco, Sai deep, Eleanor)

## Important Notes

- ⚠️ The script is **idempotent** - safe to run multiple times
- ⚠️ It will **not delete** or **overwrite** existing data
- ⚠️ It will **skip** items that already exist
- ✅ You can run it on an empty database or a database with some items already

---

**Created:** December 19, 2025
**BOM Items:** 149
**Source:** Local knapsack_db database
