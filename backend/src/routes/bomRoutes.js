const express = require('express');
const router = express.Router();
const bomController = require('../controllers/bomController');
const pdfController = require('../controllers/pdfController');
const { authenticateToken, checkPasswordChange, authorizeRoles } = require('../middleware/authMiddleware');
const { enforceBomUpdatePermissions, forbidBasicMasterItemMutation } = require('../middleware/bomPermissions');

// Protect all routes
router.use(authenticateToken);
router.use(checkPasswordChange);

// Master Items Routes - DEPRECATED (use sunrack-profiles and fasteners instead)
// TODO: These routes use the old bom_master_items table which is being phased out
// Use /api/bom-templates for BOM generation instead

// BOMPage still uses this endpoint for "Apply to Future" (Update Master DB).
// It supports updating fasteners (id format: F-{id}) and profiles (sNo).
router.put('/master-items/:id', forbidBasicMasterItemMutation, bomController.updateMasterItem.bind(bomController));

// Update material in sunrack_profiles
router.put('/update-material', bomController.updateMaterial.bind(bomController));

/*
// GET /api/bom/master-items - Get all master items
router.get('/master-items', bomController.getAllMasterItems.bind(bomController));

// GET /api/bom/master-items/sunrack/:code - Get master item by Sunrack code
router.get('/master-items/sunrack/:code', bomController.getMasterItemBySunrackCode.bind(bomController));

// GET /api/bom/master-items/:id - Get single master item
router.get('/master-items/:id', bomController.getMasterItemById.bind(bomController));

// POST /api/bom/master-items - Create master item
router.post('/master-items', authorizeRoles('ADVANCED'), bomController.createMasterItem.bind(bomController));

// PUT /api/bom/master-items/:id - Update master item
router.put('/master-items/:id', bomController.updateMasterItem.bind(bomController));

// DELETE /api/bom/master-items/:id - Delete master item
router.delete('/master-items/:id', authorizeRoles('ADVANCED'), bomController.deleteMasterItem.bind(bomController));
*/

// Formulas Routes
// GET /api/bom/formulas - Get all formulas
router.get('/formulas', bomController.getAllFormulas.bind(bomController));

// POST /api/bom/formulas - Create formula
router.post('/formulas', authorizeRoles('ADVANCED'), bomController.createFormula.bind(bomController));

// BOM Storage Routes
// POST /api/bom/save - Save a new BOM
router.post('/save', bomController.saveBom.bind(bomController));

// GET /api/bom/project/:projectId - Get all BOMs for a project
router.get('/project/:projectId', bomController.getBomsByProjectId.bind(bomController));

// GET /api/bom/:bomId - Get a specific BOM by ID
router.get('/:bomId', bomController.getBomById.bind(bomController));

// PUT /api/bom/:bomId - Update a BOM
// COMMENTED OUT: Removed BASIC user restriction for aluminumRate, sparePercentage, moduleWp
router.put('/:bomId', /* enforceBomUpdatePermissions, */ bomController.updateBom.bind(bomController));


// Export PDF
router.post('/export-pdf', pdfController.exportPdf);

// Create temporary data for preview
router.post('/temp-data', pdfController.createTempData);

// Get temporary data for PDF generation/preview
router.get('/temp-data/:id', pdfController.getTempData);


module.exports = router;
