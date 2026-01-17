const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken, checkPasswordChange, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticateToken);
router.use(checkPasswordChange);

const normalizeDefaultNotes = (raw) => {
  if (!Array.isArray(raw)) return [];

  // Accept either ["note", ...] or [{noteText}, ...] and normalize to
  // [{ noteOrder: 1, noteText: "..." }, ...]
  const noteTexts = raw
    .map((n) => {
      if (typeof n === 'string') return n;
      if (n && typeof n === 'object') return n.noteText ?? n.text ?? '';
      return '';
    })
    .map((s) => String(s).trim())
    .filter(Boolean);

  return noteTexts.map((noteText, idx) => ({
    noteOrder: idx + 1,
    noteText,
  }));
};

/**
 * GET /api/bom-templates/:variationName
 * Get BOM variation template by variation name
 */
router.get('/:variationName', async (req, res, next) => {
  try {
    const { variationName } = req.params;

    const template = await prisma.bomVariationTemplate.findUnique({
      where: { variationName: decodeURIComponent(variationName) },
      include: {
        variationItems: {
          include: {
            sunrackProfile: true,  // For profile items
            fastener: true         // For fastener items
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found for this variation' });
    }

    // Transform to make it easier for frontend to consume if needed
    // or return as is for high-fidelity linking
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    next(error);
  }
});

/**
 * GET /api/bom-templates/:variationName/default-notes
 * Get default notes for a variation template (normalized for frontend editing UI)
 */
router.get('/:variationName/default-notes', async (req, res, next) => {
  try {
    const { variationName } = req.params;

    const template = await prisma.bomVariationTemplate.findUnique({
      where: { variationName: decodeURIComponent(variationName) },
      select: { variationName: true, defaultNotes: true },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found for this variation' });
    }

    res.json({
      variationName: template.variationName,
      defaultNotes: normalizeDefaultNotes(template.defaultNotes),
    });
  } catch (error) {
    console.error('Error fetching template default notes:', error);
    next(error);
  }
});

/**
 * PUT /api/bom-templates/:variationName/default-notes
 * Update default notes for a variation template (MANAGER only)
 * Accepts either:
 * - { defaultNotes: ["note 1", ...] }
 * - { defaultNotes: [{ noteOrder, noteText }, ...] }
 * - { notes: [{ noteOrder, noteText }, ...] } (compat)
 * Stores as an array of strings in bom_variation_templates.default_notes.
 */
router.put('/:variationName/default-notes', authorizeRoles('MANAGER'), async (req, res, next) => {
  try {
    const { variationName } = req.params;
    const incoming = req.body?.defaultNotes ?? req.body?.notes ?? [];

    const normalized = normalizeDefaultNotes(incoming);
    const toStore = normalized.map((n) => n.noteText);

    const updated = await prisma.bomVariationTemplate.update({
      where: { variationName: decodeURIComponent(variationName) },
      data: { defaultNotes: toStore },
      select: { variationName: true, defaultNotes: true, updatedAt: true },
    });

    res.json({
      variationName: updated.variationName,
      defaultNotes: normalizeDefaultNotes(updated.defaultNotes),
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Error updating template default notes:', error);
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
