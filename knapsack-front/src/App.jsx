// src/App.jsx
import { useState, useEffect } from 'react';
import Header from './components/Header';
import TabBar from './components/TabBar';
import GlobalInputs from './components/GlobalInputs';
import RailTable from './components/RailTable';
import CreateTabDialog from './components/CreateTabDialog';
import CloseTabConfirmDialog from './components/CloseTabConfirmDialog';
import RenameTabDialog from './components/RenameTabDialog';
import CreateBOMButton from './components/BOM/CreateBOMButton';
import {
  loadTabs,
  saveTabs,
  createTab,
  deleteTab,
  updateTab,
  switchTab,
  getActiveTab,
  renameTab,
  duplicateTab
} from './lib/tabStorage';

export default function App() {
  // Load tabs data
  const [tabsData, setTabsData] = useState(() => loadTabs());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [tabToClose, setTabToClose] = useState(null);
  const [tabToRename, setTabToRename] = useState(null);

  // Project name state
  const [projectName, setProjectName] = useState(() =>
    localStorage.getItem('projectName') || 'Untitled Project'
  );

  // Get active tab
  const activeTab = getActiveTab(tabsData);

  // Save tabs whenever they change
  useEffect(() => {
    saveTabs(tabsData);
  }, [tabsData]);

  // Save project name whenever it changes
  useEffect(() => {
    localStorage.setItem('projectName', projectName);
  }, [projectName]);

  // Tab operations
  const handleTabSwitch = (tabId) => {
    setTabsData(switchTab(tabsData, tabId));
  };

  const handleTabCreate = (tabName) => {
    setTabsData(createTab(tabsData, tabName));
    setShowCreateDialog(false);
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

  const confirmCloseTab = () => {
    setTabsData(deleteTab(tabsData, tabToClose.id));
    setShowCloseConfirm(false);
    setTabToClose(null);
  };

  const handleTabRenameRequest = (tab) => {
    setTabToRename(tab);
    setShowRenameDialog(true);
  };

  const handleTabRename = (newName) => {
    setTabsData(renameTab(tabsData, tabToRename.id, newName));
    setShowRenameDialog(false);
    setTabToRename(null);
  };

  const handleTabDuplicate = (tab) => {
    setTabsData(duplicateTab(tabsData, tab.id));
  };

  // Update active tab's settings
  const updateSettings = (newSettings) => {
    setTabsData(currentTabsData => {
      const currentActiveTab = getActiveTab(currentTabsData);
      if (!currentActiveTab) return currentTabsData;

      // Handle both object and function updaters
      const settingsUpdate = typeof newSettings === 'function'
        ? newSettings(currentActiveTab.settings)
        : { ...currentActiveTab.settings, ...newSettings };

      return updateTab(currentTabsData, currentActiveTab.id, {
        settings: settingsUpdate
      });
    });
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

      return updateTab(currentTabsData, currentActiveTab.id, { rows: rowsUpdate });
    });
  };

  // Update active tab's selected row
  const updateSelectedRowId = (rowId) => {
    setTabsData(currentTabsData => {
      const currentActiveTab = getActiveTab(currentTabsData);
      if (!currentActiveTab) return currentTabsData;

      return updateTab(currentTabsData, currentActiveTab.id, { selectedRowId: rowId });
    });
  };

  const selectedRow = activeTab?.rows.find(r => r.id === activeTab.selectedRowId);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header
        userMode={activeTab?.settings.userMode}
        setUserMode={(mode) => updateSettings({ userMode: mode })}
        settings={activeTab?.settings}
        setSettings={updateSettings}
        projectName={projectName}
        setProjectName={setProjectName}
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
