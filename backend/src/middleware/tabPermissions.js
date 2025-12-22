const prisma = require('../prismaClient');

const ADVANCED_ROLES = new Set(['DESIGN', 'MANAGER']);

const DEFAULTS = {
  buffer: 15,
  lengthsInput: '1595, 1798, 2400, 2750, 3600, 4800'
};

const getDefaultEnabledLengths = () => ({
  1595: true,
  1798: true,
  2400: true,
  2750: true,
  3600: true,
  4800: true
});

const forbiddenField = (res, field, message = 'Advanced only') => {
  return res.status(403).json({ code: 'FORBIDDEN_FIELD', field, message });
};

const parseNumList = (value) => {
  if (typeof value !== 'string') return [];
  return value
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => Number.isFinite(n));
};

const normalizeInt = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

const normalizeFloat = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeNullableString = (value) => {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
};

const ADVANCED_ONLY_SETTINGS_FIELDS = [
  'buffer',
  'lengthsInput',
  'costPerMm',
  'costPerJointSet',
  'joinerLength',
  'maxPieces',
  'maxWastePct',
  'alphaJoint',
  'betaSmall',
  'allowUndershootPct',
  'gammaShort'
];

// BASIC users are allowed to toggle enabledLengths for *existing* cutlengths only.
// BASIC users are NOT allowed to change buffer or edit cutlength list (lengthsInput) or other advanced-only fields.
exports.enforceTabUpdatePermissions = async (req, res, next) => {
  try {
    const role = req.user?.role;
    if (ADVANCED_ROLES.has(role)) return next();

    const settings = req.body?.settings;
    if (!settings || typeof settings !== 'object') return next();

    const tabId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(tabId)) return res.status(400).json({ error: 'Invalid tab id' });

    const existingTab = await prisma.tab.findUnique({
      where: { id: tabId },
      select: {
        id: true,
        buffer: true,
        lengthsInput: true,
        enabledLengths: true,
        maxPieces: true,
        costPerMm: true,
        costPerJointSet: true,
        joinerLength: true,
        maxWastePct: true,
        alphaJoint: true,
        betaSmall: true,
        allowUndershootPct: true,
        gammaShort: true
      }
    });

    if (!existingTab) return res.status(404).json({ error: 'Tab not found' });

    // Reject if BASIC attempts to change any advanced-only fields.
    for (const field of ADVANCED_ONLY_SETTINGS_FIELDS) {
      if (settings[field] === undefined) continue;

      if (field === 'buffer') {
        const nextVal = normalizeInt(settings.buffer);
        if (nextVal === null) return forbiddenField(res, 'buffer');
        if (nextVal !== existingTab.buffer) return forbiddenField(res, 'buffer');
        continue;
      }

      if (field === 'lengthsInput') {
        const nextVal = String(settings.lengthsInput ?? '').trim();
        const prevVal = String(existingTab.lengthsInput ?? '').trim();
        if (nextVal !== prevVal) return forbiddenField(res, 'lengthsInput');
        continue;
      }

      if (field === 'costPerMm' || field === 'costPerJointSet' || field === 'joinerLength') {
        const nextVal = String(settings[field] ?? '').trim();
        const prevVal = String(existingTab[field] ?? '').trim();
        if (!nextVal) return forbiddenField(res, field);
        if (nextVal !== prevVal) return forbiddenField(res, field);
        continue;
      }

      if (field === 'allowUndershootPct') {
        const nextVal = normalizeFloat(settings.allowUndershootPct);
        const prevVal = existingTab.allowUndershootPct ?? null;
        if (nextVal === null) return forbiddenField(res, 'allowUndershootPct');
        if (nextVal !== prevVal) return forbiddenField(res, 'allowUndershootPct');
        continue;
      }

      if (field === 'maxWastePct') {
        // Stored as string/null; treat any non-identical update as forbidden.
        const nextVal = normalizeNullableString(settings.maxWastePct);
        const prevVal = normalizeNullableString(existingTab.maxWastePct);
        if (nextVal !== prevVal) return forbiddenField(res, 'maxWastePct');
        continue;
      }

      // alphaJoint, betaSmall, gammaShort
      const nextVal = normalizeInt(settings[field]);
      const prevVal = existingTab[field] ?? null;
      if (nextVal === null) return forbiddenField(res, field);
      if (nextVal !== prevVal) return forbiddenField(res, field);
    }

    // Validate enabledLengths: only toggle existing lengths.
    if (settings.enabledLengths !== undefined && settings.enabledLengths !== null) {
      if (typeof settings.enabledLengths !== 'object') {
        return forbiddenField(res, 'enabledLengths', 'Invalid enabledLengths payload');
      }

      const existingLengths = new Set(parseNumList(existingTab.lengthsInput).map(String));
      const updateKeys = Object.keys(settings.enabledLengths);

      for (const key of updateKeys) {
        if (!existingLengths.has(String(key))) {
          return forbiddenField(res, 'enabledLengths', 'BASIC cannot add/delete cutlengths');
        }
      }

      const prevEnabled = (existingTab.enabledLengths && typeof existingTab.enabledLengths === 'object') ? existingTab.enabledLengths : {};
      const merged = { ...prevEnabled, ...settings.enabledLengths };

      // Keep only known lengths keys in storage for consistency
      const filteredMerged = {};
      for (const key of Object.keys(merged)) {
        if (existingLengths.has(String(key))) {
          filteredMerged[key] = merged[key];
        }
      }

      req.body.settings.enabledLengths = filteredMerged;
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

// For BASIC users, ignore/force defaults for advanced-only settings during tab creation.
exports.sanitizeTabCreateForRole = (req, res, next) => {
  const role = req.user?.role;
  if (ADVANCED_ROLES.has(role)) return next();

  if (!req.body) req.body = {};
  if (!req.body.settings || typeof req.body.settings !== 'object') req.body.settings = {};

  // Force safe defaults for BASIC so they can't "create" with advanced-only overrides.
  req.body.settings.buffer = DEFAULTS.buffer;
  req.body.settings.lengthsInput = DEFAULTS.lengthsInput;
  req.body.settings.enabledLengths = getDefaultEnabledLengths();

  // Ensure BASIC can't set other advanced-only fields during create (use TabService defaults).
  delete req.body.settings.costPerMm;
  delete req.body.settings.costPerJointSet;
  delete req.body.settings.joinerLength;
  delete req.body.settings.maxPieces;
  delete req.body.settings.maxWastePct;
  delete req.body.settings.alphaJoint;
  delete req.body.settings.betaSmall;
  delete req.body.settings.allowUndershootPct;
  delete req.body.settings.gammaShort;

  return next();
};
