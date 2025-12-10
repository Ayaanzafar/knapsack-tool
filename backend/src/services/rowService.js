const prisma = require('../prismaClient');

class RowService {
  // Create a new row
  async createRow(tabId, data) {
    return await prisma.tabRow.create({
      data: {
        tabId: parseInt(tabId),
        rowNumber: data.rowNumber,
        modules: data.modules || 0,
        quantity: data.quantity || 1,
        supportBase1: data.supportBase1 || null,
        supportBase2: data.supportBase2 || null
      }
    });
  }

  // Get all rows for a tab
  async getRowsByTabId(tabId) {
    return await prisma.tabRow.findMany({
      where: { tabId: parseInt(tabId) },
      orderBy: { rowNumber: 'asc' }
    });
  }

  // Get single row by ID
  async getRowById(id) {
    return await prisma.tabRow.findUnique({
      where: { id: parseInt(id) }
    });
  }

  // Update row
  async updateRow(id, data) {
    console.log(`📥 Backend: Update row ${id} with data:`, data);

    const result = await prisma.tabRow.update({
      where: { id: parseInt(id) },
      data: {
        modules: data.modules,
        quantity: data.quantity,
        supportBase1: data.supportBase1,
        supportBase2: data.supportBase2
      }
    });

    console.log(`✅ Backend: Row ${id} updated successfully:`, result);
    return result;
  }

  // Delete row
  async deleteRow(id) {
    return await prisma.tabRow.delete({
      where: { id: parseInt(id) }
    });
  }

  // Reorder rows
  async reorderRows(tabId, rowOrders) {
    // rowOrders is an array of { id, rowNumber }
    const updatePromises = rowOrders.map(row =>
      prisma.tabRow.update({
        where: { id: parseInt(row.id) },
        data: { rowNumber: row.rowNumber }
      })
    );

    return await Promise.all(updatePromises);
  }
}

module.exports = new RowService();
