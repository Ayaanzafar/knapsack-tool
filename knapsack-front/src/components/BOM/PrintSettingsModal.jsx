// src/components/BOM/PrintSettingsModal.jsx
import { useState, useEffect } from 'react';

export default function PrintSettingsModal({ isOpen, onClose, onPrint }) {
  const [settings, setSettings] = useState({
    includeQuantity: true,
    includeSpare: true,
    includeCosting: true
  });

  // Calculate orientation based on selections
  const getOrientation = () => {
    const { includeQuantity, includeSpare, includeCosting } = settings;
    const count = [includeQuantity, includeSpare, includeCosting].filter(Boolean).length;

    if (count === 3) return 'Landscape';
    if (count === 2 && includeQuantity && includeSpare) return 'Portrait';
    if (count === 1 && includeQuantity) return 'Portrait';
    return 'Portrait';
  };

  const handleCheckboxChange = (field) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePreview = () => {
    // At least one section must be selected
    if (!settings.includeQuantity && !settings.includeSpare && !settings.includeCosting) {
      alert('Please select at least one section to print');
      return;
    }

    // Pass settings to parent for preview
    onPrint(settings, 'preview');
  };

  const handleDirectPrint = () => {
    // At least one section must be selected
    if (!settings.includeQuantity && !settings.includeSpare && !settings.includeCosting) {
      alert('Please select at least one section to print');
      return;
    }

    // Pass settings to parent for direct print
    onPrint(settings, 'direct');
  };

  if (!isOpen) return null;

  const orientation = getOrientation();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Print Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <p className="text-sm text-gray-600 mb-4">
          Select which sections to include in your printout:
        </p>

        {/* Checkboxes */}
        <div className="space-y-4 mb-6">
          {/* Quantity Section */}
          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.includeQuantity}
              onChange={() => handleCheckboxChange('includeQuantity')}
              className="mt-1 h-5 w-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-800">Quantities</div>
              <div className="text-xs text-gray-500 mt-1">
                Item details, building codes, and quantity breakdown per building
              </div>
            </div>
          </label>

          {/* Spare Section */}
          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.includeSpare}
              onChange={() => handleCheckboxChange('includeSpare')}
              className="mt-1 h-5 w-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-800">Spare Quantities</div>
              <div className="text-xs text-gray-500 mt-1">
                Spare percentage, spare quantity, and total quantity columns
              </div>
            </div>
          </label>

          {/* Costing Section */}
          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.includeCosting}
              onChange={() => handleCheckboxChange('includeCosting')}
              className="mt-1 h-5 w-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-800">Costing & Weight</div>
              <div className="text-xs text-gray-500 mt-1">
                Weight per RM, running meters, total weight, rate per piece, and cost
              </div>
            </div>
          </label>
        </div>

        {/* Orientation Indicator */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-800">
              <strong>Print Orientation:</strong> {orientation}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handlePreview}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Preview
          </button>
        </div>

        {/* Optional: Direct Print Button */}
        <button
          onClick={handleDirectPrint}
          className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Print Directly
        </button>
      </div>
    </div>
  );
}
