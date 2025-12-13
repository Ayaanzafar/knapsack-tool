const prisma = require('../prismaClient');

class TabService {
  // Create a new tab
  async createTab(projectId, data) {
    const { name, createdAt, settings } = data;

    // Get default profile (40mm Long Rail - serial number 26)
    const defaultProfile = await prisma.bomMasterItem.findFirst({
      where: { genericName: '40mm Long Rail' }
    });

    return await prisma.tab.create({
      data: {
        projectId: parseInt(projectId),
        name: name || 'Untitled Tab',
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        longRailProfileSerialNumber: defaultProfile?.serialNumber || '26',
        // Settings
        moduleLength: parseInt(settings?.moduleLength || 2278),
        moduleWidth: parseInt(settings?.moduleWidth || 1134),
        frameThickness: parseInt(settings?.frameThickness || 35),
        midClamp: parseInt(settings?.midClamp || 20),
        endClampWidth: parseInt(settings?.endClampWidth || 40),
        buffer: parseInt(settings?.buffer || 15),
        purlinDistance: parseInt(settings?.purlinDistance || 1700),
        railsPerSide: parseInt(settings?.railsPerSide || 2),
        lengthsInput: settings?.lengthsInput || null,
        enabledLengths: settings?.enabledLengths || null,
        maxPieces: parseInt(settings?.maxPieces || 3),
        maxWastePct: settings?.maxWastePct || null,
        alphaJoint: parseInt(settings?.alphaJoint || 220),
        betaSmall: parseInt(settings?.betaSmall || 60),
        allowUndershootPct: parseFloat(settings?.allowUndershootPct || 0),
        gammaShort: parseInt(settings?.gammaShort || 5),
        costPerMm: settings?.costPerMm || '0.1',
        costPerJointSet: settings?.costPerJointSet || '50',
        joinerLength: settings?.joinerLength || '100',
        priority: settings?.priority || 'cost',
        userMode: settings?.userMode || 'normal',
        // Handle both enableSB2 (frontend) and enableSb2 (backend) for compatibility
        enableSb2: settings?.enableSB2 !== undefined ? settings.enableSB2 : (settings?.enableSb2 || false)
      }
    });
  }

  // Get all tabs for a project
  async getTabsByProjectId(projectId) {
    return await prisma.tab.findMany({
      where: {
        projectId: parseInt(projectId),
        isActive: true
      },
      include: {
        rows: {
          orderBy: { rowNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  // Get single tab by ID
  async getTabById(id) {
    return await prisma.tab.findUnique({
      where: { id: parseInt(id) },
      include: {
        rows: {
          orderBy: { rowNumber: 'asc' }
        }
      }
    });
  }

  // Update tab (name and/or settings)
  async updateTab(id, data) {
    const { name, settings } = data;

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    // Update settings if provided
    if (settings) {
      Object.assign(updateData, {
        moduleLength: settings.moduleLength !== undefined ? parseInt(settings.moduleLength) : undefined,
        moduleWidth: settings.moduleWidth !== undefined ? parseInt(settings.moduleWidth) : undefined,
        frameThickness: settings.frameThickness !== undefined ? parseInt(settings.frameThickness) : undefined,
        midClamp: settings.midClamp !== undefined ? parseInt(settings.midClamp) : undefined,
        endClampWidth: settings.endClampWidth !== undefined ? parseInt(settings.endClampWidth) : undefined,
        buffer: settings.buffer !== undefined ? parseInt(settings.buffer) : undefined,
        purlinDistance: settings.purlinDistance !== undefined ? parseInt(settings.purlinDistance) : undefined,
        railsPerSide: settings.railsPerSide !== undefined ? parseInt(settings.railsPerSide) : undefined,
        lengthsInput: settings.lengthsInput,
        enabledLengths: settings.enabledLengths,
        maxPieces: settings.maxPieces !== undefined ? parseInt(settings.maxPieces) : undefined,
        maxWastePct: settings.maxWastePct,
        alphaJoint: settings.alphaJoint !== undefined ? parseInt(settings.alphaJoint) : undefined,
        betaSmall: settings.betaSmall !== undefined ? parseInt(settings.betaSmall) : undefined,
        allowUndershootPct: settings.allowUndershootPct !== undefined ? parseFloat(settings.allowUndershootPct) : undefined,
        gammaShort: settings.gammaShort !== undefined ? parseInt(settings.gammaShort) : undefined,
        costPerMm: settings.costPerMm,
        costPerJointSet: settings.costPerJointSet,
        joinerLength: settings.joinerLength,
        priority: settings.priority,
        userMode: settings.userMode,
        // Handle both enableSB2 (frontend) and enableSb2 (backend) for compatibility
        enableSb2: settings.enableSB2 !== undefined ? settings.enableSB2 : settings.enableSb2
      });
    }

    return await prisma.tab.update({
      where: { id: parseInt(id) },
      data: updateData
    });
  }

  // Update tab's long rail profile
  async updateTabProfile(id, profileSerialNumber) {
    return await prisma.tab.update({
      where: { id: parseInt(id) },
      data: {
        longRailProfileSerialNumber: profileSerialNumber
      },
      include: {
        rows: {
          orderBy: { rowNumber: 'asc' }
        }
      }
    });
  }

  // Delete tab (hard delete - also deletes all associated rows via cascade)
  async deleteTab(id) {
    return await prisma.tab.delete({
      where: { id: parseInt(id) }
    });
  }

  // Duplicate tab
  async duplicateTab(id) {
    const originalTab = await this.getTabById(id);
    if (!originalTab) {
      throw new Error('Tab not found');
    }

    // Create new tab with copied data
    const { id: _, rows, createdAt: __, isActive: ___, ...tabData } = originalTab;

    const newTab = await prisma.tab.create({
      data: {
        ...tabData,
        name: `${tabData.name} (Copy)`,
        createdAt: new Date()
      }
    });

    // Copy all rows
    if (rows && rows.length > 0) {
      await Promise.all(
        rows.map(row =>
          prisma.tabRow.create({
            data: {
              tabId: newTab.id,
              rowNumber: row.rowNumber,
              modules: row.modules,
              quantity: row.quantity,
              supportBase1: row.supportBase1,
              supportBase2: row.supportBase2
            }
          })
        )
      );
    }

    return await this.getTabById(newTab.id);
  }
}

module.exports = new TabService();
