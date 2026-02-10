# BOM Sharing Feature - Implementation Plan

## 📋 Table of Contents
1. [Feature Overview](#feature-overview)
2. [Business Requirements](#business-requirements)
3. [User Flow](#user-flow)
4. [Database Schema](#database-schema)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Security & Permissions](#security--permissions)
8. [UI/UX Design](#uiux-design)
9. [Implementation Phases](#implementation-phases)
10. [Testing Plan](#testing-plan)

---

## Feature Overview

### Problem Statement
- Currently, BOM sharing is only available to Managers
- Sales team cannot receive editable BOMs to tweak during client negotiations
- This is a **major bottleneck** preventing efficient workflow

### Solution
Implement a **BOM Sharing System** where:
- ✅ Any user can share a BOM
- ✅ User selects recipients from a list
- ✅ System generates a unique shareable link
- ✅ Recipient gets an **editable copy** of the BOM
- ✅ Each shared BOM is independent (changes don't affect original)
- ✅ Recipients can re-share their copies with others

---

## Business Requirements

### Must Have (MVP)
1. Share button in BOM page
2. User selection modal (list all users)
3. Generate unique shareable link
4. Create independent copy of BOM for recipient
5. Authentication check when accessing shared link
6. Recipient can edit their copy freely
7. Recipients can re-share their version

### Nice to Have (Future)
- Email notifications when BOM is shared
- Role-based filtering in user selection
- Share management UI (view who you shared with)
- Revoke access capability
- Link expiry dates
- Share history/lineage view

---

## User Flow

### Main Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   USER A (DESIGNER)                         │
│  1. Creates/Opens BOM                                       │
│  2. Clicks "Share" button                                   │
│  3. Selects User B (Sales) from list                        │
│  4. System generates link: /bom/shared/abc123xyz            │
│  5. Copies link and shares (WhatsApp/Email)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   USER B (SALES)                            │
│  6. Opens link: /bom/shared/abc123xyz                       │
│  7. If not logged in → Redirected to login page             │
│  8. After login → System checks permissions                 │
│  9. System creates a COPY of BOM for User B                 │
│ 10. BOM opens in edit mode (User B's copy)                  │
│ 11. User B can edit freely                                  │
│ 12. User B can also share their version with others         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   USER C (MANAGER)                          │
│ 13. User B shares their version with User C                 │
│ 14. User C gets their own copy (from User B's version)      │
│ 15. User C can edit independently                           │
└─────────────────────────────────────────────────────────────┘
```

### Copy Independence

```
Original BOM (User A)      Shared BOM (User B)      Shared BOM (User C)
     ↓                          ↓                         ↓
100 modules                 95 modules                90 modules
₹50,000                     ₹47,500                   ₹45,000
     ↓                          ↓                         ↓
  Editable                   Editable                  Editable
  Can share                  Can share                 Can share
     ↓                          ↓                         ↓
Each version is INDEPENDENT - changes don't affect others
```

---

## Database Schema

### 1. Update `saved_boms` Table

Add new columns to track sharing:

```sql
ALTER TABLE saved_boms ADD COLUMN parent_bom_id INT NULL;
ALTER TABLE saved_boms ADD COLUMN shared_by_user_id INT NULL;
ALTER TABLE saved_boms ADD COLUMN is_shared_copy BOOLEAN DEFAULT FALSE;
ALTER TABLE saved_boms ADD COLUMN created_from_share_token VARCHAR(255) NULL;

-- Foreign keys
ALTER TABLE saved_boms
  ADD CONSTRAINT fk_parent_bom
  FOREIGN KEY (parent_bom_id) REFERENCES saved_boms(id) ON DELETE SET NULL;

ALTER TABLE saved_boms
  ADD CONSTRAINT fk_shared_by
  FOREIGN KEY (shared_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
```

**Columns Explanation:**
- `parent_bom_id`: References the BOM this was copied from (lineage tracking)
- `shared_by_user_id`: User who shared this BOM
- `is_shared_copy`: Flag to identify if this is a shared copy
- `created_from_share_token`: The token used to create this copy

### 2. Create `bom_shares` Table

Track all sharing activities:

```sql
CREATE TABLE bom_shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  parent_bom_id INT NOT NULL,
  shared_by_user_id INT NOT NULL,
  shared_with_user_id INT NOT NULL,
  created_bom_id INT NULL,
  message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accessed_at TIMESTAMP NULL,
  is_accessed BOOLEAN DEFAULT FALSE,

  FOREIGN KEY (parent_bom_id) REFERENCES saved_boms(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_bom_id) REFERENCES saved_boms(id) ON DELETE SET NULL,

  INDEX idx_share_token (share_token),
  INDEX idx_shared_by (shared_by_user_id),
  INDEX idx_shared_with (shared_with_user_id)
);
```

**Columns Explanation:**
- `share_token`: Unique token for the shareable link (UUID)
- `parent_bom_id`: The original BOM being shared
- `shared_by_user_id`: User who initiated the share
- `shared_with_user_id`: Recipient user
- `created_bom_id`: The new BOM copy created for recipient (NULL until accessed)
- `message`: Optional message from sharer
- `accessed_at`: When recipient first opened the link
- `is_accessed`: Flag to track if link has been used

### 3. Prisma Schema Update

```prisma
model SavedBom {
  id                    Int       @id @default(autoincrement())
  projectId             Int       @map("project_id")
  bomData               Json      @map("bom_data")
  userNotes             Json?     @map("user_notes")
  changeLog             Json?     @map("change_log")
  customDefaultNotes    Json?     @map("custom_default_notes")
  createdBy             Int       @map("created_by")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  // Sharing fields
  parentBomId           Int?      @map("parent_bom_id")
  sharedByUserId        Int?      @map("shared_by_user_id")
  isSharedCopy          Boolean   @default(false) @map("is_shared_copy")
  createdFromShareToken String?   @map("created_from_share_token") @db.VarChar(255)

  project               Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user                  User      @relation("CreatedBoms", fields: [createdBy], references: [id])
  parentBom             SavedBom? @relation("BomCopies", fields: [parentBomId], references: [id], onDelete: SetNull)
  copiedBoms            SavedBom[] @relation("BomCopies")
  sharedBy              User?     @relation("SharedBoms", fields: [sharedByUserId], references: [id], onDelete: SetNull)

  sharesAsParent        BomShare[] @relation("ParentBomShares")
  sharesAsCreated       BomShare[] @relation("CreatedBomShares")

  @@index([projectId])
  @@map("saved_boms")
}

model BomShare {
  id                Int       @id @default(autoincrement())
  shareToken        String    @unique @map("share_token") @db.VarChar(255)
  parentBomId       Int       @map("parent_bom_id")
  sharedByUserId    Int       @map("shared_by_user_id")
  sharedWithUserId  Int       @map("shared_with_user_id")
  createdBomId      Int?      @map("created_bom_id")
  message           String?   @db.Text
  createdAt         DateTime  @default(now()) @map("created_at")
  accessedAt        DateTime? @map("accessed_at")
  isAccessed        Boolean   @default(false) @map("is_accessed")

  parentBom         SavedBom  @relation("ParentBomShares", fields: [parentBomId], references: [id], onDelete: Cascade)
  sharedBy          User      @relation("SharesCreated", fields: [sharedByUserId], references: [id], onDelete: Cascade)
  sharedWith        User      @relation("SharesReceived", fields: [sharedWithUserId], references: [id], onDelete: Cascade)
  createdBom        SavedBom? @relation("CreatedBomShares", fields: [createdBomId], references: [id], onDelete: SetNull)

  @@index([shareToken])
  @@index([sharedByUserId])
  @@index([sharedWithUserId])
  @@map("bom_shares")
}

// Update User model to include relations
model User {
  // ... existing fields ...

  createdBoms       SavedBom[] @relation("CreatedBoms")
  sharedBoms        SavedBom[] @relation("SharedBoms")
  sharesCreated     BomShare[] @relation("SharesCreated")
  sharesReceived    BomShare[] @relation("SharesReceived")
}
```

---

## Backend Implementation

### 1. API Endpoints

#### **POST /api/bom/share**
Create a share link for a BOM

**Request Body:**
```json
{
  "bomId": 123,
  "sharedWithUserIds": [45, 67, 89],
  "message": "Please review this BOM for client negotiation"
}
```

**Response:**
```json
{
  "success": true,
  "shares": [
    {
      "shareId": 1,
      "shareToken": "abc123xyz456",
      "sharedWithUser": {
        "id": 45,
        "username": "john_sales",
        "role": "SALES"
      },
      "shareLink": "https://app.com/bom/shared/abc123xyz456"
    },
    // ... more shares
  ]
}
```

#### **GET /api/bom/shared/:token**
Access a shared BOM via token

**URL:** `/api/bom/shared/abc123xyz456`

**Response:**
```json
{
  "success": true,
  "shareInfo": {
    "parentBomId": 123,
    "sharedBy": {
      "id": 1,
      "username": "sarah_designer"
    },
    "message": "Please review this BOM",
    "createdAt": "2026-01-10T10:00:00Z"
  },
  "bomId": 456,  // The new copy created for recipient (or existing if already accessed)
  "isFirstAccess": true  // true if this is first time accessing
}
```

#### **GET /api/bom/share-history/:bomId**
Get share history for a BOM

**Response:**
```json
{
  "success": true,
  "shares": [
    {
      "id": 1,
      "sharedWith": {
        "id": 45,
        "username": "john_sales"
      },
      "shareToken": "abc123xyz456",
      "isAccessed": true,
      "accessedAt": "2026-01-10T11:30:00Z",
      "createdBomId": 456
    }
  ],
  "sharedBy": {
    "id": 1,
    "username": "sarah_designer"
  }
}
```

#### **GET /api/users/list**
Get list of all users (for share modal)

**Query Params:** `?role=SALES` (optional filter)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 45,
      "username": "john_sales",
      "role": "SALES",
      "status": "ACTIVE"
    },
    // ... more users
  ]
}
```

### 2. Backend Services

#### **bomShareService.js**

```javascript
const crypto = require('crypto');
const prisma = require('../prismaClient');

class BomShareService {
  /**
   * Generate unique share token
   */
  generateShareToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create share links for multiple users
   */
  async createShares(parentBomId, sharedByUserId, sharedWithUserIds, message = null) {
    const shares = [];

    for (const sharedWithUserId of sharedWithUserIds) {
      const shareToken = this.generateShareToken();

      const share = await prisma.bomShare.create({
        data: {
          shareToken,
          parentBomId: parseInt(parentBomId),
          sharedByUserId: parseInt(sharedByUserId),
          sharedWithUserId: parseInt(sharedWithUserId),
          message
        },
        include: {
          sharedWith: {
            select: {
              id: true,
              username: true,
              role: true
            }
          }
        }
      });

      shares.push({
        ...share,
        shareLink: `${process.env.FRONTEND_URL}/bom/shared/${shareToken}`
      });
    }

    return shares;
  }

  /**
   * Access shared BOM via token
   * - Check if user has permission
   * - Create copy if first access
   * - Return BOM info
   */
  async accessSharedBom(shareToken, currentUserId) {
    // Find share record
    const share = await prisma.bomShare.findUnique({
      where: { shareToken },
      include: {
        parentBom: true,
        sharedBy: {
          select: { id: true, username: true }
        },
        sharedWith: {
          select: { id: true, username: true }
        },
        createdBom: true
      }
    });

    if (!share) {
      throw new Error('Share link not found or expired');
    }

    // Check if current user is the intended recipient
    if (share.sharedWithUserId !== parseInt(currentUserId)) {
      throw new Error('Access denied: This BOM was not shared with you');
    }

    // If already accessed, return existing copy
    if (share.isAccessed && share.createdBomId) {
      return {
        shareInfo: {
          parentBomId: share.parentBomId,
          sharedBy: share.sharedBy,
          message: share.message,
          createdAt: share.createdAt
        },
        bomId: share.createdBomId,
        isFirstAccess: false
      };
    }

    // First access - create a copy of the BOM
    const copiedBom = await this.copyBomForUser(
      share.parentBomId,
      currentUserId,
      share.sharedByUserId,
      shareToken
    );

    // Update share record
    await prisma.bomShare.update({
      where: { id: share.id },
      data: {
        isAccessed: true,
        accessedAt: new Date(),
        createdBomId: copiedBom.id
      }
    });

    return {
      shareInfo: {
        parentBomId: share.parentBomId,
        sharedBy: share.sharedBy,
        message: share.message,
        createdAt: share.createdAt
      },
      bomId: copiedBom.id,
      isFirstAccess: true
    };
  }

  /**
   * Create a copy of BOM for the recipient
   */
  async copyBomForUser(parentBomId, recipientUserId, sharedByUserId, shareToken) {
    const parentBom = await prisma.savedBom.findUnique({
      where: { id: parseInt(parentBomId) }
    });

    if (!parentBom) {
      throw new Error('Parent BOM not found');
    }

    // Create a copy
    const copiedBom = await prisma.savedBom.create({
      data: {
        projectId: parentBom.projectId,
        bomData: parentBom.bomData,
        userNotes: parentBom.userNotes,
        changeLog: parentBom.changeLog || [],
        customDefaultNotes: parentBom.customDefaultNotes,
        createdBy: parseInt(recipientUserId),
        parentBomId: parseInt(parentBomId),
        sharedByUserId: parseInt(sharedByUserId),
        isSharedCopy: true,
        createdFromShareToken: shareToken
      }
    });

    return copiedBom;
  }

  /**
   * Get share history for a BOM
   */
  async getShareHistory(bomId) {
    const shares = await prisma.bomShare.findMany({
      where: { parentBomId: parseInt(bomId) },
      include: {
        sharedWith: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        sharedBy: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return shares;
  }

  /**
   * Get BOMs shared with a user
   */
  async getSharedWithUser(userId) {
    const shares = await prisma.bomShare.findMany({
      where: {
        sharedWithUserId: parseInt(userId),
        isAccessed: true
      },
      include: {
        parentBom: true,
        createdBom: true,
        sharedBy: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return shares;
  }
}

module.exports = new BomShareService();
```

#### **bomShareController.js**

```javascript
const bomShareService = require('../services/bomShareService');

class BomShareController {
  /**
   * POST /api/bom/share
   * Create share links
   */
  async createShares(req, res) {
    try {
      const { bomId, sharedWithUserIds, message } = req.body;
      const sharedByUserId = req.user.id; // From auth middleware

      if (!bomId || !sharedWithUserIds || !Array.isArray(sharedWithUserIds)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request: bomId and sharedWithUserIds array required'
        });
      }

      const shares = await bomShareService.createShares(
        bomId,
        sharedByUserId,
        sharedWithUserIds,
        message
      );

      res.json({
        success: true,
        shares
      });
    } catch (error) {
      console.error('Error creating shares:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/bom/shared/:token
   * Access shared BOM
   */
  async accessSharedBom(req, res) {
    try {
      const { token } = req.params;
      const currentUserId = req.user.id;

      const result = await bomShareService.accessSharedBom(token, currentUserId);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error accessing shared BOM:', error);
      res.status(403).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/bom/share-history/:bomId
   * Get share history
   */
  async getShareHistory(req, res) {
    try {
      const { bomId } = req.params;
      const shares = await bomShareService.getShareHistory(bomId);

      res.json({
        success: true,
        shares
      });
    } catch (error) {
      console.error('Error fetching share history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new BomShareController();
```

#### **Routes: bomShareRoutes.js**

```javascript
const express = require('express');
const router = express.Router();
const bomShareController = require('../controllers/bomShareController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Create share links
router.post('/share', bomShareController.createShares);

// Access shared BOM via token
router.get('/shared/:token', bomShareController.accessSharedBom);

// Get share history for a BOM
router.get('/share-history/:bomId', bomShareController.getShareHistory);

module.exports = router;
```

---

## Frontend Implementation

### 1. API Service

#### **bomShareAPI.js**

```javascript
// src/services/bomShareAPI.js
import axios from 'axios';
import { API_URL } from './config';

const bomShareAPI = {
  /**
   * Create share links for a BOM
   */
  async createShares(bomId, sharedWithUserIds, message = null) {
    const response = await axios.post(
      `${API_URL}/api/bom/share`,
      {
        bomId,
        sharedWithUserIds,
        message
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  },

  /**
   * Access shared BOM via token
   */
  async accessSharedBom(token) {
    const response = await axios.get(
      `${API_URL}/api/bom/shared/${token}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  },

  /**
   * Get share history for a BOM
   */
  async getShareHistory(bomId) {
    const response = await axios.get(
      `${API_URL}/api/bom/share-history/${bomId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  },

  /**
   * Get list of users
   */
  async getUserList(role = null) {
    const url = role
      ? `${API_URL}/api/users/list?role=${role}`
      : `${API_URL}/api/users/list`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  }
};

export default bomShareAPI;
```

### 2. Components

#### **ShareBOMModal.jsx**

```jsx
// src/components/BOM/ShareBOMModal.jsx
import { useState, useEffect } from 'react';
import bomShareAPI from '../../services/bomShareAPI';

export default function ShareBOMModal({ isOpen, onClose, bomId }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareLinks, setShareLinks] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, roleFilter]);

  const loadUsers = async () => {
    try {
      const response = await bomShareAPI.getUserList(
        roleFilter === 'ALL' ? null : roleFilter
      );
      setUsers(response.users);
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('Failed to load users');
    }
  };

  const toggleUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    try {
      setLoading(true);
      const response = await bomShareAPI.createShares(
        bomId,
        selectedUsers,
        message || null
      );
      setShareLinks(response.shares);
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to share BOM:', error);
      alert('Failed to share BOM');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setMessage('');
    setShareLinks([]);
    setShowSuccess(false);
    setRoleFilter('ALL');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share BOM
          </h2>
          <button onClick={handleClose} className="text-white hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {!showSuccess ? (
            <>
              {/* Role Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Role:
                </label>
                <div className="flex gap-2">
                  {['ALL', 'BASIC', 'DESIGN', 'MANAGER'].map(role => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        roleFilter === role
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Users ({selectedUsers.length} selected):
                </label>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {users.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No users found
                    </div>
                  ) : (
                    users.map(user => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUser(user.id)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.role}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Optional Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional):
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a note for the recipients..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={loading || selectedUsers.length === 0}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sharing...' : 'Generate Share Links'}
                </button>
              </div>
            </>
          ) : (
            /* Success View - Show Share Links */
            <div>
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">
                    Successfully shared with {shareLinks.length} user(s)
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {shareLinks.map((share, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900">
                          {share.sharedWithUser.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {share.sharedWithUser.role}
                        </div>
                      </div>
                      <button
                        onClick={() => copyLink(share.shareLink)}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                      >
                        Copy Link
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 font-mono bg-white p-2 rounded border break-all">
                      {share.shareLink}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### **Update BOMPage.jsx**

Add Share button and integrate ShareBOMModal:

```jsx
// Add to imports
import ShareBOMModal from './ShareBOMModal';
import { useState } from 'react';

// Inside BOMPage component, add state
const [showShareModal, setShowShareModal] = useState(false);
const [currentBomId, setCurrentBomId] = useState(null);

// Add Share button in header (near Print/Export buttons)
<button
  onClick={() => {
    setCurrentBomId(savedBomId); // or however you track BOM ID
    setShowShareModal(true);
  }}
  className="px-4 py-2 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
  Share BOM
</button>

// Add modal at the end of component
<ShareBOMModal
  isOpen={showShareModal}
  onClose={() => setShowShareModal(false)}
  bomId={currentBomId}
/>
```

### 3. Shared BOM Access Page

#### **SharedBOMPage.jsx**

```jsx
// src/pages/SharedBOMPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import bomShareAPI from '../services/bomShareAPI';

export default function SharedBOMPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    accessSharedBom();
  }, [token]);

  const accessSharedBom = async () => {
    try {
      setLoading(true);
      const response = await bomShareAPI.accessSharedBom(token);

      // Redirect to BOM page with the created/existing BOM ID
      navigate('/bom', {
        state: {
          bomId: response.bomId,
          isSharedCopy: true,
          shareInfo: response.shareInfo,
          isFirstAccess: response.isFirstAccess
        }
      });
    } catch (error) {
      console.error('Failed to access shared BOM:', error);
      setError(error.response?.data?.error || 'Failed to access shared BOM');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared BOM...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
```

### 4. Router Update

```jsx
// In App.jsx or routes configuration
import SharedBOMPage from './pages/SharedBOMPage';

// Add route
<Route path="/bom/shared/:token" element={<SharedBOMPage />} />
```

### 5. BOM Page Enhancements

Show share info banner when viewing a shared BOM:

```jsx
// In BOMPage.jsx, add near top
{location.state?.isSharedCopy && (
  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex items-start gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex-1">
        <h3 className="font-semibold text-blue-900 mb-1">
          📤 Shared BOM
          {location.state?.isFirstAccess && (
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">New</span>
          )}
        </h3>
        <p className="text-sm text-blue-800">
          Shared by: <strong>{location.state?.shareInfo?.sharedBy?.username}</strong>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          This is your copy - edit freely. Changes won't affect the original BOM.
        </p>
      </div>
    </div>
  </div>
)}
```

---

## Security & Permissions

### 1. Authentication Requirements
- ✅ All API endpoints require valid JWT token
- ✅ Share link requires login before access
- ✅ Token validation on every request

### 2. Authorization Checks
```javascript
// In bomShareService.accessSharedBom()
if (share.sharedWithUserId !== parseInt(currentUserId)) {
  throw new Error('Access denied: This BOM was not shared with you');
}
```

### 3. Token Security
- Use cryptographically secure random tokens (32 bytes)
- Tokens are unique and indexed in database
- Tokens cannot be guessed or enumerated

### 4. Data Isolation
- Each user gets their own copy of BOM
- Changes are isolated (no cross-contamination)
- Original BOM remains unchanged

### 5. Audit Trail
- Track who shared what with whom
- Track when shared BOMs were accessed
- Parent-child relationships preserved

---

## UI/UX Design

### Share Button Location
```
┌────────────────────────────────────────┐
│ BOM Page Header                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │ Print    │ │ Export   │ │ Share    ││
│ └──────────┘ └──────────┘ └──────────┘│
└────────────────────────────────────────┘
```

### Share Modal Design
- Clean, modern modal with purple gradient header
- Multi-select user list with checkboxes
- Role-based filtering (All, Basic, Design, Manager, Sales)
- Optional message field
- Success view with copy-to-clipboard buttons

### Shared BOM Banner
- Blue info banner at top of BOM page
- Shows who shared it
- Indicates it's an editable copy
- "New" badge on first access

---

## Implementation Phases

### Phase 1: MVP (Core Functionality) - Week 1

**Backend:**
- [ ] Create database migration for `bom_shares` table
- [ ] Update `saved_boms` table with sharing fields
- [ ] Implement `bomShareService.js`
- [ ] Implement `bomShareController.js`
- [ ] Add API routes
- [ ] Test with Postman

**Frontend:**
- [ ] Create `ShareBOMModal` component
- [ ] Create `bomShareAPI` service
- [ ] Add Share button to BOM page
- [ ] Create `SharedBOMPage` for link access
- [ ] Add route for `/bom/shared/:token`
- [ ] Test end-to-end flow

### Phase 2: Enhancements - Week 2

**Features:**
- [ ] Share history view (who you shared with)
- [ ] Email notifications (optional)
- [ ] Share management (view/revoke)
- [ ] Better error handling and user feedback
- [ ] Loading states and animations

### Phase 3: Advanced Features - Week 3+

**Features:**
- [ ] Link expiry dates
- [ ] Share permissions (view-only vs edit)
- [ ] Bulk sharing (share with multiple people at once) ✅ Already in MVP
- [ ] Share analytics (who viewed, when)
- [ ] Comments/discussions on shared BOMs

---

## Testing Plan

### Unit Tests

#### Backend Tests
```javascript
// Test: Generate unique tokens
test('should generate unique share tokens', () => {
  const token1 = bomShareService.generateShareToken();
  const token2 = bomShareService.generateShareToken();
  expect(token1).not.toBe(token2);
  expect(token1).toHaveLength(64);
});

// Test: Create shares
test('should create share for multiple users', async () => {
  const shares = await bomShareService.createShares(1, 1, [2, 3]);
  expect(shares).toHaveLength(2);
  expect(shares[0]).toHaveProperty('shareToken');
  expect(shares[0]).toHaveProperty('shareLink');
});

// Test: Access control
test('should deny access to unauthorized user', async () => {
  const token = 'test-token';
  await expect(
    bomShareService.accessSharedBom(token, 999)
  ).rejects.toThrow('Access denied');
});

// Test: BOM copy
test('should create independent copy of BOM', async () => {
  const copiedBom = await bomShareService.copyBomForUser(1, 2, 1, 'token');
  expect(copiedBom.parentBomId).toBe(1);
  expect(copiedBom.createdBy).toBe(2);
  expect(copiedBom.isSharedCopy).toBe(true);
});
```

#### Frontend Tests
```javascript
// Test: Share modal opens
test('should open share modal when Share button clicked', () => {
  render(<BOMPage />);
  fireEvent.click(screen.getByText('Share BOM'));
  expect(screen.getByText('Select Users')).toBeInTheDocument();
});

// Test: User selection
test('should allow selecting multiple users', () => {
  render(<ShareBOMModal isOpen={true} bomId={1} />);
  const checkboxes = screen.getAllByRole('checkbox');
  fireEvent.click(checkboxes[0]);
  fireEvent.click(checkboxes[1]);
  expect(screen.getByText('2 selected')).toBeInTheDocument();
});
```

### Integration Tests

#### Test Scenario 1: Complete Share Flow
```
1. User A logs in
2. User A opens a BOM
3. User A clicks "Share" button
4. User A selects User B from list
5. User A clicks "Generate Share Links"
6. System creates share record and generates token
7. User A copies share link
8. User B receives link (manual step)
9. User B opens link
10. User B logs in (if not already)
11. System verifies User B's permission
12. System creates copy of BOM for User B
13. BOM opens in edit mode for User B
14. User B makes changes
15. Changes are saved to User B's copy only
16. User A's original BOM remains unchanged
```

#### Test Scenario 2: Re-sharing
```
1. User B receives shared BOM from User A
2. User B opens and edits the BOM
3. User B clicks "Share" button
4. User B selects User C
5. System creates new share from User B's copy
6. User C receives link and opens it
7. User C gets a copy of User B's version
8. User C's changes don't affect User A or User B
```

#### Test Scenario 3: Access Denial
```
1. User A shares BOM with User B
2. User C (not authorized) gets the share link
3. User C opens the link
4. System checks permissions
5. System denies access
6. User C sees "Access Denied" message
```

### Manual Testing Checklist

**Share Flow:**
- [ ] Share button visible and clickable
- [ ] Modal opens with user list
- [ ] Users can be selected/deselected
- [ ] Role filter works correctly
- [ ] Multiple users can be selected
- [ ] Share link is generated correctly
- [ ] Link can be copied to clipboard
- [ ] Success message shows all created shares

**Access Flow:**
- [ ] Share link works when pasted in browser
- [ ] Redirects to login if not authenticated
- [ ] After login, redirects to shared BOM
- [ ] Shared BOM banner shows correct info
- [ ] BOM is editable
- [ ] Changes save correctly
- [ ] Original BOM is not affected

**Edge Cases:**
- [ ] Invalid share token shows error
- [ ] Expired/deleted share shows error
- [ ] Unauthorized user gets access denied
- [ ] Already accessed share loads existing copy
- [ ] Re-sharing works correctly
- [ ] Share with self (should it be allowed?)

---

## API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/bom/share` | Create share links | ✅ |
| GET | `/api/bom/shared/:token` | Access shared BOM | ✅ |
| GET | `/api/bom/share-history/:bomId` | Get share history | ✅ |
| GET | `/api/users/list` | Get user list | ✅ |

---

## Database Tables Summary

### `saved_boms` (Updated)
- Added: `parent_bom_id`, `shared_by_user_id`, `is_shared_copy`, `created_from_share_token`
- Purpose: Track lineage and sharing metadata

### `bom_shares` (New)
- Columns: `share_token`, `parent_bom_id`, `shared_by_user_id`, `shared_with_user_id`, `created_bom_id`, `message`, `created_at`, `accessed_at`, `is_accessed`
- Purpose: Track all sharing activities and access

---

## Environment Variables

```env
# Frontend
FRONTEND_URL=https://yourapp.com

# Backend
DATABASE_URL=mysql://user:password@localhost:3306/knapsack_db
JWT_SECRET=your-secret-key
```

---

## Deployment Checklist

### Before Deployment:
- [ ] Run database migrations
- [ ] Update Prisma schema
- [ ] Generate Prisma client
- [ ] Run backend tests
- [ ] Run frontend tests
- [ ] Test on staging environment
- [ ] Review security measures
- [ ] Check error handling
- [ ] Verify all API endpoints

### After Deployment:
- [ ] Monitor logs for errors
- [ ] Test share flow with real users
- [ ] Collect user feedback
- [ ] Monitor database performance
- [ ] Check share link expiry (if implemented)

---

## Known Limitations & Future Improvements

### Current Limitations:
1. Share links don't expire (security consideration)
2. No email notifications (manual link sharing required)
3. No share revocation
4. No "view-only" sharing option (all shares are editable)
5. Cannot copy changes back to original BOM

### Future Improvements:
1. **Email Notifications:** Automatically email share links to recipients
2. **Link Expiry:** Set expiration dates for share links
3. **Share Permissions:** Allow "view-only" vs "edit" permissions
4. **Revocation:** Allow sharer to revoke access
5. **Share Analytics:** Track views, edits, time spent
6. **Collaboration:** Real-time editing (WebSocket)
7. **Version Control:** See history of changes on shared BOM
8. **Merge Changes:** Allow recipient to propose changes back to original
9. **Bulk Operations:** Share with entire team/department
10. **Share Templates:** Save common sharing configurations

---

## Success Metrics

### Key Metrics to Track:
1. **Number of shares created per day/week**
2. **Share access rate** (% of shares that are accessed)
3. **Time to first edit** (how quickly recipients start editing)
4. **Number of re-shares** (chains of sharing)
5. **Average share depth** (A → B → C → D depth)
6. **User satisfaction** (feedback from Sales team)

### Expected Outcomes:
- ✅ Sales team can receive and edit BOMs for negotiations
- ✅ Reduced bottleneck in BOM workflow
- ✅ Faster client negotiation cycles
- ✅ Better collaboration between Design and Sales
- ✅ Improved project turnaround time

---

## Questions to Answer Before Implementation

1. ✅ Should share links expire? (Decision: Not in MVP, add later)
2. ✅ Should recipients get email notifications? (Decision: Not in MVP)
3. ✅ Can recipients re-share? (Decision: Yes ✅)
4. ✅ Should there be a "view-only" option? (Decision: Not in MVP)
5. ✅ How to handle BOM updates after sharing? (Decision: Independent copies)
6. ✅ Should there be a limit on shares? (Decision: No limit)
7. ✅ Can share links be revoked? (Decision: Not in MVP)

---

## Contact & Support

**Implementation Team:**
- Frontend: [Your Name]
- Backend: [Your Name]
- Database: [Your Name]
- Testing: [Your Name]

**Timeline:** 2-3 weeks for MVP + Testing

**Priority:** HIGH (Urgent business requirement)

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-11 | Initial plan created | Your Name |

---

**END OF PLAN**

---

## Next Steps

1. Review this plan with the team
2. Get approval from stakeholders
3. Set up development environment
4. Start with Phase 1 (MVP)
5. Test thoroughly
6. Deploy to staging
7. Get user feedback
8. Deploy to production

**Let's build this! 🚀**





Perfect! I've created a comprehensive plan document for the BOM Sharing feature. 📋

  What's in the Plan:                                                                                                                                                             
  The plan document includes:                                                                                                                                                  
  
  ✅ Complete Feature Overview - Problem statement & solution
  ✅ User Flow Diagrams - Visual flow from share to access
  ✅ Database Schema - Detailed tables with Prisma models
  ✅ Backend Implementation - Services, controllers, routes with code
  ✅ Frontend Implementation - Components, API services with code
  ✅ Security & Permissions - Authentication, authorization checks
  ✅ UI/UX Design - Modal designs, banners, buttons
  ✅ Implementation Phases - MVP → Enhancements → Advanced
  ✅ Testing Plan - Unit tests, integration tests, manual checklist
  ✅ Deployment Checklist - Before/after deployment steps

  File Location:

  D:\react\knapsack-tool\BOM_SHARING_FEATURE_PLAN.md

  Key Highlights:

  Phase 1 (MVP - 1 week):

  - Share button in BOM page
  - User selection modal
  - Generate unique shareable links
  - Create BOM copies for recipients
  - Authentication & permission checks
  - Shared BOM access page

  What's Included:

  - Complete code examples for backend services
  - Complete code examples for frontend components
  - Database migrations
  - API endpoints documentation
  - Security considerations
  - Testing scenarios

  Flow Summary:

  User A → Share → Select Users → Generate Links
    → User B Opens Link → Login → Gets Copy → Edits Freely
      → User B Can Share Again → User C Gets Copy

  Next Steps:

  1. Review the plan - Read through the markdown file
  2. Ask questions - Any clarifications needed?
  3. Get approval - Show to your manager if needed
  4. Start implementation - We can begin Phase 1

  The plan is ready! Should we proceed with implementation, or do you want to review/modify anything first? 🚀                                                                                                                                                      