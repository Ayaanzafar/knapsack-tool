const prisma = require('../prismaClient');

class WalkwayService {
  // Get all walkway rows for a project
  async getRows(projectId) {
    return await prisma.walkwayRow.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { rowNumber: 'asc' }
    });
  }

  // Replace all rows for a project (sync)
  async syncRows(projectId, rows) {
    const pid = parseInt(projectId);

    // Delete existing rows, then create new ones in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.walkwayRow.deleteMany({ where: { projectId: pid } });

      if (rows && rows.length > 0) {
        await tx.walkwayRow.createMany({
          data: rows.map((row, index) => ({
            projectId: pid,
            rowNumber: index + 1,
            type: row.type || 'H',
            length: parseFloat(row.length) || 0,
            qty: parseInt(row.qty) || 1
          }))
        });
      }
    });

    // Return the saved rows
    return await this.getRows(pid);
  }
}

module.exports = new WalkwayService();
