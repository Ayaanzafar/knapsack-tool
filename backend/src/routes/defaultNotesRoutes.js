const express = require('express');
const router = express.Router();
const defaultNotesController = require('../controllers/defaultNotesController');
const { authenticateToken, checkPasswordChange, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticateToken);
router.use(checkPasswordChange);

// GET /api/default-notes - Get all default notes (anyone authenticated can view)
router.get('/', defaultNotesController.getAllDefaultNotes);

// POST /api/default-notes - Add a new default note (MANAGER only)
router.post('/', authorizeRoles('MANAGER'), defaultNotesController.addDefaultNote);

// PUT /api/default-notes/:noteOrder - Update a specific default note (MANAGER only)
router.put('/:noteOrder', authorizeRoles('MANAGER'), defaultNotesController.updateDefaultNote);

// PUT /api/default-notes - Update multiple default notes (MANAGER only)
router.put('/', authorizeRoles('MANAGER'), defaultNotesController.updateDefaultNotes);

// DELETE /api/default-notes/:noteOrder - Delete a default note (MANAGER only)
router.delete('/:noteOrder', authorizeRoles('MANAGER'), defaultNotesController.deleteDefaultNote);

module.exports = router;
