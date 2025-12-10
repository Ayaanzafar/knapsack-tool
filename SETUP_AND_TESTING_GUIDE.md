# Database Migration - Setup and Testing Guide

## ✅ Migration Complete!

Your application has been successfully migrated from localStorage to a MySQL database backend.

## 📁 What's Been Done

### Backend (Complete)
- ✅ MySQL database `knapsack_db` created
- ✅ User `knapsack_user` configured with proper permissions
- ✅ Prisma ORM setup with 6 database tables:
  - `projects` - Stores project information
  - `tabs` - Stores tab data with all settings
  - `tab_rows` - Stores individual rows within tabs
  - `bom_master_items` - Master BOM catalog (15 items seeded)
  - `bom_formulas` - BOM calculation formulas (15 formulas seeded)
  - `generated_boms` - Historical BOM snapshots
- ✅ Express.js REST API with full CRUD operations
- ✅ All API endpoints implemented and ready

### Frontend (Complete)
- ✅ Axios HTTP client installed
- ✅ API service layer created (`src/services/api.js`)
- ✅ Tab storage migrated to API (`src/lib/tabStorageAPI.js`)
- ✅ App.jsx updated with:
  - Async data loading
  - Loading spinners
  - Error handling
  - Database integration
- ✅ Old App.jsx backed up to `App.jsx.backup`

---

## 🚀 How to Run and Test

### Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:5000
📊 Environment: development
```

**Keep this terminal open** - the backend must be running for the frontend to work.

---

### Step 2: Start the Frontend

Open a **NEW terminal** (keep backend running) and run:

```bash
cd knapsack-front
npm run dev
```

You should see:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### Step 3: Open the Application

Open your browser and go to: **http://localhost:5173**

---

## ✨ What to Test

### 1. Initial Load
- ✅ Application loads with a spinner
- ✅ "Project 1" tab appears
- ✅ No console errors

### 2. Project Name
- ✅ Click on "Untitled Project" in the header
- ✅ Change the name
- ✅ Refresh the page - name should persist

### 3. Tab Operations
- ✅ Create a new tab (+ button)
- ✅ Switch between tabs
- ✅ Rename a tab (right-click → Rename)
- ✅ Duplicate a tab (right-click → Duplicate)
- ✅ Close a tab (X button)
- ✅ All changes persist across page refreshes

### 4. Settings & Data
- ✅ Change module dimensions
- ✅ Add/edit rows in the table
- ✅ Update rail lengths
- ✅ Refresh page - all data should persist

### 5. BOM Generation
- ✅ Click "Create BOM"
- ✅ BOM should generate correctly
- ✅ Data should match what you configured

---

## 🔍 Verify Database Storage

### Check Data in MySQL Workbench

Open MySQL Workbench and run these queries:

```sql
-- View your project
SELECT * FROM projects;

-- View all tabs
SELECT id, project_id, name, module_length, module_width FROM tabs;

-- View rows
SELECT * FROM tab_rows;

-- View BOM master items
SELECT serial_number, sunrack_code, item_description FROM bom_master_items;
```

You should see:
- 1 project record
- Your tabs and their settings
- All rows you've created
- 15 BOM master items

---

## 🐛 Troubleshooting

### Backend Won't Start
**Error**: `P1000: Authentication failed`
**Solution**: Make sure MySQL is running and credentials in `backend/.env` are correct

### Frontend Can't Connect
**Error**: "Network error: Unable to reach the server"
**Solution**:
1. Make sure backend is running on port 5000
2. Check `knapsack-front/.env` has correct API URL:
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

### CORS Errors
**Error**: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solution**: Backend CORS is configured for `http://localhost:5173`. If using different port, update `backend/.env`:
```
CORS_ORIGIN=http://localhost:YOUR_PORT
```

### Database Connection Issues
**Error**: "Can't connect to MySQL server"
**Solution**:
1. Start MySQL service
2. Verify credentials in `backend/.env`
3. Test connection in MySQL Workbench

---

## 📊 API Endpoints Reference

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tabs
- `GET /api/projects/:projectId/tabs` - Get all tabs
- `POST /api/projects/:projectId/tabs` - Create tab
- `GET /api/tabs/:id` - Get single tab
- `PUT /api/tabs/:id` - Update tab
- `DELETE /api/tabs/:id` - Delete tab
- `POST /api/tabs/:id/duplicate` - Duplicate tab

### Rows
- `GET /api/tabs/:tabId/rows` - Get all rows
- `POST /api/tabs/:tabId/rows` - Create row
- `PUT /api/rows/:id` - Update row
- `DELETE /api/rows/:id` - Delete row

### BOM
- `GET /api/bom/master-items` - Get all BOM items
- `GET /api/bom/formulas` - Get all formulas

---

## 🔄 Migrating Existing localStorage Data (Optional)

If you have existing data in localStorage that you want to migrate to the database, you can:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:
```javascript
// Export localStorage data
const data = {
  projectName: localStorage.getItem('projectName'),
  tabs: JSON.parse(localStorage.getItem('knapsack_tabs'))
};
console.log(JSON.stringify(data, null, 2));
```

4. Copy the output and let me know - I can create a migration script to import it into the database.

---

## 📝 File Structure

```
knapsack-tool/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # Route definitions
│   │   ├── middleware/      # Error handling
│   │   ├── prismaClient.js  # Database client
│   │   └── server.js        # Express app
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Database migrations
│   │   └── seed.js          # Seed data script
│   ├── .env                 # Environment variables
│   └── package.json
│
└── knapsack-front/
    ├── src/
    │   ├── services/
    │   │   └── api.js       # API client
    │   ├── lib/
    │   │   ├── tabStorage.js       # Old localStorage version
    │   │   └── tabStorageAPI.js    # New API version
    │   ├── App.jsx          # Main app (API version)
    │   └── App.jsx.backup   # Old localStorage version
    ├── .env                 # Frontend environment variables
    └── package.json
```

---

## ✅ Success Criteria

Your migration is successful if:
- ✅ Backend starts without errors
- ✅ Frontend loads and shows data
- ✅ All tab operations work smoothly
- ✅ Data persists after page refresh
- ✅ Data is stored in MySQL (verified via MySQL Workbench)
- ✅ No localStorage is being used (check DevTools → Application → Local Storage)

---

## 🎉 Next Steps

Now that your data is in a database, you can:

1. **Access from multiple devices** - Data is centralized
2. **Add authentication** - User login system
3. **Share projects** - Collaborate with team members
4. **Export/Import** - Backup and restore functionality
5. **Analytics** - Track usage and optimization trends
6. **API integrations** - Connect with other tools

---

## 🆘 Need Help?

If you encounter any issues:
1. Check both terminal outputs for error messages
2. Check browser console (F12) for frontend errors
3. Verify MySQL is running and accessible
4. Check the API is responding: http://localhost:5000/api/health

---

**Happy Testing! 🚀**
