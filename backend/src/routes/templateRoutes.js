const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken, checkPasswordChange } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticateToken);
router.use(checkPasswordChange);

/**
 * GET /api/bom-templates/:variationName
 * Get BOM variation template by variation name
 */
router.get('/:variationName', async (req, res, next) => {
  try {
    const { variationName } = req.params;

    const template = await prisma.bomVariationTemplate.findUnique({
      where: { variationName: decodeURIComponent(variationName) }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found for this variation' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    next(error);
  }
});

/**
 * GET /api/bom-templates
 * Get all BOM variation templates
 */
router.get('/', async (req, res, next) => {
  try {
    const templates = await prisma.bomVariationTemplate.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' }
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    next(error);
  }
});

module.exports = router;
