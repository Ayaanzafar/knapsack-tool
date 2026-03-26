const prisma = require('../prismaClient');
const configService = require('../services/configService');

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

// All tab settings fields that go through permission checks
const ALL_TAB_SETTINGS_FIELDS = [
  'buffer', 'lengthsInput', 'costPerMm', 'costPerJointSet', 'joinerLength',
  'maxPieces', 'maxWastePct', 'alphaJoint', 'betaSmall', 'allowUndershootPct', 'gammaShort',
];

exports.enforceTabUpdatePermissions = async (req, res, next) => {
  try {
    const role = req.user?.role;
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
        gammaShort: true,
      },
    });

    if (!existingTab) return res.status(404).json({ error: 'Tab not found' });

    // Check each restricted field dynamically
    for (const field of ALL_TAB_SETTINGS_FIELDS) {
      if (settings[field] === undefined) continue;

      const canEdit = await configService.canEditTabField(role, field);
      if (canEdit) continue;

      // Field not allowed — enforce that value hasn't changed from stored
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
        const nextVal = normalizeNullableString(settings.maxWastePct);
        const prevVal = normalizeNullableString(existingTab.maxWastePct);
        if (nextVal !== prevVal) return forbiddenField(res, 'maxWastePct');
        continue;
      }

      // alphaJoint, betaSmall, gammaShort, maxPieces
      const nextVal = normalizeInt(settings[field]);
      const prevVal = existingTab[field] ?? null;
      if (nextVal === null) return forbiddenField(res, field);
      if (nextVal !== prevVal) return forbiddenField(res, field);
    }

    // Validate enabledLengths: only toggle existing lengths if not allowed to edit lengthsInput
    if (settings.enabledLengths !== undefined && settings.enabledLengths !== null) {
      if (typeof settings.enabledLengths !== 'object') {
        return forbiddenField(res, 'enabledLengths', 'Invalid enabledLengths payload');
      }

      const canEditLengthsInput = await configService.canEditTabField(role, 'lengthsInput');

      if (!canEditLengthsInput) {
        const existingLengths = new Set(parseNumList(existingTab.lengthsInput).map(String));
        const updateKeys = Object.keys(settings.enabledLengths);

        for (const key of updateKeys) {
          if (!existingLengths.has(String(key))) {
            return forbiddenField(res, 'enabledLengths', 'Cannot add/delete cutlengths');
          }
        }

        const prevEnabled = (existingTab.enabledLengths && typeof existingTab.enabledLengths === 'object')
          ? existingTab.enabledLengths
          : {};
        const merged = { ...prevEnabled, ...settings.enabledLengths };
        const filteredMerged = {};
        for (const key of Object.keys(merged)) {
          if (existingLengths.has(String(key))) {
            filteredMerged[key] = merged[key];
          }
        }
        req.body.settings.enabledLengths = filteredMerged;
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

// For restricted users, reset non-editable fields to admin-configured defaults during tab creation
exports.sanitizeTabCreateForRole = async (req, res, next) => {
  try {
    const role = req.user?.role;

    if (!req.body) req.body = {};
    if (!req.body.settings || typeof req.body.settings !== 'object') req.body.settings = {};

    const tabDefs = await configService.getTabDefaults();

    for (const field of ALL_TAB_SETTINGS_FIELDS) {
      const canEdit = await configService.canEditTabField(role, field);
      if (!canEdit) {
        if (field === 'lengthsInput') {
          req.body.settings.lengthsInput = tabDefs.lengthsInput;
          // Also reset enabledLengths to match the default lengths list
          const defaultLengths = parseNumList(tabDefs.lengthsInput);
          const enabledLengths = {};
          for (const l of defaultLengths) enabledLengths[l] = true;
          req.body.settings.enabledLengths = enabledLengths;
        } else if (tabDefs[field] !== undefined) {
          req.body.settings[field] = tabDefs[field];
        } else {
          delete req.body.settings[field];
        }
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
};
