// src/components/CreateTabDialog.jsx
import { useState, useEffect } from 'react';

export default function CreateTabDialog({ isOpen, onClose, onCreate, existingTabNames }) {
  const [tabName, setTabName] = useState('');

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTabName('');
    }
  }, [isOpen]);

  // Check if name is valid (non-empty and unique)
  const trimmedName = tabName.trim();
  const isValid = trimmedName.length > 0 && !existingTabNames.includes(trimmedName);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      onCreate(trimmedName);
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Create New Tab</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter tab name:
            </label>
            <input
              type="text"
              value={tabName}
              onChange={(e) => setTabName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Project 2, Analysis, Site A..."
              autoFocus
            />
            {trimmedName && !isValid && existingTabNames.includes(trimmedName) && (
              <p className="text-red-500 text-xs mt-1">Tab name already exists</p>
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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
