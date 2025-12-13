# BOM Data Seeding Guide

## Overview
This guide explains how to populate the `bom_master_items` and `rm_codes` tables with data from the Excel file.

## Quick Start - Seed Database

To populate both tables with data, run:

```bash
cd backend
node scripts/seedBomData.js
```

This will:
- Insert/update all BOM master items (profiles, components, etc.)
- Clear and re-insert all RM vendor codes (Reat, Excellence, VARN, RC, SMALCO, Darshan, JM, Ratco, Sai deep, Elantor)

## Files in `backend/scripts/`

### 1. `seedBomData.js` ✅ **USE THIS TO SEED DATA**
- Pre-generated seed file with all BOM data
- Contains data for both `bom_master_items` and `rm_codes` tables
- Safe to run multiple times (uses upsert logic)
- **Run this file to populate your database**

### 2. `importBomData.js` (Optional - Only if regenerating from Excel)
- Reads Excel file and generates `seedBomData.js`
- Excel file path: `d:\sunrack\All Profiles - 05-12-2025 - Product Codes.xlsx`
- Only run this if you need to regenerate seed data from updated Excel

## When to Use

### On New Server/Laptop
```bash
node scripts/seedBomData.js
```

### After Database Reset/Migration
```bash
npx prisma migrate reset  # Resets database
node scripts/seedBomData.js  # Re-seed data
```

### If Excel Data is Updated
```bash
# Step 1: Regenerate seed file from Excel
node scripts/importBomData.js

# Step 2: Run the newly generated seed file
node scripts/seedBomData.js
```

## Verification

After seeding, verify the data:

```bash
# Check BOM items count
node scripts/verifyData.js

# Or check specific item
node scripts/checkItem.js

# Or find by RM code
node scripts/findByRmCode.js
```

## Important Notes

- The seed file is already generated and ready to use
- You don't need the Excel file to seed data (it's embedded in `seedBomData.js`)
- Safe to run multiple times - it will update existing records
- RM codes are deleted and re-inserted on each run to ensure freshness
