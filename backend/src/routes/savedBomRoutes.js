const express = require('express');
const router = express.Router();
const savedBomController = require('../controllers/savedBomController');
const { authenticateToken, checkPasswordChange } = require('../middleware/authMiddleware');
const configService = require('../services/configService');

// Protect all routes
router.use(authenticateToken);
router.use(checkPasswordChange);

// BOM view scope middleware — checks canViewAllBoms / canViewSalesBoms / canViewDesignBoms
const canViewBoms = async (req, res, next) => {
  const role = req.user?.role;
  const canAll    = await configService.hasPermission(role, 'canViewAllBoms');
  const canSales  = await configService.hasPermission(role, 'canViewSalesBoms');
  const canDesign = await configService.hasPermission(role, 'canViewDesignBoms');

  if (!canAll && !canSales && !canDesign) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (canAll) {
    req.bomViewScope = 'all';
  } else {
    const roles = [];
    if (canSales)  roles.push('SALES');
    if (canDesign) roles.push('DESIGN');
    req.bomViewRoles = roles;
  }
  next();
};

// GET /api/saved-boms/all - Get all saved BOMs (scoped by role permissions)
router.get('/all', canViewBoms, savedBomController.getAllSavedBoms.bind(savedBomController));

// POST /api/saved-boms/project/:projectId - Save BOM snapshot
router.post('/project/:projectId', savedBomController.saveBomSnapshot.bind(savedBomController));

// GET /api/saved-boms/project/:projectId - Get saved BOM
router.get('/project/:projectId', savedBomController.getSavedBom.bind(savedBomController));

// GET /api/saved-boms/project/:projectId/exists - Check if saved BOM exists
router.get('/project/:projectId/exists', savedBomController.checkSavedBomExists.bind(savedBomController));

// DELETE /api/saved-boms/project/:projectId - Delete saved BOM
router.delete('/project/:projectId', savedBomController.deleteSavedBom.bind(savedBomController));

module.exports = router;
