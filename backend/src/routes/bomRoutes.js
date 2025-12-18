const express = require('express');
const router = express.Router();
const bomController = require('../controllers/bomController');
const pdfController = require('../controllers/pdfController');

// Master Items Routes
// GET /api/bom/master-items - Get all master items
router.get('/master-items', bomController.getAllMasterItems.bind(bomController));

// GET /api/bom/master-items/sunrack/:code - Get master item by Sunrack code
router.get('/master-items/sunrack/:code', bomController.getMasterItemBySunrackCode.bind(bomController));

// GET /api/bom/master-items/:id - Get single master item
router.get('/master-items/:id', bomController.getMasterItemById.bind(bomController));

// POST /api/bom/master-items - Create master item
router.post('/master-items', bomController.createMasterItem.bind(bomController));

// PUT /api/bom/master-items/:id - Update master item
router.put('/master-items/:id', bomController.updateMasterItem.bind(bomController));

// DELETE /api/bom/master-items/:id - Delete master item
router.delete('/master-items/:id', bomController.deleteMasterItem.bind(bomController));

// Formulas Routes
// GET /api/bom/formulas - Get all formulas
router.get('/formulas', bomController.getAllFormulas.bind(bomController));

// POST /api/bom/formulas - Create formula
router.post('/formulas', bomController.createFormula.bind(bomController));

// BOM Storage Routes
// POST /api/bom/save - Save a new BOM
router.post('/save', bomController.saveBom.bind(bomController));

// GET /api/bom/project/:projectId - Get all BOMs for a project
router.get('/project/:projectId', bomController.getBomsByProjectId.bind(bomController));

// GET /api/bom/:bomId - Get a specific BOM by ID
router.get('/:bomId', bomController.getBomById.bind(bomController));

// PUT /api/bom/:bomId - Update a BOM
router.put('/:bomId', bomController.updateBom.bind(bomController));


// Export PDF
router.post('/export-pdf', pdfController.exportPdf);

// Get temporary data for PDF generation
router.get('/temp-data/:id', pdfController.getTempData);


module.exports = router;
