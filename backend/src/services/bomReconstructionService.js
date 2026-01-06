const prisma = require('../prismaClient');
const {
  DEFAULT_ALUMINIUM_RATE_PER_KG,
  DEFAULT_MODULE_WP,
  DEFAULT_SPARE_PERCENTAGE,
  MM_TO_METERS_DIVISOR
} = require('../constants/bomDefaults');

/**
 * BOM Reconstruction Service
 *
 * This service handles conversion between minimal and full BOM formats:
 * - convertToMinimalBOM: Strips redundant data for storage (90% size reduction)
 * - reconstructFullBOM: Rebuilds complete BOM from minimal data + database profiles/fasteners
 */
class BomReconstructionService {
  /**
   * Convert full BOM data to minimal format for storage
   * Removes all redundant profile/fastener data that exists in DB
   *
   * @param {object} fullBomData - Complete BOM data
   * @returns {Promise<object>} - { bomMetadata, bomItems } minimal format
   */
  async convertToMinimalBOM(fullBomData) {
    // Extract metadata (non-redundant data)
    const bomMetadata = {
      aluminumRate: fullBomData.aluminumRate || DEFAULT_ALUMINIUM_RATE_PER_KG,
      sparePercentage: fullBomData.sparePercentage || DEFAULT_SPARE_PERCENTAGE,
      moduleWp: fullBomData.moduleWp || DEFAULT_MODULE_WP,
      tabs: fullBomData.tabs || [],
      panelCounts: fullBomData.panelCounts || {},
      projectInfo: fullBomData.projectInfo || {},
      userNotes: fullBomData.userNotes || []
    };

    // Extract minimal item data (only what's generated/calculated + user edits)
    const bomItems = (fullBomData.bomItems || []).map(item => {
      // profileSerialNumber should already be correct from frontend
      // For profiles: serialNumber (integer)
      // For fasteners: F-{id} (string)
      
      return {
        sn: item.sn,
        profileSerialNumber: item.profileSerialNumber,
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
   * Reconstruct full BOM data from minimal storage + database profiles/fasteners
   * Fetches data from sunrack_profiles and fasteners tables
   *
   * @param {object} bomMetadata - Metadata (aluminum rate, spare %, tabs, etc.)
   * @param {array} bomItems - Minimal item data (references + quantities)
   * @returns {Promise<object>} - Complete BOM data with all profile information
   */
  async reconstructFullBOM(bomMetadata, bomItems) {
    // 1. Fetch all profiles and fasteners
    const [allProfiles, allFasteners] = await Promise.all([
      prisma.sunrackProfile.findMany({}),
      prisma.fastener.findMany()
    ]);

    // 2. Create profilesMap: { id: data }
    const profilesMap = {};
    const profileByFormulaKey = {}; // Helper for legacy formula key lookup if needed

    // Map profiles (using serialNumber as key)
    allProfiles.forEach(profile => {
      const displayCode = profile.regalCode || profile.excellenceCode || profile.varnCode || null;
      
      const mappedProfile = {
        serialNumber: profile.sNo, // Use sNo as serialNumber
        sunrackCode: displayCode,
        genericName: profile.genericName,
        itemDescription: profile.genericName,
        material: profile.material,
        standardLength: profile.standardLength,
        uom: profile.uom,
        designWeight: profile.designWeight,
        profileImage: profile.profileImage,
        costPerPiece: profile.costPerPiece || 0,
        isProfile: true
      };

      // Ensure key is string to match JSON storage
      profilesMap[String(profile.sNo)] = mappedProfile;
    });

    // Map fasteners (using F-{id} as key)
    allFasteners.forEach(fastener => {
      const key = `F-${fastener.id}`;
      
      const mappedFastener = {
        serialNumber: key,
        sunrackCode: null, // Fasteners usually don't have vendor codes in the same way
        genericName: fastener.name || fastener.genericName, // Fallback to genericName if name is missing
        itemDescription: fastener.name || fastener.itemDescription,
        material: fastener.material,
        standardLength: fastener.standardLength, // Use value directly (can be null)
        uom: fastener.uom || 'Nos',
        designWeight: 0, // Fasteners usually don't use weight calculation
        profileImage: fastener.profileImagePath,
        costPerPiece: Number(fastener.costPerPiece || 0), // Ensure number
        isProfile: false,
        isFastener: true
      };

      profilesMap[key] = mappedFastener;
    });

    // 3. Rebuild full BOM items
    const aluminumRate = bomMetadata.aluminumRate || DEFAULT_ALUMINIUM_RATE_PER_KG;
    const sparePercentage = bomMetadata.sparePercentage || DEFAULT_SPARE_PERCENTAGE;
    const moduleWp = bomMetadata.moduleWp || DEFAULT_MODULE_WP;

    const fullBomItems = bomItems.map((item, index) => {
      // Find profile or fastener
      // Ensure we lookup with string key
      let profile = profilesMap[String(item.profileSerialNumber)];

      if (!profile) {
        console.warn(`[Reconstruction] Profile/Fastener not found for item ${item.sn || index + 1}: serialNumber=${item.profileSerialNumber}`);
        return null;
      }

      // Handle M8/M10 description formatting for fasteners
      let itemDescription = profile.itemDescription;
      if (profile.isFastener && profile.standardLength && itemDescription && (itemDescription.startsWith('M8 ') || itemDescription.startsWith('M10 '))) {
        // Simple check to avoid double formatting if it was saved
        if (!itemDescription.includes(`x${profile.standardLength}`)) {
             const prefix = itemDescription.startsWith('M8 ') ? 'M8' : 'M10';
             const restOfName = itemDescription.substring(prefix.length + 1);
             itemDescription = `${prefix}x${profile.standardLength} ${restOfName}`;
        }
      }

      // Calculate totals
      const totalQuantity = Object.values(item.quantities || {}).reduce((sum, qty) => sum + qty, 0);

      // Check for manual spare quantity override
      const spareQuantity = item.userEdits?.manualSpareQuantity !== undefined && item.userEdits?.manualSpareQuantity !== null
        ? item.userEdits.manualSpareQuantity
        : Math.ceil(totalQuantity * (sparePercentage / 100));

      const finalTotal = totalQuantity + spareQuantity;

      // Build full item
      const fullItem = {
        sn: item.sn || (index + 1),
        sunrackCode: profile.sunrackCode,
        profileImage: profile.profileImage,
        itemDescription: itemDescription,
        material: profile.material,
        length: item.length ?? profile.standardLength ?? null,
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
   * @param {object} profile - Profile/Fastener data
   * @param {number} aluminumRate - Rate per kg for aluminum
   * @returns {object} - { wtPerRm, rm, wt, cost, costPerPiece }
   */
  calculateWeightAndCost(item, profile, aluminumRate = DEFAULT_ALUMINIUM_RATE_PER_KG) {
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
    } 
    // Legacy support
    else if (item.userEdits?.costPerPiece !== undefined) {
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
      result.rm = (lengthToUse / MM_TO_METERS_DIVISOR) * item.finalTotal;  // Convert mm to meters
      result.wt = result.rm * result.wtPerRm;
      result.cost = result.wt * effectiveAluminumRate;
    }

    return result;
  }
}

module.exports = new BomReconstructionService();