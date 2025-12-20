const prisma = require('../prismaClient');

/**
 * BOM Reconstruction Service
 *
 * This service handles conversion between minimal and full BOM formats:
 * - convertToMinimalBOM: Strips redundant data for storage (90% size reduction)
 * - reconstructFullBOM: Rebuilds complete BOM from minimal data + database profiles
 */
class BomReconstructionService {
  /**
   * Convert full BOM data to minimal format for storage
   * Removes all redundant profile data that exists in bom_master_items
   *
   * @param {object} fullBomData - Complete BOM data with all profile information
   * @returns {Promise<object>} - { bomMetadata, bomItems } minimal format
   */
  async convertToMinimalBOM(fullBomData) {
    // Extract metadata (non-redundant data)
    const bomMetadata = {
      aluminumRate: fullBomData.aluminumRate || 527.85,
      sparePercentage: fullBomData.sparePercentage || 1.0,
      moduleWp: fullBomData.moduleWp || 710,
      tabs: fullBomData.tabs || [],
      panelCounts: fullBomData.panelCounts || {},
      projectInfo: fullBomData.projectInfo || {},
      userNotes: fullBomData.userNotes || []
    };

    // If profileSerialNumber is missing in items, we need to look it up
    // Fetch profiles once to resolve serial numbers
    const allProfiles = await prisma.bomMasterItem.findMany({
      where: { isActive: true },
      include: {
        rmCodes: true,
        formulas: true
      }
    });

    // Create lookup maps
    const profileBySunrackCode = {};
    const profileByRmCode = {};
    const profileByFormulaKey = {};

    allProfiles.forEach(profile => {
      if (profile.sunrackCode) {
        profileBySunrackCode[profile.sunrackCode] = profile;
      }
      profile.rmCodes.forEach(rm => {
        if (rm.code) {
          profileByRmCode[rm.code] = profile;
        }
      });
      if (profile.formulas) {
        profile.formulas.forEach(formula => {
          profileByFormulaKey[formula.formulaKey] = profile;
        });
      }
    });

    // Extract minimal item data (only what's generated/calculated + user edits)
    const bomItems = (fullBomData.bomItems || []).map(item => {
      let profileSerialNumber = item.profileSerialNumber;

      // If profileSerialNumber is missing, derive it from other fields
      if (!profileSerialNumber) {
        const profile = profileBySunrackCode[item.sunrackCode] ||
                       profileByRmCode[item.sunrackCode] ||
                       profileByFormulaKey[item.formulaKey];

        if (profile) {
          profileSerialNumber = profile.serialNumber;
        }
      }

      return {
        sn: item.sn,
        profileSerialNumber: profileSerialNumber,  // Reference to bom_master_items
        calculationType: item.calculationType,     // CUT_LENGTH or ACCESSORY
        length: item.length || null,               // Cut length (if applicable)
        quantities: item.quantities || {},         // Per-tab quantities
        userEdits: item.userEdits || null,         // Any manual edits by user
        formulaKey: item.formulaKey || null        // Store formula key for reconstruction
      };
    });

    return { bomMetadata, bomItems };
  }

  /**
   * Reconstruct full BOM data from minimal storage + database profiles
   * Fetches profile data from bom_master_items and rebuilds complete BOM structure
   *
   * @param {object} bomMetadata - Metadata (aluminum rate, spare %, tabs, etc.)
   * @param {array} bomItems - Minimal item data (references + quantities)
   * @returns {Promise<object>} - Complete BOM data with all profile information
   */
  async reconstructFullBOM(bomMetadata, bomItems) {
    // 1. Fetch all profiles from database with formulas and RM codes
    const allProfiles = await prisma.bomMasterItem.findMany({
      where: { isActive: true },
      include: {
        formulas: true,
        rmCodes: true
      }
    });

    // 2. Create profilesMap and lookup maps: { serialNumber: profileData }
    const profilesMap = {};
    const profileByFormulaKey = {};

    allProfiles.forEach(profile => {
      // Find preferred RM code (Regal priority)
      let preferredRmCode = profile.rmCodes.find(
        rm => rm.vendorName === 'Regal' && rm.code !== null
      )?.code;

      // If Regal's code not available, find any non-NULL code
      if (!preferredRmCode) {
        preferredRmCode = profile.rmCodes.find(
          rm => rm.code !== null
        )?.code;
      }

      const enrichedProfile = {
        ...profile,
        preferredRmCode: preferredRmCode || null
      };

      profilesMap[profile.serialNumber] = enrichedProfile;

      // Also map by formula key for fallback lookup
      if (profile.formulas) {
        profile.formulas.forEach(formula => {
          profileByFormulaKey[formula.formulaKey] = enrichedProfile;
        });
      }
    });

    // 3. Rebuild full BOM items with profile data
    const aluminumRate = bomMetadata.aluminumRate || 527.85;
    const sparePercentage = bomMetadata.sparePercentage || 1.0;
    const moduleWp = bomMetadata.moduleWp || 710;

    const fullBomItems = bomItems.map((item, index) => {
      // Try to find profile by serial number first, then fallback to formula key
      let profile = profilesMap[item.profileSerialNumber];

      // Fallback: try to find by formula key if profileSerialNumber lookup failed
      if (!profile && item.formulaKey) {
        profile = profileByFormulaKey[item.formulaKey];
      }

      if (!profile) {
        console.warn(`Profile not found for item ${item.sn || index + 1}: serialNumber=${item.profileSerialNumber}, formulaKey=${item.formulaKey}`);
        return null;
      }

      // Calculate totals
      const totalQuantity = Object.values(item.quantities || {}).reduce((sum, qty) => sum + qty, 0);

      // Check for manual spare quantity override
      const spareQuantity = item.userEdits?.manualSpareQuantity !== undefined && item.userEdits?.manualSpareQuantity !== null
        ? item.userEdits.manualSpareQuantity
        : Math.ceil(totalQuantity * (sparePercentage / 100));

      const finalTotal = totalQuantity + spareQuantity;

      // Build full item with profile data
      const fullItem = {
        sn: item.sn || (index + 1),
        sunrackCode: profile.preferredRmCode || profile.sunrackCode,
        profileImage: profile.profileImagePath,
        itemDescription: profile.genericName,
        material: profile.material,
        length: item.length,
        uom: profile.uom,
        calculationType: item.calculationType,
        profileSerialNumber: item.profileSerialNumber,
        formulaKey: item.formulaKey,
        quantities: item.quantities,
        totalQuantity: totalQuantity,
        spareQuantity: spareQuantity,
        finalTotal: finalTotal,
        userEdits: item.userEdits
      };

      // Calculate weight and cost
      const weightCost = this.calculateWeightAndCost(fullItem, profile, aluminumRate);
      fullItem.wtPerRm = weightCost.wtPerRm;
      fullItem.rm = weightCost.rm;
      fullItem.wt = weightCost.wt;
      fullItem.cost = weightCost.cost;
      fullItem.costPerPiece = weightCost.costPerPiece;

      return fullItem;
    }).filter(item => item !== null);

    // 4. Return complete BOM structure
    return {
      projectInfo: bomMetadata.projectInfo,
      tabs: bomMetadata.tabs,
      panelCounts: bomMetadata.panelCounts,
      profilesMap: profilesMap,
      bomItems: fullBomItems,
      aluminumRate: aluminumRate,
      sparePercentage: sparePercentage,
      moduleWp: moduleWp,
      userNotes: bomMetadata.userNotes || []
    };
  }

  /**
   * Calculate weight and cost for a BOM item
   *
   * @param {object} item - BOM item with quantities
   * @param {object} profile - Profile data from bom_master_items
   * @param {number} aluminumRate - Rate per kg for aluminum
   * @returns {object} - { wtPerRm, rm, wt, cost, costPerPiece }
   */
  calculateWeightAndCost(item, profile, aluminumRate = 527.85) {
    const result = {
      wtPerRm: null,
      rm: null,
      wt: null,
      cost: null,
      costPerPiece: null
    };

    // Check for user override (Rate Per Piece edit)
    if (item.userEdits?.userProvidedCostPerPiece !== undefined) {
      result.costPerPiece = parseFloat(item.userEdits.userProvidedCostPerPiece);
      result.cost = result.costPerPiece * item.finalTotal;
      return result;
    } else if (item.userEdits?.costPerPiece !== undefined) {
      // Legacy support
      result.costPerPiece = parseFloat(item.userEdits.costPerPiece);
      result.cost = result.costPerPiece * item.finalTotal;
      return result;
    }

    // Check if profile has cost_per_piece (for fasteners/accessories)
    if (profile.costPerPiece && profile.costPerPiece > 0) {
      result.costPerPiece = parseFloat(profile.costPerPiece);
      result.cost = result.costPerPiece * item.finalTotal;
      return result;
    }

    // Weight-based calculation for aluminum profiles
    // Use item.length (for cut lengths) or profile.standardLength (for accessories)
    const lengthToUse = item.length || item.userEdits?.userProvidedStandardLength || profile.standardLength;
    const effectiveAluminumRate = parseFloat(item.userEdits?.manualAluminumRate ?? aluminumRate) || 0;

    if (profile.designWeight && profile.designWeight > 0 && lengthToUse) {
      result.wtPerRm = parseFloat(profile.designWeight);
      result.rm = (lengthToUse / 1000) * item.finalTotal;  // Convert mm to meters
      result.wt = result.rm * result.wtPerRm;
      result.cost = result.wt * effectiveAluminumRate;
    }

    return result;
  }
}

module.exports = new BomReconstructionService();
