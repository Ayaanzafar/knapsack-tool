const express = require('express');
const router = express.Router();
const defaultNotesController = require('../controllers/defaultNotesController');
const { authenticateToken, checkPasswordChange, requirePermission } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticateToken);
router.use(checkPasswordChange);

// GET /api/default-notes - Get all default notes (anyone authenticated can view)
router.get('/', defaultNotesController.getAllDefaultNotes);

// POST /api/default-notes - Add a new default note (MANAGER only)
router.post('/', requirePermission('canEditDefaultNotes'), defaultNotesController.addDefaultNote);

// PUT /api/default-notes/:noteOrder - Update a specific default note (MANAGER only)
router.put('/:noteOrder', requirePermission('canEditDefaultNotes'), defaultNotesController.updateDefaultNote);

// PUT /api/default-notes - Update multiple default notes (MANAGER only)
router.put('/', requirePermission('canEditDefaultNotes'), defaultNotesController.updateDefaultNotes);

// DELETE /api/default-notes/:noteOrder - Delete a default note (MANAGER only)
router.delete('/:noteOrder', requirePermission('canEditDefaultNotes'), defaultNotesController.deleteDefaultNote);

module.exports = router;
