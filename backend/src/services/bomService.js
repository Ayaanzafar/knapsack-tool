const prisma = require('../prismaClient');
const bomReconstructionService = require('./bomReconstructionService');

class BomService {
  // Get all BOM master items
  async getAllMasterItems() {
    const items = await prisma.bomMasterItem.findMany({
      where: { isActive: true },
      orderBy: { serialNumber: 'asc' },
      include: {
        formulas: true,
        rmCodes: true  // Include RM codes
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
  }

  // Get single BOM master item
  async getMasterItemById(id) {
    return await prisma.bomMasterItem.findUnique({
      where: { id: parseInt(id) },
      include: {
        formulas: true
      }
    });
  }

  // Get BOM master item by Sunrack code
  async getMasterItemBySunrackCode(sunrackCode) {
    return await prisma.bomMasterItem.findUnique({
      where: { sunrackCode },
      include: {
        formulas: true
      }
    });
  }

  // Create BOM master item
  async createMasterItem(data) {
    return await prisma.bomMasterItem.create({
      data: {
        serialNumber: data.serialNumber,
        sunrackCode: data.sunrackCode || null,
        itemDescription: data.itemDescription,
        material: data.material || null,
        standardLength: data.standardLength || null,
        uom: data.uom,
        category: data.category || null,
        profileImagePath: data.profileImagePath || null
      }
    });
  }

  // Update BOM master item
  async updateMasterItem(serialNumber, data) {
    return await prisma.bomMasterItem.update({
      where: { serialNumber: serialNumber },
      data: data, // Allow partial updates
    });
  }

  // Delete BOM master item (soft delete)
  async deleteMasterItem(id) {
    return await prisma.bomMasterItem.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
  }

  // Get all BOM formulas
  async getAllFormulas() {
    return await prisma.bomFormula.findMany({
      where: { isActive: true },
      include: {
        masterItem: true
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
