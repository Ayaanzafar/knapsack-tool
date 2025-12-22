const prisma = require('../prismaClient');

const ADVANCED_ROLES = new Set(['DESIGN', 'MANAGER']);

const forbiddenField = (res, field, message = 'Advanced only') => {
  return res.status(403).json({ code: 'FORBIDDEN_FIELD', field, message });
};

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

const getBomMetadata = (bomRecord) => {
  if (bomRecord?.bomMetadata && typeof bomRecord.bomMetadata === 'object') return bomRecord.bomMetadata;
  if (bomRecord?.bomData && typeof bomRecord.bomData === 'object') return bomRecord.bomData;
  return {};
};

const getBomItems = (bomRecord) => {
  if (Array.isArray(bomRecord?.bomItems)) return bomRecord.bomItems;
  if (bomRecord?.bomData && typeof bomRecord.bomData === 'object' && Array.isArray(bomRecord.bomData.bomItems)) {
    return bomRecord.bomData.bomItems.map((item) => ({
      sn: item.sn,
      userEdits: item.userEdits || null
    }));
  }
  return [];
};

// Enforce BOMPage "Advanced-only" restrictions on the backend.
// BASIC users cannot modify:
// - bomData.aluminumRate, bomData.sparePercentage, bomData.moduleWp
// - any bomItems[].userEdits.manualAluminumRate
// - any bomItems[].userEdits.userProvidedCostPerPiece (Rate Per Piece override)
exports.enforceBomUpdatePermissions = async (req, res, next) => {
  try {
    const role = req.user?.role;
    if (ADVANCED_ROLES.has(role)) return next();

    const bomId = Number.parseInt(req.params.bomId, 10);
    if (!Number.isFinite(bomId)) return res.status(400).json({ error: 'Invalid bomId' });

    const incomingBomData = req.body?.bomData;
    if (!incomingBomData || typeof incomingBomData !== 'object') return res.status(400).json({ error: 'bomData is required' });

    const bomRecord = await prisma.generatedBom.findUnique({
      where: { id: bomId },
      select: { id: true, bomMetadata: true, bomItems: true, bomData: true }
    });

    if (!bomRecord) return res.status(404).json({ error: 'BOM not found' });

    const currentMeta = getBomMetadata(bomRecord);
    const currentAluminumRate = toNullableNumber(currentMeta.aluminumRate) ?? 527.85;
    const currentSparePercentage = toNullableNumber(currentMeta.sparePercentage) ?? 1.0;
    const currentModuleWp = toNullableNumber(currentMeta.moduleWp) ?? 710;

    // Disallow changing BOM-level globals (compare against stored values).
    const nextAluminumRate = toNullableNumber(incomingBomData.aluminumRate);
    const nextSparePercentage = toNullableNumber(incomingBomData.sparePercentage);
    const nextModuleWp = toNullableNumber(incomingBomData.moduleWp);

    if (nextAluminumRate === null || Math.abs(nextAluminumRate - currentAluminumRate) > 1e-9) {
      return forbiddenField(res, 'aluminumRate');
    }
    if (nextSparePercentage === null || Math.abs(nextSparePercentage - currentSparePercentage) > 1e-9) {
      return forbiddenField(res, 'sparePercentage');
    }

    // Some older clients may omit moduleWp; only allow omission when it would not change persisted value.
    if (incomingBomData.moduleWp === undefined) {
      if (Math.abs(currentModuleWp - 710) > 1e-9) {
        return forbiddenField(res, 'moduleWp');
      }
    } else if (nextModuleWp === null || Math.abs(nextModuleWp - currentModuleWp) > 1e-9) {
      return forbiddenField(res, 'moduleWp');
    }

    // Disallow changing per-item cost/aluminum overrides.
    const currentItems = getBomItems(bomRecord);
    const currentBySn = new Map(currentItems.map((item) => [String(item.sn), item.userEdits || null]));

    const incomingItems = Array.isArray(incomingBomData.bomItems) ? incomingBomData.bomItems : [];
    for (const item of incomingItems) {
      const snKey = String(item?.sn ?? '');
      const currentUserEdits = currentBySn.get(snKey) || null;
      const nextUserEdits = item?.userEdits || null;

      const currentManualAlRate = toNullableNumber(currentUserEdits?.manualAluminumRate);
      const nextManualAlRate = toNullableNumber(nextUserEdits?.manualAluminumRate);
      if (currentManualAlRate !== nextManualAlRate) {
        return forbiddenField(res, 'manualAluminumRate');
      }

      const currentCostPerPiece = toNullableNumber(
        currentUserEdits?.userProvidedCostPerPiece ?? currentUserEdits?.costPerPiece
      );
      const nextCostPerPiece = toNullableNumber(
        nextUserEdits?.userProvidedCostPerPiece ?? nextUserEdits?.costPerPiece
      );
      if (currentCostPerPiece !== nextCostPerPiece) {
        return forbiddenField(res, 'costPerPiece');
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

// BASIC users cannot mutate BOM master items (BOMPage can attempt this via "Update Master DB").
exports.forbidBasicMasterItemMutation = (req, res, next) => {
  const role = req.user?.role;
  if (ADVANCED_ROLES.has(role)) return next();

  const keys = req.body && typeof req.body === 'object' ? Object.keys(req.body) : [];
  const field = keys.length > 0 ? keys[0] : 'masterItem';
  return forbiddenField(res, field);
};

