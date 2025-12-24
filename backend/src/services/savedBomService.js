const prisma = require('../prismaClient');

class SavedBomService {
  // Save or update BOM snapshot for a project
  async saveBomSnapshot(projectId, data) {
    const { bomData, userNotes, changeLog, userId } = data;

    // Check if saved BOM already exists for this project
    const existing = await prisma.savedBom.findUnique({
      where: { projectId: parseInt(projectId) }
    });

    if (existing) {
      // Update existing saved BOM
      return await prisma.savedBom.update({
        where: { projectId: parseInt(projectId) },
        data: {
          bomData,
          userNotes: userNotes || null,
          changeLog: changeLog || null,
          createdBy: userId,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new saved BOM
      return await prisma.savedBom.create({
        data: {
          projectId: parseInt(projectId),
          bomData,
          userNotes: userNotes || null,
          changeLog: changeLog || null,
          createdBy: userId
        }
      });
    }
  }

  // Get saved BOM for a project
  async getSavedBomByProjectId(projectId) {
    const savedBom = await prisma.savedBom.findUnique({
      where: { projectId: parseInt(projectId) },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    return savedBom;
  }

  // Check if saved BOM exists for a project
  async savedBomExists(projectId) {
    const count = await prisma.savedBom.count({
      where: { projectId: parseInt(projectId) }
    });
    return count > 0;
  }

  // Delete saved BOM for a project
  async deleteSavedBom(projectId) {
    const existing = await prisma.savedBom.findUnique({
      where: { projectId: parseInt(projectId) }
    });

    if (!existing) {
      return null;
    }

    return await prisma.savedBom.delete({
      where: { projectId: parseInt(projectId) }
    });
  }
}

module.exports = new SavedBomService();
