const prisma = require('../prismaClient');
const configService = require('./configService');

class TabService {
  // Create a new tab
  async createTab(projectId, data) {
    const { name, createdAt, settings } = data;

    // Get default profile (40mm Long Rail - sNo 26 historically)
    const [defaultProfile, tabDefs] = await Promise.all([
      prisma.sunrackProfile.findFirst({ where: { genericName: '40mm Long Rail' } }),
      configService.getTabDefaults(),
    ]);

    const tab = await prisma.tab.create({
      data: {
        projectId: parseInt(projectId),
        name: name || 'Untitled Tab',
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        longRailProfileSerialNumber: String(defaultProfile?.sNo ?? 26),
        // Settings — use ?? (nullish) so 0 is valid; fall back to admin-configured defaults
        moduleLength: parseInt(settings?.moduleLength ?? tabDefs.moduleLength),
        moduleWidth: parseInt(settings?.moduleWidth ?? tabDefs.moduleWidth),
        frameThickness: parseInt(settings?.frameThickness ?? tabDefs.frameThickness),
        midClamp: parseInt(settings?.midClamp ?? tabDefs.midClamp),
        endClampWidth: parseInt(settings?.endClampWidth ?? tabDefs.endClampWidth),
        buffer: parseInt(settings?.buffer ?? tabDefs.buffer),
        purlinDistance: parseInt(settings?.purlinDistance ?? tabDefs.purlinDistance),
        seamToSeamDistance: parseInt(settings?.seamToSeamDistance ?? tabDefs.seamToSeamDistance),
        railsPerSide: parseInt(settings?.railsPerSide ?? tabDefs.railsPerSide),
        lengthsInput: settings?.lengthsInput ?? tabDefs.lengthsInput ?? null,
        enabledLengths: settings?.enabledLengths ?? null,
        maxPieces: parseInt(settings?.maxPieces ?? tabDefs.maxPieces),
        maxWastePct: settings?.maxWastePct ?? tabDefs.maxWastePct ?? null,
        alphaJoint: parseInt(settings?.alphaJoint ?? tabDefs.alphaJoint),
        betaSmall: parseInt(settings?.betaSmall ?? tabDefs.betaSmall),
        allowUndershootPct: parseFloat(settings?.allowUndershootPct ?? tabDefs.allowUndershootPct),
        gammaShort: parseInt(settings?.gammaShort ?? tabDefs.gammaShort),
        costPerMm: settings?.costPerMm ?? tabDefs.costPerMm,
        costPerJointSet: settings?.costPerJointSet ?? tabDefs.costPerJointSet,
        joinerLength: settings?.joinerLength ?? tabDefs.joinerLength,
        priority: settings?.priority ?? tabDefs.priority,
        userMode: settings?.userMode || 'normal',
        // Handle both enableSB2 (frontend) and enableSb2 (backend) for compatibility
        enableSb2: settings?.enableSB2 !== undefined ? settings.enableSB2 : (settings?.enableSb2 || false),
      },
    });

    // Update parent project's updatedAt
    await prisma.project.update({
      where: { id: parseInt(projectId) },
      data: { updatedAt: new Date() }
    });

    return tab;
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
        seamToSeamDistance: settings.seamToSeamDistance !== undefined ? parseInt(settings.seamToSeamDistance) : undefined,
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

    const updatedTab = await prisma.tab.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Update parent project's updatedAt
    await prisma.project.update({
      where: { id: updatedTab.projectId },
      data: { updatedAt: new Date() }
    });

    return updatedTab;
  }

  // Update tab's long rail profile
  async updateTabProfile(id, profileSerialNumber) {
    const updatedTab = await prisma.tab.update({
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

    // Update parent project's updatedAt
    await prisma.project.update({
      where: { id: updatedTab.projectId },
      data: { updatedAt: new Date() }
    });

    return updatedTab;
  }

  // Delete tab (hard delete - also deletes all associated rows via cascade)
  async deleteTab(id) {
    // Get tab to find projectId before deleting
    const tab = await prisma.tab.findUnique({
      where: { id: parseInt(id) }
    });

    const deletedTab = await prisma.tab.delete({
      where: { id: parseInt(id) }
    });

    // Update parent project's updatedAt
    if (tab) {
      await prisma.project.update({
        where: { id: tab.projectId },
        data: { updatedAt: new Date() }
      });
    }

    return deletedTab;
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

    // Update parent project's updatedAt
    await prisma.project.update({
      where: { id: newTab.projectId },
      data: { updatedAt: new Date() }
    });

    return await this.getTabById(newTab.id);
  }
}

module.exports = new TabService();
