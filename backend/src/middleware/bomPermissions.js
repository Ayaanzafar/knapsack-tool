const prisma = require('../prismaClient');
const { FLOAT_COMPARISON_TOLERANCE } = require('../constants/bomDefaults');
const configService = require('../services/configService');

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
      userEdits: item.userEdits || null,
    }));
  }
  return [];
};

exports.enforceBomUpdatePermissions = async (req, res, next) => {
  try {
    const role = req.user?.role;

    const bomId = Number.parseInt(req.params.bomId, 10);
    if (!Number.isFinite(bomId)) return res.status(400).json({ error: 'Invalid bomId' });

    const incomingBomData = req.body?.bomData;
    if (!incomingBomData || typeof incomingBomData !== 'object') {
      return res.status(400).json({ error: 'bomData is required' });
    }

    const bomRecord = await prisma.generatedBom.findUnique({
      where: { id: bomId },
      select: { id: true, bomMetadata: true, bomItems: true, bomData: true },
    });

    if (!bomRecord) return res.status(404).json({ error: 'BOM not found' });

    const bomDefs = await configService.getBomDefaults();
    const currentMeta = getBomMetadata(bomRecord);

    const currentAluminumRate = toNullableNumber(currentMeta.aluminumRate) ?? bomDefs.aluminumRate;
    const currentSparePercentage = toNullableNumber(currentMeta.sparePercentage) ?? bomDefs.sparePercentage;
    const currentModuleWp = toNullableNumber(currentMeta.moduleWp) ?? bomDefs.moduleWp;

    // Check and enforce BOM-level rate fields
    const canEditAlRate = await configService.canEditBomField(role, 'aluminumRate');
    const canEditSpare = await configService.canEditBomField(role, 'sparePercentage');
    const canEditWp = await configService.canEditBomField(role, 'moduleWp');

    const nextAluminumRate = toNullableNumber(incomingBomData.aluminumRate);
    const nextSparePercentage = toNullableNumber(incomingBomData.sparePercentage);
    const nextModuleWp = toNullableNumber(incomingBomData.moduleWp);

    if (!canEditAlRate) {
      if (nextAluminumRate === null || Math.abs(nextAluminumRate - currentAluminumRate) > FLOAT_COMPARISON_TOLERANCE) {
        return forbiddenField(res, 'aluminumRate');
      }
    }

    if (!canEditSpare) {
      if (nextSparePercentage === null || Math.abs(nextSparePercentage - currentSparePercentage) > FLOAT_COMPARISON_TOLERANCE) {
        return forbiddenField(res, 'sparePercentage');
      }
    }

    if (!canEditWp) {
      if (incomingBomData.moduleWp === undefined) {
        if (Math.abs(currentModuleWp - bomDefs.moduleWp) > FLOAT_COMPARISON_TOLERANCE) {
          return forbiddenField(res, 'moduleWp');
        }
      } else if (nextModuleWp === null || Math.abs(nextModuleWp - currentModuleWp) > FLOAT_COMPARISON_TOLERANCE) {
        return forbiddenField(res, 'moduleWp');
      }
    }

    // Check per-item cost/aluminum overrides
    const canEditPerItemCost = await configService.canEditBomField(role, 'perItemCost');
    const canEditPerItemAlRate = await configService.canEditBomField(role, 'perItemAluminumRate');

    if (!canEditPerItemCost || !canEditPerItemAlRate) {
      const currentItems = getBomItems(bomRecord);
      const currentBySn = new Map(currentItems.map((item) => [String(item.sn), item.userEdits || null]));

      const incomingItems = Array.isArray(incomingBomData.bomItems) ? incomingBomData.bomItems : [];
      for (const item of incomingItems) {
        const snKey = String(item?.sn ?? '');
        const currentUserEdits = currentBySn.get(snKey) || null;
        const nextUserEdits = item?.userEdits || null;

        if (!canEditPerItemAlRate) {
          const currentManualAlRate = toNullableNumber(currentUserEdits?.manualAluminumRate);
          const nextManualAlRate = toNullableNumber(nextUserEdits?.manualAluminumRate);
          if (currentManualAlRate !== nextManualAlRate) {
            return forbiddenField(res, 'manualAluminumRate');
          }
        }

        if (!canEditPerItemCost) {
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
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

// Only roles with canUpdateMasterItem can mutate BOM master items
exports.forbidBasicMasterItemMutation = async (req, res, next) => {
  try {
    const role = req.user?.role;
    const allowed = await configService.hasPermission(role, 'canUpdateMasterItem');
    if (!allowed) {
      const keys = req.body && typeof req.body === 'object' ? Object.keys(req.body) : [];
      const field = keys.length > 0 ? keys[0] : 'masterItem';
      return forbiddenField(res, field);
    }
    return next();
  } catch (err) {
    return next(err);
  }
};
