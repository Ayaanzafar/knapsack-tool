// src/lib/tabStorageAPI.js
// API-based tab storage (replaces localStorage)

import { projectAPI, tabAPI, rowAPI } from '../services/api';

export const DEFAULT_TAB = {
  settings: {
    moduleLength: 2278,
    moduleWidth: 1134,
    frameThickness: 35,
    midClamp: 20,
    endClampWidth: 40,
    buffer: 15,
    purlinDistance: 1700,
    railsPerSide: 2,
    lengthsInput: '1595, 1798, 2400, 2750, 3200, 3600, 4800',
    enabledLengths: {
      1595: true,
      1798: true,
      2400: true,
      2750: true,
      3200: true,
      3600: true,
      4800: true
    },
    maxPieces: 3,
    maxWastePct: '',
    alphaJoint: 220,
    betaSmall: 60,
    allowUndershootPct: 0,
    gammaShort: 5,
    costPerMm: '0.1',
    costPerJointSet: '50',
    joinerLength: '100',
    priority: 'cost',
    userMode: 'normal',
    enableSB2: false
  },
  rows: [],
  selectedRowId: null
};

// Store current project ID in memory (will be loaded on app start)
let currentProjectId = null;

// Initialize or get project
export async function initializeProject(projectName = 'Untitled Project') {
  try {
    // Get all projects
    const projects = await projectAPI.getAll();

    if (projects.length > 0) {
      // Use the first project
      currentProjectId = projects[0].id;
      return projects[0];
    }

    // Create new project if none exists
    const newProject = await projectAPI.create({ name: projectName });
    currentProjectId = newProject.id;
    return newProject;
  } catch (error) {
    console.error('Failed to initialize project:', error);
    throw error;
  }
}

// Get current project ID
export function getCurrentProjectId() {
  return currentProjectId;
}

// Load all tabs from API
export async function loadTabs() {
  try {
    // Make sure we have a project
    if (!currentProjectId) {
      await initializeProject();
    }

    // Get all tabs for this project
    const tabs = await tabAPI.getByProjectId(currentProjectId);

    if (tabs.length === 0) {
      // Create a default tab
      const defaultTab = await createTab({ tabs: [], activeTabId: null }, 'Project 1');
      return defaultTab;
    }

    // Convert database format to app format
    const appTabs = tabs.map(tab => convertDBTabToAppTab(tab));

    // Try to restore last active tab from localStorage
    let activeTabId = null;
    const lastActiveTabId = localStorage.getItem(`lastActiveTab_${currentProjectId}`);

    // Check if the last active tab still exists in the loaded tabs
    if (lastActiveTabId && appTabs.find(tab => tab.id === parseInt(lastActiveTabId))) {
      activeTabId = parseInt(lastActiveTabId);
    } else {
      // Fallback to first tab if last active tab doesn't exist
      activeTabId = appTabs[0]?.id || null;
    }

    return {
      tabs: appTabs,
      activeTabId: activeTabId
    };
  } catch (error) {
    console.error('Failed to load tabs:', error);
    // Return default structure on error
    return {
      tabs: [
        {
          id: Date.now(),
          name: 'Project 1',
          createdAt: new Date().toISOString(),
          ...DEFAULT_TAB
        }
      ],
      activeTabId: Date.now()
    };
  }
}

// Convert database tab format to app format
function convertDBTabToAppTab(dbTab) {
  return {
    id: dbTab.id,
    name: dbTab.name,
    createdAt: dbTab.createdAt,
    settings: {
      moduleLength: Number(dbTab.moduleLength),
      moduleWidth: Number(dbTab.moduleWidth),
      frameThickness: Number(dbTab.frameThickness),
      midClamp: Number(dbTab.midClamp),
      endClampWidth: Number(dbTab.endClampWidth),
      buffer: Number(dbTab.buffer),
      purlinDistance: Number(dbTab.purlinDistance),
      railsPerSide: dbTab.railsPerSide,
      lengthsInput: dbTab.lengthsInput || '',
      enabledLengths: dbTab.enabledLengths || {},
      maxPieces: dbTab.maxPieces,
      maxWastePct: dbTab.maxWastePct || '',
      alphaJoint: Number(dbTab.alphaJoint),
      betaSmall: Number(dbTab.betaSmall),
      allowUndershootPct: Number(dbTab.allowUndershootPct),
      gammaShort: Number(dbTab.gammaShort),
      costPerMm: dbTab.costPerMm,
      costPerJointSet: dbTab.costPerJointSet,
      joinerLength: dbTab.joinerLength,
      priority: dbTab.priority,
      userMode: dbTab.userMode,
      enableSB2: dbTab.enableSb2
    },
    rows: (dbTab.rows || []).map(row => ({
      id: row.id,
      modules: row.modules,
      quantity: row.quantity,
      supportBase1: row.supportBase1 != null ? Number(row.supportBase1) : null,
      supportBase2: row.supportBase2 != null ? Number(row.supportBase2) : null
    })),
    selectedRowId: null // This is UI state, not stored in DB
  };
}

// Create new tab
export async function createTab(tabsData, tabName) {
  try {
    const newTab = await tabAPI.create(currentProjectId, {
      name: tabName,
      createdAt: new Date().toISOString(),
      settings: DEFAULT_TAB.settings
    });

    const appTab = convertDBTabToAppTab(newTab);

    // Save new active tab to localStorage
    if (currentProjectId && appTab.id) {
      localStorage.setItem(`lastActiveTab_${currentProjectId}`, appTab.id.toString());
    }

    return {
      ...tabsData,
      tabs: [...tabsData.tabs, appTab],
      activeTabId: appTab.id
    };
  } catch (error) {
    console.error('Failed to create tab:', error);
    throw error;
  }
}

// Delete tab
export async function deleteTab(tabsData, tabId) {
  try {
    await tabAPI.delete(tabId);

    const newTabs = tabsData.tabs.filter(t => t.id !== tabId);

    // If deleted tab was active, switch to first available tab
    let newActiveId = tabsData.activeTabId;
    if (tabId === tabsData.activeTabId && newTabs.length > 0) {
      newActiveId = newTabs[0].id;
    }

    // Save new active tab to localStorage
    if (currentProjectId && newActiveId) {
      localStorage.setItem(`lastActiveTab_${currentProjectId}`, newActiveId.toString());
    }

    return {
      ...tabsData,
      tabs: newTabs,
      activeTabId: newActiveId
    };
  } catch (error) {
    console.error('Failed to delete tab:', error);
    throw error;
  }
}

// Update tab data (settings and/or rows)
export async function updateTab(tabsData, tabId, updates) {
  try {
    // Update settings if provided
    if (updates.settings) {
      await tabAPI.update(tabId, {
        settings: updates.settings
      });
    }

    // Update rows if provided
    if (updates.rows) {
      // This is a full row replacement - need to handle properly
      // For now, we'll just update in memory and handle row updates separately
    }

    // Update local state
    return {
      ...tabsData,
      tabs: tabsData.tabs.map(tab =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      )
    };
  } catch (error) {
    console.error('Failed to update tab:', error);
    throw error;
  }
}

// Switch active tab
export function switchTab(tabsData, tabId) {
  // Save active tab to localStorage for persistence across page refreshes
  if (currentProjectId && tabId) {
    localStorage.setItem(`lastActiveTab_${currentProjectId}`, tabId.toString());
  }

  return {
    ...tabsData,
    activeTabId: tabId
  };
}

// Get active tab
export function getActiveTab(tabsData) {
  return tabsData.tabs.find(t => t.id === tabsData.activeTabId);
}

// Rename tab
export async function renameTab(tabsData, tabId, newName) {
  try {
    await tabAPI.update(tabId, { name: newName });

    return {
      ...tabsData,
      tabs: tabsData.tabs.map(tab =>
        tab.id === tabId ? { ...tab, name: newName } : tab
      )
    };
  } catch (error) {
    console.error('Failed to rename tab:', error);
    throw error;
  }
}

// Duplicate tab
export async function duplicateTab(tabsData, tabId) {
  try {
    const duplicatedTab = await tabAPI.duplicate(tabId);
    const appTab = convertDBTabToAppTab(duplicatedTab);

    // Save new active tab to localStorage
    if (currentProjectId && appTab.id) {
      localStorage.setItem(`lastActiveTab_${currentProjectId}`, appTab.id.toString());
    }

    return {
      ...tabsData,
      tabs: [...tabsData.tabs, appTab],
      activeTabId: appTab.id
    };
  } catch (error) {
    console.error('Failed to duplicate tab:', error);
    throw error;
  }
}

// Row operations (these are new for API integration)
export async function createRow(tabId, rowData) {
  try {
    const maxRowNumber = rowData.currentMaxRowNumber || 0;
    const newRow = await rowAPI.create(tabId, {
      rowNumber: maxRowNumber + 1,
      modules: rowData.modules || 0,
      quantity: rowData.quantity || 1,
      supportBase1: rowData.supportBase1 || 0,
      supportBase2: rowData.supportBase2 || 0
    });
    return newRow;
  } catch (error) {
    console.error('Failed to create row:', error);
    throw error;
  }
}

export async function updateRow(rowId, rowData) {
  try {
    const updatedRow = await rowAPI.update(rowId, rowData);
    return updatedRow;
  } catch (error) {
    console.error('Failed to update row:', error);
    throw error;
  }
}

export async function deleteRow(rowId) {
  try {
    await rowAPI.delete(rowId);
  } catch (error) {
    console.error('Failed to delete row:', error);
    throw error;
  }
}

// Placeholder for saveTabs (not needed with API, but keeping for compatibility)
export function saveTabs(tabsData) {
  // No-op: API calls handle saving automatically
  return tabsData;
}
