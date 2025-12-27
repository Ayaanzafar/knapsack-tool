const prisma = require('../prismaClient');

class RowService {
  // Create a new row
  async createRow(tabId, data) {
    const row = await prisma.tabRow.create({
      data: {
        tabId: parseInt(tabId),
        rowNumber: data.rowNumber,
        modules: data.modules || 0,
        quantity: data.quantity || 1,
        supportBase1: data.supportBase1 || null,
        supportBase2: data.supportBase2 || null
      }
    });

    // Update parent project's updatedAt
    const tab = await prisma.tab.findUnique({
      where: { id: parseInt(tabId) }
    });
    if (tab) {
      await prisma.project.update({
        where: { id: tab.projectId },
        data: { updatedAt: new Date() }
      });
    }

    return row;
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

    // Update parent project's updatedAt
    const tab = await prisma.tab.findUnique({
      where: { id: result.tabId }
    });
    if (tab) {
      await prisma.project.update({
        where: { id: tab.projectId },
        data: { updatedAt: new Date() }
      });
    }

    console.log(`✅ Backend: Row ${id} updated successfully:`, result);
    return result;
  }

  // Delete row
  async deleteRow(id) {
    // Get row to find tabId before deleting
    const row = await prisma.tabRow.findUnique({
      where: { id: parseInt(id) }
    });

    const deletedRow = await prisma.tabRow.delete({
      where: { id: parseInt(id) }
    });

    // Update parent project's updatedAt
    if (row) {
      const tab = await prisma.tab.findUnique({
        where: { id: row.tabId }
      });
      if (tab) {
        await prisma.project.update({
          where: { id: tab.projectId },
          data: { updatedAt: new Date() }
        });
      }
    }

    return deletedRow;
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

    const result = await Promise.all(updatePromises);

    // Update parent project's updatedAt
    const tab = await prisma.tab.findUnique({
      where: { id: parseInt(tabId) }
    });
    if (tab) {
      await prisma.project.update({
        where: { id: tab.projectId },
        data: { updatedAt: new Date() }
      });
    }

    return result;
  }
}

module.exports = new RowService();
