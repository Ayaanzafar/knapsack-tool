const express = require('express');
const router = express.Router();
const bomShareController = require('../controllers/bomShareController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public route - NO authentication required (for login page preview)
router.get('/share-preview/:token', bomShareController.getSharePreview);

// All other routes require authentication
router.use(authenticateToken);

// Create share links for a BOM
router.post('/share', bomShareController.createShares);

// Access shared BOM via token
router.get('/shared/:token', bomShareController.accessSharedBom);

// Get share history for a BOM
router.get('/share-history/:bomId', bomShareController.getShareHistory);

// Get BOMs shared with current user
router.get('/shared-with-me', bomShareController.getSharedWithMe);

// Get count of new unaccessed shares
router.get('/new-shares-count', bomShareController.getNewSharesCount);

module.exports = router;
