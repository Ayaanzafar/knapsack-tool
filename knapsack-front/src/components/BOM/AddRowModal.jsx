// src/components/BOM/AddRowModal.jsx
import { useState, useEffect } from 'react';
import ComboBox from '../ComboBox'; // NEW: Import ComboBox

export default function AddRowModal({ isOpen, afterRowNumber, profiles, tabs, onClose, onAdd }) {
  const [selectedProfile, setSelectedProfile] = useState('');
  const [quantities, setQuantities] = useState({});
  const [customLength, setCustomLength] = useState('');
  const [reason, setReason] = useState('');
  const [standardLength, setStandardLength] = useState('');
  const [costPerPiece, setCostPerPiece] = useState('');
  const [calculationMethod, setCalculationMethod] = useState('standard_length'); // or 'cost_per_piece'

  // Initialize quantities when tabs change
  useEffect(() => {
    const initialQuantities = {};
    tabs.forEach(tab => {
      initialQuantities[tab] = 0;
    });
    setQuantities(initialQuantities);
  }, [tabs]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProfile('');
      setCustomLength('');
      setReason('');
      setStandardLength('');
      setCostPerPiece('');
      setCalculationMethod('standard_length');
      const initialQuantities = {};
      tabs.forEach(tab => {
        initialQuantities[tab] = 0;
      });
      setQuantities(initialQuantities);
    }
  }, [isOpen, tabs]);

  const handleQuantityChange = (tabName, value) => {
    setQuantities({
      ...quantities,
      [tabName]: parseInt(value) || 0
    });
  };

  const handleAdd = () => {
    if (!selectedProfile) {
      alert('Please select a profile');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for adding this item');
      return;
    }

    const totalQty = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    if (totalQty === 0) {
      alert('Please enter at least one quantity');
      return;
    }

    // NEW VALIDATION: Check calculation method requirements
    if (calculationMethod === 'standard_length') {
      if (!standardLength || parseFloat(standardLength) <= 0) {
        alert('Please enter a valid Standard Length for weight-based calculation');
        return;
      }
    }
    else if (calculationMethod === 'cost_per_piece') {
      if (!costPerPiece || parseFloat(costPerPiece) <= 0) {
        alert('Please enter a valid Cost Per Piece');
        return;
      }
    }

    onAdd({
      profileSerialNumber: selectedProfile,
      quantities: quantities,
      customLength: customLength ? parseInt(customLength) : null,
      standardLength: standardLength ? parseInt(standardLength) : null,
      costPerPiece: costPerPiece ? parseFloat(costPerPiece) : null,
      calculationMethod: calculationMethod,
      reason: reason
    });

    onClose();
  };

  if (!isOpen) return null;

  // Prepare options for ComboBox
  const profileOptions = profiles.map(profile => ({
    value: profile.serialNumber,
    label: `${profile.genericName} (${profile.preferredRmCode || profile.sunrackCode || 'No Code'})`
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">
            Add New Item {afterRowNumber !== undefined && `After Row ${afterRowNumber}`}
          </h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Select Profile using ComboBox */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Profile: <span className="text-red-500">*</span>
            </label>
            <ComboBox
              options={profileOptions}
              value={selectedProfile}
              onChange={(value) => setSelectedProfile(value)}
              placeholder="-- Choose a profile --"
            />
          </div>

          {/* Custom Length */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Custom Length (mm): <span className="text-gray-500 text-xs">(Optional - leave empty for standard length)</span>
            </label>
            <input
              type="number"
              value={customLength}
              onChange={(e) => setCustomLength(e.target.value)}
              placeholder="e.g., 5500"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Calculation Method Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Cost Calculation Method: <span className="text-red-500">*</span>
            </label>

            <div className="space-y-4">
              {/* Radio Button 1: Standard Length */}
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  id="calc-standard-length"
                  name="calculationMethod"
                  value="standard_length"
                  checked={calculationMethod === 'standard_length'}
                  onChange={(e) => setCalculationMethod(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="calc-standard-length" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Calculate based on Standard Length (Weight-based)
                  </label>
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">
                      Standard Length (mm):
                    </label>
                    <input
                      type="number"
                      value={standardLength}
                      onChange={(e) => setStandardLength(e.target.value)}
                      placeholder="e.g., 6000"
                      disabled={calculationMethod !== 'standard_length'}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        calculationMethod !== 'standard_length' ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cost = (Length/1000) × Quantity × Weight/RM × Aluminum Rate
                    </p>
                  </div>
                </div>
              </div>

              {/* Radio Button 2: Cost Per Piece */}
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  id="calc-cost-per-piece"
                  name="calculationMethod"
                  value="cost_per_piece"
                  checked={calculationMethod === 'cost_per_piece'}
                  onChange={(e) => setCalculationMethod(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="calc-cost-per-piece" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Calculate based on Cost Per Piece (Direct cost)
                  </label>
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">
                      Cost Per Piece (₹):
                    </label>
                    <input
                      type="number"
                      value={costPerPiece}
                      onChange={(e) => setCostPerPiece(e.target.value)}
                      placeholder="e.g., 25.50"
                      step="0.01"
                      disabled={calculationMethod !== 'cost_per_piece'}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        calculationMethod !== 'cost_per_piece' ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cost = Cost Per Piece × Quantity
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quantities per Building */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Quantities per Building: <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              {tabs.map(tabName => (
                <div key={tabName} className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 w-32">
                    {tabName}:
                  </label>
                  <input
                    type="number"
                    value={quantities[tabName] || 0}
                    onChange={(e) => handleQuantityChange(tabName, e.target.value)}
                    min="0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Total: {Object.values(quantities).reduce((sum, qty) => sum + qty, 0)} items
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for adding this item: <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Additional spares required for this site"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}
