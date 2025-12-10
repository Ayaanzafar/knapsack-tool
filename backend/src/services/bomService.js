const prisma = require('../prismaClient');

class BomService {
  // Get all BOM master items
  async getAllMasterItems() {
    return await prisma.bomMasterItem.findMany({
      where: { isActive: true },
      orderBy: { serialNumber: 'asc' },
      include: {
        formulas: true
      }
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
  async updateMasterItem(id, data) {
    return await prisma.bomMasterItem.update({
      where: { id: parseInt(id) },
      data: {
        serialNumber: data.serialNumber,
        sunrackCode: data.sunrackCode,
        itemDescription: data.itemDescription,
        material: data.material,
        standardLength: data.standardLength,
        uom: data.uom,
        category: data.category,
        profileImagePath: data.profileImagePath,
        updatedAt: new Date()
      }
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
}

module.exports = new BomService();
