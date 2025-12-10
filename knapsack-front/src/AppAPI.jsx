// src/AppAPI.jsx - API-integrated version
import { useState, useEffect } from 'react';
import Header from './components/Header';
import TabBar from './components/TabBar';
import GlobalInputs from './components/GlobalInputs';
import RailTable from './components/RailTable';
import CreateTabDialog from './components/CreateTabDialog';
import CloseTabConfirmDialog from './components/CloseTabConfirmDialog';
import RenameTabDialog from './components/RenameTabDialog';
import CreateBOMButton from './components/BOM/CreateBOMButton';
import { projectAPI } from './services/api';
import {
  loadTabs,
  createTab,
  deleteTab,
  updateTab,
  switchTab,
  getActiveTab,
  renameTab,
  duplicateTab,
  initializeProject,
  getCurrentProjectId
} from './lib/tabStorageAPI';

export default function App() {
  // State
  const [tabsData, setTabsData] = useState({ tabs: [], activeTabId: null });
  const [projectName, setProjectName] = useState('Untitled Project');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [tabToClose, setTabToClose] = useState(null);
  const [tabToRename, setTabToRename] = useState(null);

  // Get active tab
  const activeTab = getActiveTab(tabsData);

  // Initialize: Load project and tabs
  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        setError(null);

        // Initialize project (create or get existing)
        const project = await initializeProject();
        setProjectName(project.name);

        // Load tabs
        const loadedTabsData = await loadTabs();
        setTabsData(loadedTabsData);
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError(err.message || 'Failed to load data from server');
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  // Tab operations
  const handleTabSwitch = (tabId) => {
    setTabsData(switchTab(tabsData, tabId));
  };

  const handleTabCreate = async (tabName) => {
    try {
      const newTabsData = await createTab(tabsData, tabName);
      setTabsData(newTabsData);
      setShowCreateDialog(false);
    } catch (err) {
      console.error('Failed to create tab:', err);
      alert('Failed to create tab: ' + err.message);
    }
  };

  const handleTabCloseRequest = (tab) => {
    // Don't allow closing if only 1 tab
    if (tabsData.tabs.length === 1) {
      alert('Cannot close the last tab!');
      return;
    }
    setTabToClose(tab);
    setShowCloseConfirm(true);
  };

  const confirmCloseTab = async () => {
    try {
      const newTabsData = await deleteTab(tabsData, tabToClose.id);
      setTabsData(newTabsData);
      setShowCloseConfirm(false);
      setTabToClose(null);
    } catch (err) {
      console.error('Failed to delete tab:', err);
      alert('Failed to delete tab: ' + err.message);
    }
  };

  const handleTabRenameRequest = (tab) => {
    setTabToRename(tab);
    setShowRenameDialog(true);
  };

  const handleTabRename = async (newName) => {
    try {
      const newTabsData = await renameTab(tabsData, tabToRename.id, newName);
      setTabsData(newTabsData);
      setShowRenameDialog(false);
      setTabToRename(null);
    } catch (err) {
      console.error('Failed to rename tab:', err);
      alert('Failed to rename tab: ' + err.message);
    }
  };

  const handleTabDuplicate = async (tab) => {
    try {
      const newTabsData = await duplicateTab(tabsData, tab.id);
      setTabsData(newTabsData);
    } catch (err) {
      console.error('Failed to duplicate tab:', err);
      alert('Failed to duplicate tab: ' + err.message);
    }
  };

  // Update project name
  const handleProjectNameChange = async (newName) => {
    try {
      setProjectName(newName);
      const projectId = getCurrentProjectId();
      if (projectId) {
        await projectAPI.update(projectId, { name: newName });
      }
    } catch (err) {
      console.error('Failed to update project name:', err);
      // Don't show error to user, just log it
    }
  };

  // Update active tab's settings
  const updateSettings = async (newSettings) => {
    const currentActiveTab = getActiveTab(tabsData);
    if (!currentActiveTab) return;

    // Handle both object and function updaters
    const settingsUpdate = typeof newSettings === 'function'
      ? newSettings(currentActiveTab.settings)
      : { ...currentActiveTab.settings, ...newSettings };

    try {
      const newTabsData = await updateTab(tabsData, currentActiveTab.id, {
        settings: settingsUpdate
      });
      setTabsData(newTabsData);
    } catch (err) {
      console.error('Failed to update settings:', err);
      // Update local state even if API call fails (optimistic update)
      setTabsData(currentTabsData => {
        const currentActiveTab = getActiveTab(currentTabsData);
        if (!currentActiveTab) return currentTabsData;

        return updateTab(currentTabsData, currentActiveTab.id, {
          settings: settingsUpdate
        });
      });
    }
  };

  // Update active tab's rows
  const updateRows = (newRows) => {
    setTabsData(currentTabsData => {
      const currentActiveTab = getActiveTab(currentTabsData);
      if (!currentActiveTab) return currentTabsData;

      // Handle both direct values and function updaters
      const rowsUpdate = typeof newRows === 'function'
        ? newRows(currentActiveTab.rows)
        : newRows;

      // Update local state immediately (optimistic update)
      // Row-level API calls will be handled by RailTable component
      return {
        ...currentTabsData,
        tabs: currentTabsData.tabs.map(tab =>
          tab.id === currentActiveTab.id ? { ...tab, rows: rowsUpdate } : tab
        )
      };
    });
  };

  // Update active tab's selected row
  const updateSelectedRowId = (rowId) => {
    setTabsData(currentTabsData => {
      const currentActiveTab = getActiveTab(currentTabsData);
      if (!currentActiveTab) return currentTabsData;

      // This is UI-only state, no need to save to server
      return {
        ...currentTabsData,
        tabs: currentTabsData.tabs.map(tab =>
          tab.id === currentActiveTab.id ? { ...tab, selectedRowId: rowId } : tab
        )
      };
    });
  };

  const selectedRow = activeTab?.rows.find(r => r.id === activeTab.selectedRowId);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-600 text-5xl mb-4">⚠</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header
        userMode={activeTab?.settings.userMode}
        setUserMode={(mode) => updateSettings({ userMode: mode })}
        settings={activeTab?.settings}
        setSettings={updateSettings}
        projectName={projectName}
        setProjectName={handleProjectNameChange}
      />

      {/* Tab Bar */}
      <TabBar
        tabs={tabsData.tabs}
        activeTabId={tabsData.activeTabId}
        onTabSwitch={handleTabSwitch}
        onTabCreate={() => setShowCreateDialog(true)}
        onTabClose={handleTabCloseRequest}
        onTabRename={handleTabRenameRequest}
        onTabDuplicate={handleTabDuplicate}
      />

      <main className="mx-auto max-w-[80%] px-4 py-6">
        {/* Global Inputs for active tab */}
        <div className="mb-6">
          <GlobalInputs
            settings={activeTab?.settings}
            setSettings={updateSettings}
          />
        </div>

        {/* Rail Table for active tab */}
        <section>
          <RailTable
            rows={activeTab?.rows || []}
            setRows={updateRows}
            selectedRowId={activeTab?.selectedRowId}
            setSelectedRowId={updateSelectedRowId}
            settings={activeTab?.settings}
            setSettings={updateSettings}
            selectedRow={selectedRow}
          />
        </section>

        {/* Create BOM Button */}
        <CreateBOMButton
          tabsData={tabsData}
          projectName={projectName}
        />
      </main>

      {/* Dialogs */}
      <CreateTabDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleTabCreate}
        existingTabNames={tabsData.tabs.map(t => t.name)}
      />

      <CloseTabConfirmDialog
        isOpen={showCloseConfirm}
        tabName={tabToClose?.name}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={confirmCloseTab}
      />

      <RenameTabDialog
        isOpen={showRenameDialog}
        currentName={tabToRename?.name}
        onClose={() => setShowRenameDialog(false)}
        onRename={handleTabRename}
        existingTabNames={tabsData.tabs.map(t => t.name)}
      />

      <footer className="py-8 text-center text-xs text-gray-500">
        Rail Cut Optimizer - Built for solar rail standardization
      </footer>
    </div>
  );
}
