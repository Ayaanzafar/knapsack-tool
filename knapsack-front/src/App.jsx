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
import { projectAPI, tabAPI } from './services/api';
import { useAuth } from './context/AuthContext';
import {
  loadTabs,
  createTab,
  deleteTab,
  refreshTab,
  switchTab,
  getActiveTab,
  renameTab,
  duplicateTab,
  initializeProject,
  getCurrentProjectId
} from './lib/tabStorageAPI';

export default function App() {
  const { user } = useAuth();
  const isBasicUser = user?.role === 'BASIC';

  // State
  const [tabsData, setTabsData] = useState({ tabs: [], activeTabId: null });
  const [projectName, setProjectName] = useState('Untitled Project');
  const [clientName, setClientName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [tabToClose, setTabToClose] = useState(null);
  const [tabToRename, setTabToRename] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast({ id: Date.now(), message });
    setTimeout(() => setToast(null), 3500);
  };

  const revertTabFromServer = async (tabId) => {
    try {
      const refreshed = await refreshTab(tabsData, tabId);
      setTabsData(refreshed);
    } catch (e) {
      console.error('Failed to refresh tab from server:', e);
    }
  };

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
        setClientName(project.clientName || '');
        setProjectId(project.projectId || '');

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
      const currentProjectId = getCurrentProjectId();
      if (currentProjectId) {
        await projectAPI.update(currentProjectId, { name: newName });
      }
    } catch (err) {
      console.error('Failed to update project name:', err);
      // Don't show error to user, just log it
    }
  };

  // Update client name
  const handleClientNameChange = async (newClientName) => {
    try {
      setClientName(newClientName);
      const currentProjectId = getCurrentProjectId();
      if (currentProjectId) {
        await projectAPI.update(currentProjectId, { clientName: newClientName });
      }
    } catch (err) {
      console.error('Failed to update client name:', err);
    }
  };

  // Update project ID
  const handleProjectIdChange = async (newProjectId) => {
    try {
      setProjectId(newProjectId);
      const currentProjectId = getCurrentProjectId();
      if (currentProjectId) {
        await projectAPI.update(currentProjectId, { projectId: newProjectId });
      }
    } catch (err) {
      console.error('Failed to update project ID:', err);
    }
  };

  // Update active tab's settings
  const updateSettings = async (newSettings) => {
    const currentActiveTab = getActiveTab(tabsData);
    if (!currentActiveTab) return;

    const prevSettings = currentActiveTab.settings;

    // Handle both object and function updaters
    const nextSettings = typeof newSettings === 'function'
      ? newSettings(prevSettings)
      : { ...prevSettings, ...newSettings };

    // BASIC defense-in-depth: do not allow client-side state to persist advanced-only changes.
    const forbiddenFields = [
      'buffer',
      'lengthsInput',
      'costPerMm',
      'costPerJointSet',
      'joinerLength',
      'maxPieces',
      'maxWastePct',
      'alphaJoint',
      'betaSmall',
      'allowUndershootPct',
      'gammaShort'
    ];

    if (isBasicUser) {
      for (const field of forbiddenFields) {
        if (Object.prototype.hasOwnProperty.call(nextSettings, field) && nextSettings[field] !== prevSettings[field]) {
          nextSettings[field] = prevSettings[field];
          showToast(`${field}: Advanced only`);
        }
      }
    }

    // Optimistic UI update
    setTabsData(currentTabsData => ({
      ...currentTabsData,
      tabs: currentTabsData.tabs.map(tab =>
        tab.id === currentActiveTab.id
          ? { ...tab, settings: { ...tab.settings, ...nextSettings } }
          : tab
      )
    }));

    // Send only changed keys
    const patch = {};
    for (const key of Object.keys(nextSettings)) {
      if (nextSettings[key] !== prevSettings[key]) {
        patch[key] = nextSettings[key];
      }
    }

    if (Object.keys(patch).length === 0) return;

    try {
      await tabAPI.update(currentActiveTab.id, { settings: patch });
    } catch (err) {
      console.error('Failed to update settings:', err);

      if (err?.code === 'FORBIDDEN_FIELD') {
        showToast(`${err.field || 'Field'}: ${err.data?.message || err.message}`);
      } else if (err?.code === 'PASSWORD_CHANGE_REQUIRED') {
        showToast('Password change required before continuing.');
      } else {
        showToast(err?.message || 'Failed to save changes.');
      }

      await revertTabFromServer(currentActiveTab.id);
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

  // Apply a setting to all tabs
  const applySettingToAll = async (key, value) => {
    if (!window.confirm(`Are you sure you want to apply this value (${value}) to ALL tabs?`)) return;

    // Optimistic UI update
    setTabsData(currentTabsData => ({
      ...currentTabsData,
      tabs: currentTabsData.tabs.map(tab => ({
        ...tab,
        settings: {
          ...tab.settings,
          [key]: value
        }
      }))
    }));

    // Server update
    try {
      const forbiddenGlobalKeys = new Set(['buffer', 'costPerMm', 'costPerJointSet', 'joinerLength', 'maxPieces']);
      if (isBasicUser && forbiddenGlobalKeys.has(key)) {
        showToast(`${key}: Advanced only`);
        const active = getActiveTab(tabsData);
        if (active?.id) await revertTabFromServer(active.id);
        return;
      }

      // Update all tabs in parallel
      await Promise.all(
        tabsData.tabs.map(tab =>
          tabAPI.update(tab.id, {
            settings: { [key]: value }
          })
        )
      );
    } catch (err) {
      console.error('Failed to apply setting to all tabs:', err);
      showToast(err?.message || 'Failed to save changes to server.');
      const active = getActiveTab(tabsData);
      if (active?.id) await revertTabFromServer(active.id);
    }
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
        settings={activeTab?.settings}
        setSettings={updateSettings}
        projectName={projectName}
        setProjectName={handleProjectNameChange}
        clientName={clientName}
        setClientName={handleClientNameChange}
        projectId={projectId}
        setProjectId={handleProjectIdChange}
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
            applyToAll={applySettingToAll}
          />
        </div>

        {/* Rail Table for active tab */}
        <section>
          <RailTable
            tabId={activeTab?.id}
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

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
            {toast.message}
          </div>
        </div>
      )}

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
