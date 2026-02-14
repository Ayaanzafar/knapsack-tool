const crypto = require('crypto');
const prisma = require('../prismaClient');

class BomShareService {
  /**
   * Generate unique share token
   */
  generateShareToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create ONE share link for multiple users
   * @param {number} parentBomIdOrProjectId - ID of the BOM or Project being shared
   * @param {number} sharedByUserId - ID of user creating the share
   * @param {number[]} sharedWithUserIds - Array of user IDs to share with
   * @param {string|null} message - Optional message for recipients
   * @param {boolean} isProjectId - If true, treat first param as projectId
   * @returns {Promise<Object>} - Single share object with one link for all users
   */
  async createShares(parentBomIdOrProjectId, sharedByUserId, sharedWithUserIds, message = null, isProjectId = false) {
    // Lookup BOM by projectId or bomId
    let parentBom;
    if (isProjectId) {
      parentBom = await prisma.savedBom.findUnique({
        where: { projectId: parseInt(parentBomIdOrProjectId) }
      });
      if (!parentBom) {
        throw new Error('No saved BOM found for this project. Please save the BOM first.');
      }
    } else {
      parentBom = await prisma.savedBom.findUnique({
        where: { id: parseInt(parentBomIdOrProjectId) }
      });
      if (!parentBom) {
        throw new Error('BOM not found');
      }
    }

    const parentBomId = parentBom.id;

    // Generate ONE token for all users
    const shareToken = this.generateShareToken();

    // Create ONE share record
    const share = await prisma.bomShare.create({
      data: {
        shareToken,
        parentBomId: parentBomId,
        sharedByUserId: parseInt(sharedByUserId),
        message,
        sharedWithUsers: {
          create: sharedWithUserIds.map(userId => ({
            userId: parseInt(userId)
          }))
        }
      },
      include: {
        sharedWithUsers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true
              }
            }
          }
        }
      }
    });

    // Return single share object with list of users
    return {
      shareId: share.id,
      shareToken: share.shareToken,
      shareLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/bom/shared/${shareToken}`,
      message: share.message,
      sharedWithUsers: share.sharedWithUsers.map(su => su.user),
      createdAt: share.createdAt
    };
  }

  /**
   * Access shared BOM via token
   * - Check if user has permission (sharer or recipient)
   * - Create copy if first access by recipient
   * - Return original BOM if accessed by sharer
   * @param {string} shareToken - The share token
   * @param {number} currentUserId - ID of user accessing the share
   * @returns {Promise<Object>} - Share info and BOM ID
   */
  async accessSharedBom(shareToken, currentUserId) {
    // Find share record with all recipients
    const share = await prisma.bomShare.findUnique({
      where: { shareToken },
      include: {
        parentBom: {
          include: {
            project: true
          }
        },
        sharedBy: {
          select: { id: true, username: true }
        },
        sharedWithUsers: {
          include: {
            user: {
              select: { id: true, username: true, role: true }
            },
            createdBom: {
              include: {
                project: true
              }
            }
          }
        }
      }
    });

    if (!share) {
      throw new Error('Share link not found or expired');
    }

    const currentUserIdInt = parseInt(currentUserId);

    // Check if current user is the sharer (person who created the share)
    if (share.sharedByUserId === currentUserIdInt) {
      // Sharer is viewing the link - give them access to their original BOM
      return {
        shareInfo: {
          parentBomId: share.parentBomId,
          sharedBy: share.sharedBy,
          sharedWithUsers: share.sharedWithUsers.map(su => su.user),
          message: share.message,
          createdAt: share.createdAt
        },
        bomId: share.parentBomId,
        projectId: share.parentBom.projectId,
        isSharer: true,
        isFirstAccess: false
      };
    }

    // Check if current user is one of the intended recipients
    const shareUser = share.sharedWithUsers.find(su => su.userId === currentUserIdInt);

    if (!shareUser) {
      throw new Error('Access denied: This BOM was not shared with you');
    }

    // If already accessed by this user, return their existing copy
    if (shareUser.isAccessed && shareUser.createdBomId) {
      return {
        shareInfo: {
          parentBomId: share.parentBomId,
          sharedBy: share.sharedBy,
          message: share.message,
          createdAt: share.createdAt
        },
        bomId: shareUser.createdBomId,
        projectId: shareUser.createdBom.projectId,
        isFirstAccess: false
      };
    }

    // First access by this user - create a copy of the BOM
    const { copiedBom, newProject } = await this.copyBomForUser(
      share.parentBomId,
      currentUserId,
      share.sharedByUserId,
      shareToken
    );

    // Update share user record (not the main share record)
    await prisma.bomShareUser.update({
      where: { id: shareUser.id },
      data: {
        isAccessed: true,
        accessedAt: new Date(),
        createdBomId: copiedBom.id
      }
    });

    return {
      shareInfo: {
        parentBomId: share.parentBomId,
        sharedBy: share.sharedBy,
        message: share.message,
        createdAt: share.createdAt
      },
      bomId: copiedBom.id,
      projectId: newProject.id,
      isFirstAccess: true
    };
  }

  /**
   * Create a copy of BOM for the recipient
   * This creates a new project and copies the BOM to it
   * @param {number} parentBomId - ID of BOM to copy
   * @param {number} recipientUserId - ID of user receiving the copy
   * @param {number} sharedByUserId - ID of user who shared
   * @param {string} shareToken - The share token
   * @returns {Promise<Object>} - Copied BOM and new project
   */
  async copyBomForUser(parentBomId, recipientUserId, sharedByUserId, shareToken) {
    const parentBom = await prisma.savedBom.findUnique({
      where: { id: parseInt(parentBomId) },
      include: {
        project: {
          include: {
            tabs: {
              include: {
                rows: true
              }
            }
          }
        }
      }
    });

    if (!parentBom) {
      throw new Error('Parent BOM not found');
    }

    // Get sharer's username for project naming
    const sharer = await prisma.user.findUnique({
      where: { id: parseInt(sharedByUserId) },
      select: { username: true }
    });

    // Create a new project for the recipient (copy of parent project)
    const newProject = await prisma.project.create({
      data: {
        name: `${parentBom.project.name} (Shared by ${sharer.username})`,
        clientName: parentBom.project.clientName,
        projectId: parentBom.project.projectId,
        longRailVariation: parentBom.project.longRailVariation,
        moduleWp: parentBom.project.moduleWp,
        userId: parseInt(recipientUserId),
        isActive: true
      }
    });

    // Copy tabs and rows
    for (const tab of parentBom.project.tabs) {
      const newTab = await prisma.tab.create({
        data: {
          projectId: newProject.id,
          name: tab.name,
          moduleLength: tab.moduleLength,
          moduleWidth: tab.moduleWidth,
          frameThickness: tab.frameThickness,
          midClamp: tab.midClamp,
          endClampWidth: tab.endClampWidth,
          buffer: tab.buffer,
          purlinDistance: tab.purlinDistance,
          seamToSeamDistance: tab.seamToSeamDistance,
          maxSupportDistance: tab.maxSupportDistance,
          railsPerSide: tab.railsPerSide,
          lengthsInput: tab.lengthsInput,
          enabledLengths: tab.enabledLengths,
          maxPieces: tab.maxPieces,
          maxWastePct: tab.maxWastePct,
          alphaJoint: tab.alphaJoint,
          betaSmall: tab.betaSmall,
          allowUndershootPct: tab.allowUndershootPct,
          gammaShort: tab.gammaShort,
          costPerMm: tab.costPerMm,
          costPerJointSet: tab.costPerJointSet,
          joinerLength: tab.joinerLength,
          priority: tab.priority,
          userMode: tab.userMode,
          enableSb2: tab.enableSb2,
          longRailProfileSerialNumber: tab.longRailProfileSerialNumber,
          isActive: tab.isActive
        }
      });

      // Copy rows
      for (const row of tab.rows) {
        await prisma.tabRow.create({
          data: {
            tabId: newTab.id,
            rowNumber: row.rowNumber,
            modules: row.modules,
            quantity: row.quantity,
            supportBase1: row.supportBase1,
            supportBase2: row.supportBase2
          }
        });
      }
    }

    // Create a copy of the BOM
    const copiedBom = await prisma.savedBom.create({
      data: {
        projectId: newProject.id,
        bomData: parentBom.bomData,
        userNotes: parentBom.userNotes,
        changeLog: parentBom.changeLog || [],
        customDefaultNotes: parentBom.customDefaultNotes,
        createdBy: parseInt(recipientUserId),
        parentBomId: parseInt(parentBomId),
        sharedByUserId: parseInt(sharedByUserId),
        isSharedCopy: true,
        createdFromShareToken: shareToken
      }
    });

    return { copiedBom, newProject };
  }

  /**
   * Get share history for a BOM
   * @param {number} bomId - ID of the BOM
   * @returns {Promise<Array>} - Array of shares with their recipients
   */
  async getShareHistory(bomId) {
    const shares = await prisma.bomShare.findMany({
      where: { parentBomId: parseInt(bomId) },
      include: {
        sharedWithUsers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true
              }
            },
            createdBom: {
              select: {
                id: true,
                projectId: true
              }
            }
          }
        },
        sharedBy: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return shares;
  }

  /**
   * Get BOMs shared with a user
   * @param {number} userId - ID of the user
   * @returns {Promise<Array>} - Array of shares received by the user
   */
  async getSharedWithUser(userId) {
    const shareUsers = await prisma.bomShareUser.findMany({
      where: {
        userId: parseInt(userId)
      },
      include: {
        bomShare: {
          include: {
            parentBom: {
              select: {
                id: true,
                projectId: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                    clientName: true,
                    projectId: true
                  }
                }
              }
            },
            sharedBy: {
              select: {
                id: true,
                username: true
              }
            }
          }
        },
        createdBom: {
          select: {
            id: true,
            projectId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to match the old format
    return shareUsers.map(su => ({
      id: su.bomShare.id,
      shareToken: su.bomShare.shareToken,
      parentBomId: su.bomShare.parentBomId,
      message: su.bomShare.message,
      createdAt: su.bomShare.createdAt,
      isAccessed: su.isAccessed,
      accessedAt: su.accessedAt,
      parentBom: su.bomShare.parentBom,
      createdBom: su.createdBom,
      sharedBy: su.bomShare.sharedBy
    }));
  }

  /**
   * Get count of new (unaccessed) shares for a user
   * @param {number} userId - ID of the user
   * @returns {Promise<number>} - Count of new shares
   */
  async getNewSharesCount(userId) {
    const count = await prisma.bomShareUser.count({
      where: {
        userId: parseInt(userId),
        isAccessed: false
      }
    });

    return count;
  }

  /**
   * Get public preview of a shared BOM (NO authentication required)
   * Used to show share info on login page
   * @param {string} shareToken - The share token
   * @returns {Promise<Object>} - Public share preview info
   */
  async getSharePreview(shareToken) {
    const share = await prisma.bomShare.findUnique({
      where: { shareToken },
      include: {
        parentBom: {
          include: {
            project: {
              select: {
                name: true,
                clientName: true,
                projectId: true
              }
            }
          }
        },
        sharedBy: {
          select: {
            username: true,
            role: true
          }
        },
        sharedWithUsers: {
          include: {
            user: {
              select: {
                username: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!share) {
      throw new Error('Share link not found or expired');
    }

    return {
      sharedBy: {
        username: share.sharedBy.username,
        role: share.sharedBy.role
      },
      sharedWithUsers: share.sharedWithUsers.map(su => ({
        username: su.user.username,
        role: su.user.role
      })),
      projectName: share.parentBom.project.name,
      clientName: share.parentBom.project.clientName,
      projectId: share.parentBom.project.projectId,
      message: share.message,
      sharedAt: share.createdAt
    };
  }
}

module.exports = new BomShareService();
