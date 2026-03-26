const prisma = require('../prismaClient');

// ─── Default configs (used for self-seeding if DB rows are missing) ────────────

const DEFAULT_PERMISSIONS = {
  SALES: {
    canUpdateMasterItem: false,
    canViewAllBoms: false,
    canViewSalesBoms: false,
    canViewDesignBoms: false,
    canEditDefaultNotes: false,
    canEditAppDefaults: false,
    canManageUsers: false,
    canAccessAdmin: false,
    editableTabFields: [
      'moduleLength', 'moduleWidth', 'frameThickness',
      'midClamp', 'endClampWidth', 'railsPerSide',
      'purlinDistance', 'seamToSeamDistance', 'maxSupportDistance',
      'enabledLengths', 'priority',
    ],
    editableBomFields: [],
  },
  DESIGN: {
    canUpdateMasterItem: true,
    canViewAllBoms: false,
    canViewSalesBoms: false,
    canViewDesignBoms: false,
    canEditDefaultNotes: false,
    canEditAppDefaults: false,
    canManageUsers: false,
    canAccessAdmin: false,
    editableTabFields: [
      'moduleLength', 'moduleWidth', 'frameThickness',
      'midClamp', 'endClampWidth', 'buffer', 'railsPerSide',
      'purlinDistance', 'seamToSeamDistance', 'maxSupportDistance',
      'enabledLengths', 'lengthsInput',
      'costPerMm', 'costPerJointSet', 'joinerLength', 'maxPieces', 'priority',
      'maxWastePct', 'alphaJoint', 'betaSmall', 'allowUndershootPct', 'gammaShort',
    ],
    editableBomFields: [
      'aluminumRate', 'sparePercentage', 'moduleWp',
      'perItemCost', 'perItemAluminumRate',
    ],
  },
  MANAGER_SALES: {
    canUpdateMasterItem: false,
    canViewAllBoms: false,
    canViewSalesBoms: true,
    canViewDesignBoms: false,
    canEditDefaultNotes: false,
    canEditAppDefaults: false,
    canManageUsers: false,
    canAccessAdmin: false,
    editableTabFields: [
      'moduleLength', 'moduleWidth', 'frameThickness',
      'midClamp', 'endClampWidth', 'railsPerSide',
      'purlinDistance', 'seamToSeamDistance', 'maxSupportDistance',
      'enabledLengths', 'priority',
    ],
    editableBomFields: [],
  },
  MANAGER_DESIGN: {
    canUpdateMasterItem: true,
    canViewAllBoms: true,
    canViewSalesBoms: true,
    canViewDesignBoms: true,
    canEditDefaultNotes: true,
    canEditAppDefaults: true,
    canManageUsers: true,
    canAccessAdmin: true,
    editableTabFields: ['all'],
    editableBomFields: ['all'],
  },
};

const DEFAULT_APP_DEFAULTS = {
  tabDefaults: {
    moduleLength: 2278,
    moduleWidth: 1134,
    frameThickness: 35,
    midClamp: 20,
    endClampWidth: 40,
    buffer: 15,
    purlinDistance: 1700,
    seamToSeamDistance: 400,
    maxSupportDistance: 1800,
    railsPerSide: 2,
    lengthsInput: '1595, 1798, 2400, 2750, 3600, 4800',
    maxPieces: 3,
    maxWastePct: '',
    alphaJoint: 220,
    betaSmall: 60,
    allowUndershootPct: 0,
    gammaShort: 5,
    costPerMm: '0.1',
    costPerJointSet: '50',
    joinerLength: '100',
    priority: 'cost',
  },
  bomDefaults: {
    aluminumRate: 460,
    hdgRatePerKg: 125,
    magnelisRatePerKg: 125,
    moduleWp: 590,
    sparePercentage: 1.0,
  },
};

// ─── In-memory cache ───────────────────────────────────────────────────────────

const _cache = {
  permissions: null,
  defaults: null,
};

// ─── Permissions ───────────────────────────────────────────────────────────────

async function getPermissions() {
  if (_cache.permissions) return _cache.permissions;

  let row = await prisma.systemConfig.findUnique({ where: { key: 'role_permissions' } });

  if (!row) {
    row = await prisma.systemConfig.create({
      data: { key: 'role_permissions', value: DEFAULT_PERMISSIONS },
    });
    _cache.permissions = row.value;
    return _cache.permissions;
  }

  // Backfill: merge any new permission keys added to DEFAULT_PERMISSIONS
  // that don't yet exist in the stored DB row (forward-compatible)
  const stored = row.value;
  let dirty = false;
  const merged = {};
  for (const role of Object.keys(DEFAULT_PERMISSIONS)) {
    merged[role] = { ...DEFAULT_PERMISSIONS[role], ...stored[role] };
    // Check if any key from DEFAULT is missing in stored
    for (const key of Object.keys(DEFAULT_PERMISSIONS[role])) {
      if (!(key in (stored[role] ?? {}))) {
        dirty = true;
      }
    }
  }

  if (dirty) {
    // Persist the backfilled data so future reads don't need to backfill again
    row = await prisma.systemConfig.update({
      where: { key: 'role_permissions' },
      data: { value: merged },
    });
  }

  _cache.permissions = dirty ? merged : stored;
  return _cache.permissions;
}

async function hasPermission(role, key) {
  const perms = await getPermissions();
  return perms[role]?.[key] === true;
}

async function canEditTabField(role, fieldKey) {
  const perms = await getPermissions();
  const fields = perms[role]?.editableTabFields ?? [];
  return fields.includes('all') || fields.includes(fieldKey);
}

async function canEditBomField(role, fieldKey) {
  const perms = await getPermissions();
  const fields = perms[role]?.editableBomFields ?? [];
  return fields.includes('all') || fields.includes(fieldKey);
}

async function updatePermissions(data) {
  // Always lock MANAGER_DESIGN to full access
  data.MANAGER_DESIGN = {
    ...data.MANAGER_DESIGN,
    canUpdateMasterItem: true,
    canViewAllBoms: true,
    canViewSalesBoms: true,
    canViewDesignBoms: true,
    canEditDefaultNotes: true,
    canEditAppDefaults: true,
    canManageUsers: true,
    canAccessAdmin: true,
    editableTabFields: ['all'],
    editableBomFields: ['all'],
  };

  const row = await prisma.systemConfig.upsert({
    where: { key: 'role_permissions' },
    update: { value: data },
    create: { key: 'role_permissions', value: data },
  });

  _cache.permissions = row.value;
  return _cache.permissions;
}

// ─── App Defaults ──────────────────────────────────────────────────────────────

async function getAppDefaults() {
  if (_cache.defaults) return _cache.defaults;

  let row = await prisma.systemConfig.findUnique({ where: { key: 'app_defaults' } });

  if (!row) {
    row = await prisma.systemConfig.create({
      data: { key: 'app_defaults', value: DEFAULT_APP_DEFAULTS },
    });
  }

  _cache.defaults = row.value;
  return _cache.defaults;
}

async function getTabDefaults() {
  const defaults = await getAppDefaults();
  return defaults.tabDefaults;
}

async function getBomDefaults() {
  const defaults = await getAppDefaults();
  return defaults.bomDefaults;
}

async function updateAppDefaults(data) {
  const row = await prisma.systemConfig.upsert({
    where: { key: 'app_defaults' },
    update: { value: data },
    create: { key: 'app_defaults', value: data },
  });

  _cache.defaults = row.value;
  return _cache.defaults;
}

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  DEFAULT_PERMISSIONS,
  DEFAULT_APP_DEFAULTS,
  getPermissions,
  hasPermission,
  canEditTabField,
  canEditBomField,
  updatePermissions,
  getAppDefaults,
  getTabDefaults,
  getBomDefaults,
  updateAppDefaults,
};
