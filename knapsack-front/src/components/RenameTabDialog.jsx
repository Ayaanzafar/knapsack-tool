// src/components/RenameTabDialog.jsx
import { useState, useEffect } from 'react';

export default function RenameTabDialog({ isOpen, currentName, onClose, onRename, existingTabNames }) {
  const [tabName, setTabName] = useState('');

  // Set current name when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTabName(currentName || '');
    }
  }, [isOpen, currentName]);

  // Check if name is valid (non-empty, unique, and different from current)
  const trimmedName = tabName.trim();
  const isValid =
    trimmedName.length > 0 &&
    trimmedName !== currentName &&
    !existingTabNames.filter(name => name !== currentName).includes(trimmedName);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      onRename(trimmedName);
      setTabName('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && isValid) {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Rename Tab</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New tab name:
            </label>
            <input
              type="text"
              value={tabName}
              onChange={(e) => setTabName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter new name..."
              autoFocus
            />
            {trimmedName && !isValid && (
              <p className="text-red-500 text-xs mt-1">
                {trimmedName === currentName
                  ? 'Name is the same as current'
                  : 'Tab name already exists'}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isValid
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
