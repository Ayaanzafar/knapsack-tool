const express = require('express');
const router = express.Router();
const customBomController = require('../controllers/customBomController');
const { authenticateToken, checkPasswordChange } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(checkPasswordChange);

// GET  /api/custom-bom/:projectId
router.get('/:projectId', customBomController.get.bind(customBomController));

// PUT  /api/custom-bom/:projectId
router.put('/:projectId', customBomController.upsert.bind(customBomController));

module.exports = router;
