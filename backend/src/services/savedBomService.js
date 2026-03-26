const prisma = require('../prismaClient');
const bomReconstructionService = require('./bomReconstructionService');

class SavedBomService {
  // Save or update BOM snapshot for a project
  async saveBomSnapshot(projectId, data) {
    const { bomData, userNotes, changeLog, customDefaultNotes, userId } = data;

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
          customDefaultNotes: customDefaultNotes || null,
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
          customDefaultNotes: customDefaultNotes || null,
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

    if (!savedBom) return null;

    // Backward compatibility: some stored snapshots may not contain profilesMap,
    // which BOMPage needs for recalculations on edits.
    const needsReconstruction =
      savedBom?.bomData &&
      !savedBom.bomData?.profilesMap &&
      Array.isArray(savedBom.bomData?.bomItems) &&
      savedBom.bomData.bomItems.length > 0;

    if (!needsReconstruction) return savedBom;

    try {
      const { bomMetadata, bomItems } = await bomReconstructionService.convertToMinimalBOM(savedBom.bomData);
      const reconstructed = await bomReconstructionService.reconstructFullBOM(bomMetadata, bomItems);
      return { ...savedBom, bomData: reconstructed };
    } catch (error) {
      console.warn('[getSavedBomByProjectId] Failed to reconstruct legacy savedBom.bomData; returning stored bomData as-is:', error?.message || error);
      return savedBom;
    }
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

  // Get all saved BOMs with project information (for admin)
  async getAllSavedBoms() {
    return prisma.savedBom.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clientName: true,
            projectId: true,
            longRailVariation: true,
            createdAt: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Get saved BOMs filtered by user roles (for scoped admin view)
  async getSavedBomsByRoles(roles) {
    return prisma.savedBom.findMany({
      where: {
        user: { role: { in: roles } },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clientName: true,
            projectId: true,
            longRailVariation: true,
            createdAt: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

module.exports = new SavedBomService();
