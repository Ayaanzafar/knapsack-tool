# SB1 & SB2 Storage Fix

## 🐛 Issues Fixed

### Issue 1: SB1 Values Not Saving to Database
**Problem**: When you enabled SB2 column, SB1 input field showed calculated values, but they weren't saving to database (stayed NULL).

**Root Cause**: Input field displayed calculated value, but if you didn't manually type/change it, no `onChange` event fired, so database was never updated.

**Solution**: Added automatic initialization - when you enable SB2, all rows' SB1 values are automatically saved to database with their calculated values.

### Issue 2: Tab Separation
**Verified**: Each row in database has correct `tab_id` - data IS separated by tabs ✅

---

## ✅ What's Fixed

1. **Auto-Initialize SB1**: When you enable SB2 column, all existing rows automatically get their SB1 values saved to database
2. **Manual Edit Works**: You can still manually change SB1 values and they save
3. **Null Handling**: Fixed null/0 handling to preserve calculated values correctly
4. **Tab Isolation**: Each tab's data is completely separate (verified in your screenshot)

---

## 🧪 How to Test

### Test 1: Enable SB2 - Auto-Save SB1

**Before Testing**: Make sure backend is running!
```bash
cd backend
npm run dev
```

**Steps**:
1. **Add some rows** (e.g., 3 rows with 2, 3, 4 modules)
2. SB1 column shows calculated values (auto-calculated)
3. **Enable "Enable SB2 Column"** checkbox at bottom
4. ✅ SB1 values should stay the same (not become 0)
5. **Refresh the page** (F5)
6. ✅ SB1 values should persist!

**Verify in Database**:
```sql
SELECT id, modules, quantity, support_base_1, support_base_2
FROM tab_rows
WHERE tab_id = YOUR_TAB_ID
ORDER BY row_number;
```

✅ **support_base_1 should have VALUES (not NULL)**

---

### Test 2: Edit SB1 Manually

1. With SB2 enabled, **change SB1 value** (e.g., change 2 to 5)
2. **Refresh page** (F5)
3. ✅ Your custom value (5) should persist

---

### Test 3: Edit SB2 Values

1. With SB2 enabled, **enter SB2 value** (e.g., 3)
2. **Refresh page** (F5)
3. ✅ SB2 value (3) should persist

---

### Test 4: Multiple Tabs Isolation

1. **Tab 1**: Enable SB2, set SB1=5, SB2=2
2. **Create Tab 2**: Add rows, enable SB2, set SB1=10, SB2=7
3. **Switch back to Tab 1**
4. ✅ Tab 1 should show SB1=5, SB2=2 (not Tab 2's values)
5. **Refresh page**
6. ✅ Both tabs retain their own values

---

## 🔍 Verify Database Storage

### Check All Rows
```sql
SELECT
    t.name AS tab_name,
    tr.id AS row_id,
    tr.modules,
    tr.support_base_1 AS sb1,
    tr.support_base_2 AS sb2
FROM tab_rows tr
JOIN tabs t ON tr.tab_id = t.id
ORDER BY t.id, tr.row_number;
```

**Expected Results**:
- ✅ `support_base_1` should have numbers (1, 2, 3, etc.) NOT NULL
- ✅ `support_base_2` should have numbers or NULL (if not set)
- ✅ Each tab's rows have different `tab_id`

---

## 📝 What Changed

### Files Modified:

1. **`knapsack-front/src/components/RailTable.jsx`**
   - Added `useEffect` to auto-initialize SB1 when enableSB2 is turned on
   - Fixed null handling in `sb1Value` calculation

2. **`knapsack-front/src/lib/tabStorageAPI.js`**
   - Fixed conversion from database: preserve `null` instead of converting to `0`

3. **`knapsack-front/src/hooks/usePersistedRows.js`**
   - Already handles saving SB1/SB2 correctly

---

## 🎯 Expected Behavior Now

| Action | SB1 | SB2 | Database |
|--------|-----|-----|----------|
| **SB2 Disabled** (default) | Shows calculated value | Hidden | NULL, NULL |
| **Enable SB2** | Shows calculated, **auto-saved** ✅ | Shows 0, editable | **Saved!** ✅, NULL |
| **Edit SB1/SB2** | Your custom value | Your custom value | **Saved!** ✅, **Saved!** ✅ |
| **Refresh Page** | Values persist ✅ | Values persist ✅ | ✅ ✅ |
| **Switch Tabs** | Each tab has own values ✅ | Each tab has own values ✅ | Isolated by `tab_id` ✅ |

---

## 🐛 If Still Not Working

### Check Backend Console
Look for errors like:
```
Failed to update row: ...
```

### Check Browser Console (F12)
Look for:
- Network errors (red in Network tab)
- JavaScript errors
- Failed API calls to `/api/rows/...`

### Check Database Connection
```sql
-- Verify database is accessible
SHOW TABLES;

-- Check if rows exist
SELECT COUNT(*) FROM tab_rows;
```

---

## ✨ Summary

**Before**:
- SB1 values NOT saving ❌
- Database showed NULL for support_base_1 ❌

**After**:
- SB1 values auto-save when enabling SB2 ✅
- Manual edits save correctly ✅
- All values persist on refresh ✅
- Each tab isolated ✅

---

**Test it now!** Enable SB2, check your database, and verify SB1 values are saved! 🎉
