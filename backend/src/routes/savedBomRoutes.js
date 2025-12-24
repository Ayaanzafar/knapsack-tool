const express = require('express');
const router = express.Router();
const savedBomController = require('../controllers/savedBomController');
const { authenticateToken, checkPasswordChange } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticateToken);
router.use(checkPasswordChange);

// POST /api/saved-boms/project/:projectId - Save BOM snapshot
router.post('/project/:projectId', savedBomController.saveBomSnapshot.bind(savedBomController));

// GET /api/saved-boms/project/:projectId - Get saved BOM
router.get('/project/:projectId', savedBomController.getSavedBom.bind(savedBomController));

// GET /api/saved-boms/project/:projectId/exists - Check if saved BOM exists
router.get('/project/:projectId/exists', savedBomController.checkSavedBomExists.bind(savedBomController));

// DELETE /api/saved-boms/project/:projectId - Delete saved BOM
router.delete('/project/:projectId', savedBomController.deleteSavedBom.bind(savedBomController));

module.exports = router;
