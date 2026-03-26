const express = require('express');
const router = express.Router();
const { authenticateToken, checkPasswordChange, authorizeRoles, requirePermission } = require('../middleware/authMiddleware');
const configService = require('../services/configService');

// All config routes require authentication
router.use(authenticateToken);
router.use(checkPasswordChange);

// GET /api/config/permissions — any logged-in user (loaded on login)
router.get('/permissions', async (req, res) => {
  try {
    const permissions = await configService.getPermissions();
    res.json(permissions);
  } catch (err) {
    console.error('GET /config/permissions error:', err);
    res.status(500).json({ error: 'Failed to load permissions' });
  }
});

// PUT /api/config/permissions — MANAGER_DESIGN only
router.put('/permissions', authorizeRoles('MANAGER_DESIGN'), async (req, res) => {
  try {
    const data = req.body;

    // Safety: MANAGER_DESIGN must always retain core permissions
    const md = data.MANAGER_DESIGN ?? {};
    if (md.canAccessAdmin === false || md.canManageUsers === false || md.canEditAppDefaults === false) {
      return res.status(400).json({ error: 'Cannot remove canAccessAdmin, canManageUsers, or canEditAppDefaults from MANAGER_DESIGN' });
    }

    const updated = await configService.updatePermissions(data);
    res.json(updated);
  } catch (err) {
    console.error('PUT /config/permissions error:', err);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// GET /api/config/defaults — any logged-in user (loaded on login)
router.get('/defaults', async (req, res) => {
  try {
    const defaults = await configService.getAppDefaults();
    res.json(defaults);
  } catch (err) {
    console.error('GET /config/defaults error:', err);
    res.status(500).json({ error: 'Failed to load defaults' });
  }
});

// PUT /api/config/defaults — requires canEditAppDefaults permission
router.put('/defaults', requirePermission('canEditAppDefaults'), async (req, res) => {
  try {
    const data = req.body;

    // Basic sanity validation — no negative lengths or rates
    const tab = data.tabDefaults ?? {};
    const bom = data.bomDefaults ?? {};
    const numericTabFields = [
      'moduleLength', 'moduleWidth', 'frameThickness', 'midClamp', 'endClampWidth',
      'buffer', 'purlinDistance', 'seamToSeamDistance', 'maxSupportDistance', 'railsPerSide',
      'maxPieces', 'alphaJoint', 'betaSmall', 'allowUndershootPct', 'gammaShort',
    ];
    for (const field of numericTabFields) {
      if (tab[field] !== undefined && Number(tab[field]) < 0) {
        return res.status(400).json({ error: `${field} cannot be negative` });
      }
    }
    const numericBomFields = ['aluminumRate', 'hdgRatePerKg', 'magnelisRatePerKg', 'moduleWp', 'sparePercentage'];
    for (const field of numericBomFields) {
      if (bom[field] !== undefined && Number(bom[field]) < 0) {
        return res.status(400).json({ error: `${field} cannot be negative` });
      }
    }

    const updated = await configService.updateAppDefaults(data);
    res.json(updated);
  } catch (err) {
    console.error('PUT /config/defaults error:', err);
    res.status(500).json({ error: 'Failed to update defaults' });
  }
});

module.exports = router;
