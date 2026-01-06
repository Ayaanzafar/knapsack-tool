const prisma = require('../prismaClient');
const bomReconstructionService = require('./bomReconstructionService');
const { Prisma } = require('@prisma/client');

class BomService {
  // Get all BOM master items (profiles + fasteners)
  async getAllMasterItems() {
    // New schema: master data lives in sunrack_profiles (profiles) + fasteners (hardware).
    const [profiles, fasteners] = await Promise.all([
      prisma.sunrackProfile.findMany({
        orderBy: { sNo: 'asc' },
        include: { formulas: true },
      }),
      prisma.fastener.findMany({
        where: { isActive: true },
        orderBy: { id: 'asc' },
        include: { formulas: true },
      }),
    ]);

    const pickPreferredProfileCode = (profile) => {
      return (
        profile.regalCode ||
        profile.excellenceCode ||
        profile.varnCode ||
        profile.rcCode ||
        profile.snalcoCode ||
        profile.darshanCode ||
        profile.jmCode ||
        profile.ralcoCode ||
        profile.saiDeepCode ||
        profile.eleanorCode ||
        null
      );
    };

    const mappedProfiles = profiles.map((profile) => ({
      itemType: 'PROFILE',
      serialNumber: String(profile.sNo),
      sunrackCode: pickPreferredProfileCode(profile),
      itemDescription: profile.profileDescription,
      genericName: profile.genericName,
      designWeight: profile.designWeight,
      material: profile.material || null,
      standardLength: profile.standardLength ?? null,
      uom: profile.uom || null,
      category: profile.category || null,
      profileImagePath: profile.profileImage || null,
      costPerPiece: null,
      formulas: profile.formulas || [],
      sunrackProfile: profile,
    }));

    const mappedFasteners = fasteners.map((fastener) => ({
      itemType: 'FASTENER',
      serialNumber: `F-${fastener.id}`,
      sunrackCode: null,
      itemDescription: fastener.itemDescription,
      genericName: fastener.genericName,
      designWeight: null,
      material: fastener.material || null,
      standardLength: fastener.standardLength ?? null,
      uom: fastener.uom,
      category: fastener.category || null,
      profileImagePath: fastener.profileImagePath || null,
      costPerPiece: fastener.costPerPiece ?? null,
      formulas: fastener.formulas || [],
      fastener: fastener,
    }));

    return [...mappedProfiles, ...mappedFasteners];

    /* Legacy bom_master_items implementation (deprecated)
    const items = await prisma.bomMasterItem.findMany({
      where: { isActive: true },
      orderBy: { serialNumber: 'asc' },
      include: {
        formulas: true,
        rmCodes: true,  // Include RM codes
        sunrackProfile: true // ✅ NEW: Include original profile codes
      }
    });

    // Add preferred RM code to each item
    return items.map(item => {
      // Find Regal's RM code first (priority)
      let preferredRmCode = item.rmCodes.find(
        rm => rm.vendorName === 'Regal' && rm.code !== null
      )?.code;

      // If Regal's code is not available, find any non-NULL code
      if (!preferredRmCode) {
        preferredRmCode = item.rmCodes.find(
          rm => rm.code !== null
        )?.code;
      }

      return {
        ...item,
        preferredRmCode: preferredRmCode || null
      };
    });
    */
  }

  // Get single BOM master item
  async getMasterItemById(id) {
    const idValue = String(id).trim();
    if (idValue.startsWith('F-')) {
      const match = /^F-(\d+)$/.exec(idValue);
      if (!match) return null;
      const fastenerId = Number.parseInt(match[1], 10);
      if (!Number.isFinite(fastenerId)) return null;

      const fastener = await prisma.fastener.findUnique({
        where: { id: fastenerId },
        include: { formulas: true },
      });
      if (!fastener) return null;

      return {
        itemType: 'FASTENER',
        serialNumber: `F-${fastener.id}`,
        sunrackCode: null,
        itemDescription: fastener.itemDescription,
        genericName: fastener.genericName,
        designWeight: null,
        material: fastener.material || null,
        standardLength: fastener.standardLength ?? null,
        uom: fastener.uom,
        category: fastener.category || null,
        profileImagePath: fastener.profileImagePath || null,
        costPerPiece: fastener.costPerPiece ?? null,
        formulas: fastener.formulas || [],
        fastener: fastener,
      };
    }

    const sNo = Number.parseInt(idValue, 10);
    if (!Number.isFinite(sNo)) return null;

    const profile = await prisma.sunrackProfile.findUnique({
      where: { sNo },
      include: { formulas: true },
    });
    if (!profile) return null;

    const preferredRmCode =
      profile.regalCode ||
      profile.excellenceCode ||
      profile.varnCode ||
      profile.rcCode ||
      profile.snalcoCode ||
      profile.darshanCode ||
      profile.jmCode ||
      profile.ralcoCode ||
      profile.saiDeepCode ||
      profile.eleanorCode ||
      null;

    return {
      itemType: 'PROFILE',
      serialNumber: String(profile.sNo),
      sunrackCode: preferredRmCode,
      itemDescription: profile.profileDescription,
      genericName: profile.genericName,
      designWeight: profile.designWeight,
      material: profile.material || null,
      standardLength: profile.standardLength ?? null,
      uom: profile.uom || null,
      category: profile.category || null,
      profileImagePath: profile.profileImage || null,
      costPerPiece: null,
      formulas: profile.formulas || [],
      sunrackProfile: profile,
    };
  }

  // Get BOM master item by Sunrack code
  async getMasterItemBySunrackCode(sunrackCode) {
    const code = String(sunrackCode).trim();
    if (!code) return null;

    const profile = await prisma.sunrackProfile.findFirst({
      where: {
        OR: [
          { regalCode: code },
          { excellenceCode: code },
          { varnCode: code },
          { rcCode: code },
          { snalcoCode: code },
          { darshanCode: code },
          { jmCode: code },
          { ralcoCode: code },
          { saiDeepCode: code },
          { eleanorCode: code },
        ],
      },
      include: { formulas: true },
    });

    if (!profile) return null;

    const preferredRmCode =
      profile.regalCode ||
      profile.excellenceCode ||
      profile.varnCode ||
      profile.rcCode ||
      profile.snalcoCode ||
      profile.darshanCode ||
      profile.jmCode ||
      profile.ralcoCode ||
      profile.saiDeepCode ||
      profile.eleanorCode ||
      null;

    return {
      itemType: 'PROFILE',
      serialNumber: String(profile.sNo),
      sunrackCode: preferredRmCode,
      itemDescription: profile.profileDescription,
      genericName: profile.genericName,
      designWeight: profile.designWeight,
      material: profile.material || null,
      standardLength: profile.standardLength ?? null,
      uom: profile.uom || null,
      category: profile.category || null,
      profileImagePath: profile.profileImage || null,
      costPerPiece: null,
      formulas: profile.formulas || [],
      sunrackProfile: profile,
    };
  }

  // Create BOM master item
  async createMasterItem(data) {
    const err = new Error('Deprecated: master items are now sunrack_profiles + fasteners');
    err.statusCode = 410;
    throw err;
  }

  // Update BOM master item (supports SunrackProfile and Fastener)
  async updateMasterItem(idOrSerialNumber, data) {
    const shouldLog =
      process.env.DEBUG_BOM_MASTER_UPDATE === 'true' || process.env.NODE_ENV === 'development';
    if (shouldLog) {
      console.log('[BOM] updateMasterItem request:', { idOrSerialNumber, data });
    }

    // Check if it's a fastener (format: F-{id})
    if (typeof idOrSerialNumber === 'string' && idOrSerialNumber.startsWith('F-')) {
      const match = /^F-(\d+)$/.exec(idOrSerialNumber.trim());
      if (!match) {
        const err = new Error('Invalid fastener id format; expected F-{id}');
        err.statusCode = 400;
        throw err;
      }

      const fastenerId = Number.parseInt(match[1], 10);
      if (!Number.isFinite(fastenerId)) {
        const err = new Error('Invalid fastener id');
        err.statusCode = 400;
        throw err;
      }

      const updateData = {};
      if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'costPerPiece')) {
        const value = data.costPerPiece;
        updateData.costPerPiece =
          value === undefined || value === null || value === '' ? null : new Prisma.Decimal(String(value));
      }

      if (Object.keys(updateData).length === 0) {
        return { message: 'No update performed for fastener (no supported fields provided)' };
      }

      return await prisma.fastener.update({
        where: { id: fastenerId },
        data: updateData,
      });
    }

    // Otherwise treat as SunrackProfile sNo
    // Profiles no longer have costPerPiece in the master table, 
    // so we only update other fields if provided.
    const sNo = Number.parseInt(String(idOrSerialNumber).trim(), 10);
    if (!Number.isFinite(sNo)) {
      const err = new Error('Invalid profile sNo');
      err.statusCode = 400;
      throw err;
    }
     
    // Remove costPerPiece from data if it exists, as it's no longer in the schema for profiles
    const { costPerPiece, ...otherData } = data;
    
    if (Object.keys(otherData).length === 0) {
      return { message: 'No update performed for profile (costPerPiece not supported)' };
    }

    return await prisma.sunrackProfile.update({
      where: { sNo: sNo },
      data: otherData,
    });
  }

  // Delete BOM master item (soft delete)
  async deleteMasterItem(id) {
    const err = new Error('Deprecated: master items are now sunrack_profiles + fasteners');
    err.statusCode = 410;
    throw err;
  }

  // Get all BOM formulas
  async getAllFormulas() {
    return await prisma.bomFormula.findMany({
      where: { isActive: true },
      include: {
        sunrackProfile: true,
        fastener: true
      },
      orderBy: { calculationLevel: 'asc' }
    });
  }

  // Create BOM formula
  async createFormula(data) {
    return await prisma.bomFormula.create({
      data: {
        itemSerialNumber: data.itemSerialNumber,
        formulaKey: data.formulaKey,
        formulaDescription: data.formulaDescription || null,
        calculationLevel: data.calculationLevel
      }
    });
  }

  /**
   * Saves a new generated BOM to the database.
   * Converts to minimal format (90% size reduction) before saving.
   * Handles versioning by incrementing the version number for the project.
   * @param {number} projectId - The ID of the project.
   * @param {object} bomData - The complete BOM data to save.
   * @returns {Promise<object>} The newly created BOM record.
   */
  async saveBom(projectId, bomData) {
    // Convert to minimal format for storage
    const { bomMetadata, bomItems } = await bomReconstructionService.convertToMinimalBOM(bomData);

    // Start a transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // 1. Set all existing BOMs for this project to isLatest = false
      await tx.generatedBom.updateMany({
        where: { projectId: projectId },
        data: { isLatest: false },
      });

      // 2. Find the latest version number for this project
      const latestBom = await tx.generatedBom.findFirst({
        where: { projectId: projectId },
        orderBy: { version: 'desc' },
      });
      const newVersion = latestBom ? latestBom.version + 1 : 1;

      // 3. Create the new BOM record with minimal format
      const newBom = await tx.generatedBom.create({
        data: {
          projectId: projectId,
          bomMetadata: bomMetadata,  // OPTIMIZED: Minimal metadata
          bomItems: bomItems,        // OPTIMIZED: Minimal item data
          version: newVersion,
          isLatest: true,
          changeLog: [], // Initialize with an empty changelog
        },
      });

      return newBom;
    });
  }

  /**
   * Retrieves all BOM versions for a specific project.
   * @param {number} projectId - The ID of the project.
   * @returns {Promise<Array<object>>} A list of BOMs with essential details.
   */
  async getBomsByProjectId(projectId) {
    return await prisma.generatedBom.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        generatedAt: true,
        updatedAt: true,
        version: true,
        isLatest: true,
        generatedBy: true,
        changeLog: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves a specific BOM by its ID.
   * Reconstructs full BOM from minimal storage format.
   * @param {number} bomId - The ID of the BOM.
   * @returns {Promise<object|null>} The full BOM object or null if not found.
   */
  async getBomById(bomId) {
    const bom = await prisma.generatedBom.findUnique({
      where: { id: parseInt(bomId) },
      include: { project: true }, // Include project to get longRailVariation
    });

    if (!bom) {
      return null;
    }

    let bomDataToReturn;

    // Handle backward compatibility: check if old bomData format exists
    if (bom.bomData) {
      // Old format: return as-is
      bomDataToReturn = bom.bomData;
    }
    // New optimized format: reconstruct full BOM from minimal data
    else if (bom.bomMetadata && bom.bomItems) {
      bomDataToReturn = await bomReconstructionService.reconstructFullBOM(
        bom.bomMetadata,
        bom.bomItems
      );
    }

    if (bomDataToReturn) {
      // Ensure projectInfo exists and backfill longRailVariation if missing
      if (!bomDataToReturn.projectInfo) {
        bomDataToReturn.projectInfo = {};
      }

      if (!bomDataToReturn.projectInfo.longRailVariation && bom.project?.longRailVariation) {
        bomDataToReturn.projectInfo.longRailVariation = bom.project.longRailVariation;
      }

      return {
        ...bom,
        bomData: bomDataToReturn
      };
    }

    // No data available
    return bom;
  }

  /**
   * Updates an existing BOM, typically with new data or a new changelog.
   * Converts to minimal format before saving.
   * @param {number} bomId - The ID of the BOM to update.
   * @param {object} bomData - The updated BOM data (full format).
   * @param {Array<object>} changeLog - The updated changelog.
   * @returns {Promise<object>} The updated BOM record.
   */
  async updateBom(bomId, bomData, changeLog) {
    // Convert to minimal format for storage
    const { bomMetadata, bomItems } = await bomReconstructionService.convertToMinimalBOM(bomData);

    return await prisma.generatedBom.update({
      where: { id: parseInt(bomId) },
      data: {
        bomMetadata: bomMetadata,  // OPTIMIZED: Minimal metadata
        bomItems: bomItems,        // OPTIMIZED: Minimal item data
        changeLog: changeLog,
        updatedAt: new Date(),
      },
    });
  }
}

module.exports = new BomService();
