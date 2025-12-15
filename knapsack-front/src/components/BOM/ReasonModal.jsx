// src/components/BOM/ReasonModal.jsx
import { useState, useEffect } from 'react';

export default function ReasonModal({ isOpen, title, message, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  // Reset reason when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('Please provide a reason');
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
        <div className="bg-purple-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">{title || 'Reason Required'}</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 font-medium">
            {message}
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason: <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              autoFocus
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
