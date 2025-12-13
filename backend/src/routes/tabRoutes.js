const express = require('express');
const router = express.Router();
const tabController = require('../controllers/tabController');
const rowController = require('../controllers/rowController');

// GET /api/tabs/:id - Get single tab
router.get('/:id', tabController.getTabById.bind(tabController));

// PUT /api/tabs/:id - Update tab
router.put('/:id', tabController.updateTab.bind(tabController));

// DELETE /api/tabs/:id - Delete tab
router.delete('/:id', tabController.deleteTab.bind(tabController));

// POST /api/tabs/:id/duplicate - Duplicate tab
router.post('/:id/duplicate', tabController.duplicateTab.bind(tabController));

// Nested row routes
// POST /api/tabs/:tabId/rows - Create new row for tab
router.post('/:tabId/rows', rowController.createRow.bind(rowController));

// GET /api/tabs/:tabId/rows - Get all rows for tab
router.get('/:tabId/rows', rowController.getRowsByTabId.bind(rowController));

// PUT /api/tabs/:tabId/rows/reorder - Reorder rows
router.put('/:tabId/rows/reorder', rowController.reorderRows.bind(rowController));

// PUT /api/tabs/:id/profile - Update tab's long rail profile
router.put('/:id/profile', tabController.updateTabProfile.bind(tabController));

module.exports = router;
