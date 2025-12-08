# Database Migration Plan
## From localStorage to Database Backend

**Date**: December 8, 2025
**Project**: Knapsack Rail Optimization Tool
**Purpose**: Migrate all localStorage data to database backend + add BOM master data

---

## 1. Current localStorage Inventory

### A. Project Name
- **Key**: `projectName`
- **Data Type**: String
- **Example**: "JET Energy - 5.3MWp"
- **Size**: ~50-100 bytes
- **Used In**: App.jsx, Header.jsx

### B. Tabs Data Structure
- **Key**: `knapsack_tabs`
- **Data Type**: JSON Object
- **Size**: ~10-100 KB (depends on number of tabs and rows)

**Structure**:
```javascript
{
  tabs: [
    {
      id: 1,
      name: "Project 1",
      createdAt: "2025-12-08T12:00:00.000Z",
      settings: {
        moduleLength: 2278,
        moduleWidth: 1134,
        frameThickness: 35,
        midClamp: 20,
        endClampWidth: 40,
        buffer: 15,
        purlinDistance: 1700,
        railsPerSide: 2,
        lengthsInput: "1595, 1798, 2400, 2750, 3200, 3600, 4800",
        enabledLengths: { 1595: true, 1798: true, ... },
        maxPieces: 3,
        maxWastePct: "",
        alphaJoint: 220,
        betaSmall: 60,
        allowUndershootPct: 0,
        gammaShort: 5,
        costPerMm: "0.1",
        costPerJointSet: "50",
        joinerLength: "100",
        priority: "cost",
        userMode: "normal",
        enableSB2: false
      },
      rows: [
        {
          id: 1,
          modules: 3,
          quantity: 10,
          supportBase1: 5,
          supportBase2: 0
        }
      ],
      selectedRowId: 1
    }
  ],
  activeTabId: 1
}
```

### C. Legacy Settings (Being Migrated)
- **Key**: `railOptimizerSettings`
- **Status**: Already being migrated into tab structure, can be cleaned up

---

## 2. New Data Requirements (BOM Master Data)

### A. Sunrack Code Mappings
Mapping between item types/lengths and Sunrack codes.

**Examples**:
- Long Rail 1600mm → `MA-43` or `LR-1600`
- Long Rail 1800mm → `MA-44` or `LR-1800`
- U Cleat → `UC-001`
- End Clamp → `EC-40`
- Mid Clamp → `MC-20`

### B. Profile Images
- **Storage**: File paths or URLs to images
- **Location**: `/assets/bom-profiles/{sunrack_code}.png`
- **Total Images**: ~22 images (estimated from BOM items)

### C. BOM Master Items
Complete catalog of all BOM items with metadata:
- Serial Number
- Sunrack Code
- Item Description
- Material
- Standard Length (if applicable)
- Unit of Measurement
- Profile Image Path
- Category (Rail, Hardware, Support, etc.)

---

## 3. Proposed Database Schema

### Technology Stack Recommendation
- **Database**: PostgreSQL (preferred) or MySQL
- **Backend**: Node.js + Express.js
- **ORM**: Prisma or Sequelize
- **File Storage**: Local file system or S3-compatible storage
- **Authentication**: JWT tokens (future-ready)

---

### 3.1 Projects Table
Stores project-level information.

```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT 'Untitled Project',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER,  -- For future multi-user support
  is_active BOOLEAN DEFAULT true
);
```

---

### 3.2 Tabs Table
Stores individual tabs (buildings) within a project.

```sql
CREATE TABLE tabs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  -- Settings (denormalized for performance)
  module_length DECIMAL(10,2) DEFAULT 2278,
  module_width DECIMAL(10,2) DEFAULT 1134,
  frame_thickness DECIMAL(10,2) DEFAULT 35,
  mid_clamp DECIMAL(10,2) DEFAULT 20,
  end_clamp_width DECIMAL(10,2) DEFAULT 40,
  buffer DECIMAL(10,2) DEFAULT 15,
  purlin_distance DECIMAL(10,2) DEFAULT 1700,
  rails_per_side INTEGER DEFAULT 2,
  lengths_input TEXT,  -- Store as comma-separated string
  enabled_lengths JSONB,  -- Store as JSON object
  max_pieces INTEGER DEFAULT 3,
  max_waste_pct VARCHAR(50),
  alpha_joint DECIMAL(10,2) DEFAULT 220,
  beta_small DECIMAL(10,2) DEFAULT 60,
  allow_undershoot_pct DECIMAL(10,2) DEFAULT 0,
  gamma_short DECIMAL(10,2) DEFAULT 5,
  cost_per_mm VARCHAR(50) DEFAULT '0.1',
  cost_per_joint_set VARCHAR(50) DEFAULT '50',
  joiner_length VARCHAR(50) DEFAULT '100',
  priority VARCHAR(20) DEFAULT 'cost',
  user_mode VARCHAR(20) DEFAULT 'normal',
  enable_sb2 BOOLEAN DEFAULT false,

  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_tabs_project_id ON tabs(project_id);
```

---

### 3.3 Tab Rows Table
Stores individual rows (rail configurations) within a tab.

```sql
CREATE TABLE tab_rows (
  id SERIAL PRIMARY KEY,
  tab_id INTEGER NOT NULL REFERENCES tabs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,  -- Order within tab
  modules INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  support_base_1 DECIMAL(10,2),
  support_base_2 DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_tab FOREIGN KEY (tab_id) REFERENCES tabs(id)
);

CREATE INDEX idx_tab_rows_tab_id ON tab_rows(tab_id);
```

---

### 3.4 BOM Master Items Table
Master catalog of all BOM items.

```sql
CREATE TABLE bom_master_items (
  id SERIAL PRIMARY KEY,
  serial_number VARCHAR(20) UNIQUE NOT NULL,  -- e.g., "1", "2", "3"
  sunrack_code VARCHAR(50) UNIQUE,  -- e.g., "MA-43", "UC-001"
  item_description VARCHAR(255) NOT NULL,
  material VARCHAR(100),
  standard_length INTEGER,  -- For rails, NULL for hardware
  uom VARCHAR(20) NOT NULL,  -- Nos, Set, etc.
  category VARCHAR(50),  -- RAIL, HARDWARE, SUPPORT, JOINT
  profile_image_path VARCHAR(255),  -- Path to image file
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bom_master_sunrack_code ON bom_master_items(sunrack_code);
CREATE INDEX idx_bom_master_category ON bom_master_items(category);
```

**Sample Data**:
```sql
INSERT INTO bom_master_items (serial_number, sunrack_code, item_description, material, standard_length, uom, category, profile_image_path) VALUES
('1', 'MA-43', 'Long Rail-1600mm', 'AA6000 T5/T6', 1600, 'Nos', 'RAIL', '/assets/bom-profiles/MA-43.png'),
('2', NULL, 'Long Rail-1800mm', 'AA6000 T5/T6', 1800, 'Nos', 'RAIL', '/assets/bom-profiles/LR-1800.png'),
('3', 'UC-001', 'U Cleat', 'AA6000 T5/T6', NULL, 'Nos', 'SUPPORT', '/assets/bom-profiles/UC-001.png'),
('4', 'EC-40', 'End Clamp', 'AA6005 T5', NULL, 'Nos', 'HARDWARE', '/assets/bom-profiles/EC-40.png'),
('5', 'MC-20', 'Mid Clamp', 'AA6005 T5', NULL, 'Nos', 'HARDWARE', '/assets/bom-profiles/MC-20.png');
```

---

### 3.5 BOM Formulas Table
Stores formula definitions for calculating BOM quantities.

```sql
CREATE TABLE bom_formulas (
  id SERIAL PRIMARY KEY,
  item_serial_number VARCHAR(20) NOT NULL REFERENCES bom_master_items(serial_number),
  formula_key VARCHAR(50) NOT NULL,  -- LONG_RAIL, U_CLEAT, RAIL_NUTS, etc.
  formula_description TEXT,
  calculation_level INTEGER NOT NULL,  -- 1-5 (dependency level)
  is_active BOOLEAN DEFAULT true
);
```

---

### 3.6 Generated BOM Table (Optional - for history)
Stores generated BOM snapshots for historical reference.

```sql
CREATE TABLE generated_boms (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  bom_data JSONB NOT NULL,  -- Complete BOM JSON structure
  generated_by INTEGER  -- User ID for future
);
```

---

## 4. API Endpoints Specification

### 4.1 Project Endpoints

```
POST   /api/projects                    - Create new project
GET    /api/projects                    - Get all projects
GET    /api/projects/:id                - Get project by ID
PUT    /api/projects/:id                - Update project name
DELETE /api/projects/:id                - Delete project
GET    /api/projects/:id/full           - Get project with all tabs and rows
```

### 4.2 Tab Endpoints

```
POST   /api/projects/:projectId/tabs    - Create new tab
GET    /api/projects/:projectId/tabs    - Get all tabs for project
GET    /api/tabs/:id                    - Get single tab with settings
PUT    /api/tabs/:id                    - Update tab (name, settings)
DELETE /api/tabs/:id                    - Delete tab
POST   /api/tabs/:id/duplicate          - Duplicate tab
```

### 4.3 Tab Row Endpoints

```
POST   /api/tabs/:tabId/rows            - Create new row
GET    /api/tabs/:tabId/rows            - Get all rows for tab
PUT    /api/rows/:id                    - Update row
DELETE /api/rows/:id                    - Delete row
PUT    /api/tabs/:tabId/rows/reorder    - Reorder rows
```

### 4.4 BOM Master Data Endpoints

```
GET    /api/bom/master-items            - Get all master items
GET    /api/bom/master-items/:id        - Get single master item
POST   /api/bom/master-items            - Create master item (admin)
PUT    /api/bom/master-items/:id        - Update master item (admin)
DELETE /api/bom/master-items/:id        - Delete master item (admin)
GET    /api/bom/formulas                - Get all formulas
```

### 4.5 BOM Generation Endpoint

```
POST   /api/projects/:projectId/generate-bom  - Generate BOM from project data
GET    /api/boms/:id                          - Get previously generated BOM
```

### 4.6 File Upload Endpoint

```
POST   /api/uploads/profile-image       - Upload profile image for Sunrack code
```

---

## 5. Migration Strategy

### Phase 1: Backend Setup (Week 1)
**Time**: 3-4 days

1. **Day 1**: Database setup
   - Install PostgreSQL
   - Create database and user
   - Set up Prisma ORM
   - Define schema models

2. **Day 2**: Core API development
   - Set up Express.js server
   - Implement CORS, body-parser
   - Create project CRUD endpoints
   - Create tab CRUD endpoints

3. **Day 3**: Complete API
   - Implement row endpoints
   - Implement BOM master data endpoints
   - Add file upload endpoint
   - Set up error handling

4. **Day 4**: BOM Master Data
   - Seed bom_master_items table
   - Seed bom_formulas table
   - Upload profile images
   - Test all endpoints

### Phase 2: Frontend Integration (Week 1-2)
**Time**: 3-4 days

1. **Day 5**: API client setup
   - Create axios instance
   - Create API service layer
   - Add environment variables for API URL
   - Implement error handling

2. **Day 6**: Replace localStorage - Projects & Tabs
   - Update App.jsx to fetch from API
   - Update tabStorage.js functions
   - Implement create/update/delete operations
   - Add loading states

3. **Day 7**: Replace localStorage - Rows & Settings
   - Update row operations
   - Update settings save/load
   - Implement optimistic updates
   - Add sync indicators

4. **Day 8**: BOM Integration
   - Fetch Sunrack codes from API
   - Update profile image paths
   - Update BOM generation to use API
   - Test complete flow

### Phase 3: Data Migration Tool (Week 2)
**Time**: 1-2 days

1. **Day 9**: Migration script
   - Create migration script
   - Read localStorage data
   - Transform to API format
   - POST to backend API
   - Verify migration success

2. **Day 10**: Testing & Polish
   - Test all CRUD operations
   - Test BOM generation
   - Add loading spinners
   - Handle offline scenarios
   - Deploy backend

---

## 6. Detailed Time Estimate

| Task | Time Estimate | Complexity |
|------|---------------|------------|
| Database schema design | 2 hours | Medium |
| Database setup & migration scripts | 3 hours | Low |
| Backend API development (Node + Express) | 12-16 hours | Medium |
| BOM master data seeding | 3 hours | Low |
| Profile image management | 2 hours | Low |
| Frontend API client layer | 4 hours | Low |
| Replace localStorage with API calls | 8-10 hours | Medium |
| Data migration script | 3 hours | Medium |
| Testing & bug fixes | 6-8 hours | Medium |
| Deployment setup | 3-4 hours | Medium |
| **TOTAL** | **46-55 hours** | **~6-7 working days** |

**Assuming 8-hour work days**: **1-1.5 weeks of full-time work**

---

## 7. Technology Stack Details

### Backend
```json
{
  "framework": "Express.js",
  "database": "PostgreSQL 15+",
  "orm": "Prisma",
  "validation": "Joi or Zod",
  "fileUpload": "Multer",
  "cors": "cors package",
  "environment": "dotenv"
}
```

### Frontend Changes
```json
{
  "httpClient": "axios",
  "stateManagement": "React Context (existing) + SWR for data fetching",
  "errorHandling": "React Error Boundaries",
  "loading": "Loading states + Suspense"
}
```

---

## 8. File Structure (Backend)

```
knapsack-backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Auto-generated migrations
│   └── seed.js               # Seed BOM master data
├── src/
│   ├── config/
│   │   └── database.js       # DB connection config
│   ├── controllers/
│   │   ├── projectController.js
│   │   ├── tabController.js
│   │   ├── rowController.js
│   │   └── bomController.js
│   ├── routes/
│   │   ├── projectRoutes.js
│   │   ├── tabRoutes.js
│   │   ├── rowRoutes.js
│   │   └── bomRoutes.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── uploadMiddleware.js
│   ├── services/
│   │   ├── projectService.js
│   │   ├── tabService.js
│   │   └── bomService.js
│   └── server.js             # Express app entry
├── uploads/                   # Uploaded profile images
├── .env                       # Environment variables
├── package.json
└── README.md
```

---

## 9. Environment Variables

### Backend (.env)
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/knapsack_db"
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads/profile-images
MAX_FILE_SIZE=5242880  # 5MB
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 10. Data Migration Script Example

```javascript
// migrate-to-db.js
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function migrateLocalStorageToDatabase() {
  // 1. Get project name
  const projectName = localStorage.getItem('projectName') || 'Untitled Project';

  // 2. Create project
  const projectRes = await axios.post(`${API_BASE}/projects`, {
    name: projectName
  });
  const projectId = projectRes.data.id;

  // 3. Get tabs data
  const tabsData = JSON.parse(localStorage.getItem('knapsack_tabs'));

  // 4. Migrate each tab
  for (const tab of tabsData.tabs) {
    const tabRes = await axios.post(`${API_BASE}/projects/${projectId}/tabs`, {
      name: tab.name,
      createdAt: tab.createdAt,
      settings: tab.settings
    });
    const tabId = tabRes.data.id;

    // 5. Migrate rows for this tab
    for (let i = 0; i < tab.rows.length; i++) {
      const row = tab.rows[i];
      await axios.post(`${API_BASE}/tabs/${tabId}/rows`, {
        rowNumber: i + 1,
        modules: row.modules,
        quantity: row.quantity,
        supportBase1: row.supportBase1,
        supportBase2: row.supportBase2
      });
    }
  }

  console.log('✅ Migration complete!');
  console.log('You can now clear localStorage');
}

// Run migration
migrateLocalStorageToDatabase();
```

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Backup localStorage before migration, keep backup for 30 days |
| API downtime | High | Implement offline-first approach with service workers |
| Performance degradation | Medium | Add caching layer (Redis), optimize queries |
| Image upload failures | Low | Implement retry logic, allow manual re-upload |
| Breaking changes | Medium | Version API endpoints (/api/v1/), maintain backward compatibility |

---

## 12. Post-Migration Cleanup

1. **localStorage Cleanup Script**:
```javascript
function cleanupLocalStorage() {
  const keysToRemove = [
    'knapsack_tabs',
    'projectName',
    'railOptimizerSettings',
    'railOptimizer_rows',
    'railOptimizer_selectedRowId'
  ];

  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`Removing ${key}...`);
      localStorage.removeItem(key);
    }
  });

  console.log('✅ localStorage cleanup complete');
}
```

2. **Migration Flag**: Add `migrated_to_db` flag in localStorage to prevent duplicate migrations

---

## 13. Future Enhancements (Post-Migration)

1. **User Authentication**:
   - Multi-user support
   - JWT-based authentication
   - Role-based access control

2. **Real-time Collaboration**:
   - WebSocket integration
   - Multiple users editing same project
   - Conflict resolution

3. **Cloud Storage**:
   - S3/CloudFront for profile images
   - CDN for faster image loading

4. **Advanced BOM Features**:
   - BOM comparison (version control)
   - Export to Excel/PDF
   - Email BOM reports

5. **Analytics**:
   - Track most used configurations
   - Optimization statistics
   - Cost trends over time

---

## 14. Implementation Checklist

### Backend Setup
- [ ] Install PostgreSQL
- [ ] Create database and user
- [ ] Initialize Node.js project
- [ ] Install dependencies (express, prisma, cors, multer, etc.)
- [ ] Create Prisma schema
- [ ] Run migrations
- [ ] Seed BOM master data
- [ ] Implement all API endpoints
- [ ] Add error handling middleware
- [ ] Test all endpoints with Postman/Insomnia
- [ ] Set up file upload for profile images
- [ ] Deploy backend (Railway/Render/DigitalOcean)

### Frontend Integration
- [ ] Install axios
- [ ] Create API service layer (services/api.js)
- [ ] Add environment variables
- [ ] Update App.jsx to use API
- [ ] Update tabStorage.js functions
- [ ] Add loading states throughout app
- [ ] Update BOM generation to use API
- [ ] Test all CRUD operations
- [ ] Implement error handling UI
- [ ] Add sync status indicators

### Data Migration
- [ ] Create migration script
- [ ] Test migration on sample data
- [ ] Backup existing localStorage
- [ ] Run migration for all users
- [ ] Verify data integrity
- [ ] Clear localStorage after verification
- [ ] Monitor for migration issues

### Testing
- [ ] Test project CRUD
- [ ] Test tab CRUD
- [ ] Test row CRUD
- [ ] Test BOM generation with database
- [ ] Test profile image display
- [ ] Test offline behavior
- [ ] Test error scenarios
- [ ] Performance testing with large datasets
- [ ] Cross-browser testing

### Deployment
- [ ] Deploy backend to production
- [ ] Configure production database
- [ ] Set up environment variables
- [ ] Deploy frontend with new API URL
- [ ] Monitor API logs
- [ ] Set up error tracking (Sentry)
- [ ] Create backup strategy

---

## 15. Cost Estimates (If Using Cloud Services)

| Service | Provider | Monthly Cost (Estimated) |
|---------|----------|-------------------------|
| Database | Railway/Supabase | $5-10 |
| Backend Hosting | Railway/Render | $7-10 |
| File Storage | AWS S3 | $1-3 |
| Total | - | **$13-23/month** |

**Self-hosted alternative**: $5-10/month with VPS (DigitalOcean/Linode)

---

## 16. Support & Maintenance

**Ongoing maintenance tasks**:
- Regular database backups (daily)
- Monitor API performance
- Update BOM master data as needed
- Security patches for dependencies
- Scale database as data grows

**Estimated monthly maintenance**: 2-4 hours

---

## Summary

**Total Implementation Time**: **46-55 hours (1-1.5 weeks full-time)**

**Complexity**: Medium

**Benefits**:
- ✅ Centralized data management
- ✅ No localStorage size limitations
- ✅ Multi-device sync capability
- ✅ Structured Sunrack code management
- ✅ Scalable architecture
- ✅ Historical BOM tracking
- ✅ Better data integrity
- ✅ Future-ready for multi-user features

**Recommended Approach**: Incremental migration
1. Set up backend first
2. Test thoroughly with sample data
3. Migrate existing data
4. Monitor for issues
5. Clean up localStorage after successful migration

---

**Document Version**: 1.0
**Last Updated**: December 8, 2025
