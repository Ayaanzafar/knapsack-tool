const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :projectId
const walkwayController = require('../controllers/walkwayController');
const { authenticateToken, checkPasswordChange } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(checkPasswordChange);

// GET /api/projects/:projectId/walkway-rows
router.get('/', walkwayController.getRows.bind(walkwayController));

// POST /api/projects/:projectId/walkway-rows/sync
router.post('/sync', walkwayController.syncRows.bind(walkwayController));

module.exports = router;
