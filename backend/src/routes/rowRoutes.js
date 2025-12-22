const express = require('express');
const router = express.Router();
const rowController = require('../controllers/rowController');
const { authenticateToken, checkPasswordChange } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticateToken);
router.use(checkPasswordChange);

// GET /api/rows/:id - Get single row
router.get('/:id', rowController.getRowById.bind(rowController));

// PUT /api/rows/:id - Update row
router.put('/:id', rowController.updateRow.bind(rowController));

// DELETE /api/rows/:id - Delete row
router.delete('/:id', rowController.deleteRow.bind(rowController));

module.exports = router;
