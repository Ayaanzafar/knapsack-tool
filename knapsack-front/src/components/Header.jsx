// src/components/Header.jsx
import { useState, useEffect } from 'react';
import { exportToFile, DEFAULT_SETTINGS, DEFAULT_LENGTHS } from '../lib/storage';

export default function Header({ userMode, setUserMode, settings, setSettings, projectName, setProjectName }) {
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(projectName || 'Untitled Project');

  // Sync tempProjectName with projectName
  useEffect(() => {
    setTempProjectName(projectName || 'Untitled Project');
  }, [projectName]);

  const handleSaveProjectName = () => {
    const trimmed = tempProjectName.trim();
    if (trimmed) {
      setProjectName(trimmed);
    } else {
      setTempProjectName(projectName || 'Untitled Project');
    }
    setIsEditingProject(false);
  };

  const handleProjectKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveProjectName();
    } else if (e.key === 'Escape') {
      setTempProjectName(projectName || 'Untitled Project');
      setIsEditingProject(false);
    }
  };

  const handleExport = () => {
    exportToFile(settings);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      setSettings({
        ...DEFAULT_SETTINGS,
        enabledLengths: DEFAULT_LENGTHS.reduce((acc, len) => ({ ...acc, [len]: true }), {})
      });
      // Also clear rows
      localStorage.removeItem('railOptimizer_rows');
      localStorage.removeItem('railOptimizer_selectedRowId');
      window.location.reload();
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        setSettings(prev => ({ ...prev, ...imported }));
        alert('Settings imported successfully!');
      } catch (err) {
        alert('Failed to import settings. Invalid file format.');
        console.error('Import error:', err);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <header className="border-b bg-white">
      {/* <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between"> */}
      <div className="max-w-7xl px-4 py-4 flex ml-50 items-center justify-between">
      {/* <div className="max-w-7xl px-4 py-4 ml-8 flex items-center justify-between"> */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Preliminary Calculation for Long Rail</h1>
          <span className="text-gray-300">|</span>
          {isEditingProject ? (
            <input
              type="text"
              value={tempProjectName}
              onChange={(e) => setTempProjectName(e.target.value)}
              onBlur={handleSaveProjectName}
              onKeyDown={handleProjectKeyDown}
              className="border-b-2 border-purple-500 px-2 py-1 text-sm focus:outline-none w-64"
              autoFocus
              maxLength={255}
            />
          ) : (
            <div
              onClick={() => setIsEditingProject(true)}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
              title="Click to edit project name"
            >
              <span className="text-sm text-gray-600">Project:</span>
              <span className="font-medium text-sm">{projectName}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border p-4 z-50">
                <h3 className="font-semibold mb-3">User Mode</h3>
                <div className="space-y-2 mb-4">
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={userMode === 'normal'}
                      onChange={() => setUserMode('normal')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <div className="font-medium text-sm">Normal User</div>
                      <div className="text-xs text-gray-500">Simple interface</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={userMode === 'advanced'}
                      onChange={() => setUserMode('advanced')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <div className="font-medium text-sm">Advanced User</div>
                      <div className="text-xs text-gray-500">All controls</div>
                    </div>
                  </label>
                </div>

                <h3 className="font-semibold mb-3 pt-3 border-t">Data</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleExport}
                    className="w-full py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                  >
                    Export Settings
                  </button>
                  <label className="block">
                    <span className="w-full py-2 text-sm font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 cursor-pointer block text-center">
                      Import Settings
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleReset}
                    className="w-full py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    Reset Defaults
                  </button>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="mt-3 w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border-t pt-3"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
