// src/components/BOM/DeleteRowModal.jsx
import { useState, useEffect } from 'react';

export default function DeleteRowModal({ isOpen, itemDescription, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  // Reset reason when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('Please provide a reason for deleting this item');
      return;
    }
    onConfirm(reason);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Item
          </h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <span className="font-bold">"{itemDescription}"</span>?
          </p>
          <p className="text-sm text-red-500 font-semibold">
            This action cannot be undone.
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for deletion: <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Duplicate entry, Not required for this site..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-sm"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}
