// src/lib/tabStorage.js

const TABS_STORAGE_KEY = 'knapsack_tabs';

// Initialize default tab structure
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
    lengthsInput: '1595, 1798, 2400, 2750, 3600, 4800',
    enabledLengths: {
      1595: true,
      1798: true,
      2400: true,
      2750: true,
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

// Load all tabs from localStorage
export function loadTabs() {
  try {
    const saved = localStorage.getItem(TABS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }

    // MIGRATION: Check for old storage format
    const oldSettings = localStorage.getItem('railOptimizerSettings');
    const oldRows = localStorage.getItem('railOptimizer_rows');
    const oldSelectedRowId = localStorage.getItem('railOptimizer_selectedRowId');

    if (oldSettings || oldRows) {
      // Migrate old data to tab format
      const migratedTab = {
        id: 1,
        name: 'Project 1',
        createdAt: new Date().toISOString(),
        settings: oldSettings ? JSON.parse(oldSettings) : DEFAULT_TAB.settings,
        rows: oldRows ? JSON.parse(oldRows) : [],
        selectedRowId: oldSelectedRowId ? JSON.parse(oldSelectedRowId) : null
      };

      // Clean up old storage
      localStorage.removeItem('railOptimizerSettings');
      localStorage.removeItem('railOptimizer_rows');
      localStorage.removeItem('railOptimizer_selectedRowId');

      return {
        tabs: [migratedTab],
        activeTabId: 1
      };
    }
  } catch (e) {
    console.error('Failed to load tabs:', e);
  }

  // Return default structure with one tab
  return {
    tabs: [
      {
        id: 1,
        name: 'Project 1',
        createdAt: new Date().toISOString(),
        ...DEFAULT_TAB
      }
    ],
    activeTabId: 1
  };
}

// Save all tabs to localStorage
export function saveTabs(tabsData) {
  try {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabsData));
  } catch (e) {
    console.error('Failed to save tabs:', e);
  }
}

// Create new tab
export function createTab(tabsData, tabName) {
  const newId = Math.max(...tabsData.tabs.map(t => t.id), 0) + 1;
  const newTab = {
    id: newId,
    name: tabName,
    createdAt: new Date().toISOString(),
    ...DEFAULT_TAB
  };

  return {
    ...tabsData,
    tabs: [...tabsData.tabs, newTab],
    activeTabId: newId
  };
}

// Delete tab
export function deleteTab(tabsData, tabId) {
  const newTabs = tabsData.tabs.filter(t => t.id !== tabId);

  // If deleted tab was active, switch to first available tab
  let newActiveId = tabsData.activeTabId;
  if (tabId === tabsData.activeTabId && newTabs.length > 0) {
    newActiveId = newTabs[0].id;
  }

  return {
    ...tabsData,
    tabs: newTabs,
    activeTabId: newActiveId
  };
}

// Update tab data
export function updateTab(tabsData, tabId, updates) {
  return {
    ...tabsData,
    tabs: tabsData.tabs.map(tab =>
      tab.id === tabId ? { ...tab, ...updates } : tab
    )
  };
}

// Switch active tab
export function switchTab(tabsData, tabId) {
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
export function renameTab(tabsData, tabId, newName) {
  return {
    ...tabsData,
    tabs: tabsData.tabs.map(tab =>
      tab.id === tabId ? { ...tab, name: newName } : tab
    )
  };
}

// Duplicate tab
export function duplicateTab(tabsData, tabId) {
  const tabToDuplicate = tabsData.tabs.find(t => t.id === tabId);
  if (!tabToDuplicate) return tabsData;

  const newId = Math.max(...tabsData.tabs.map(t => t.id), 0) + 1;

  // Find a unique name for the duplicate
  let duplicateName = `${tabToDuplicate.name} (Copy)`;
  let counter = 2;
  while (tabsData.tabs.some(t => t.name === duplicateName)) {
    duplicateName = `${tabToDuplicate.name} (Copy ${counter})`;
    counter++;
  }

  const duplicatedTab = {
    ...tabToDuplicate,
    id: newId,
    name: duplicateName,
    createdAt: new Date().toISOString()
  };

  return {
    ...tabsData,
    tabs: [...tabsData.tabs, duplicatedTab],
    activeTabId: newId
  };
}
