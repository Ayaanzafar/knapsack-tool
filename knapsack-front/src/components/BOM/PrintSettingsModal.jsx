// src/components/BOM/PrintSettingsModal.jsx
import { useState, useEffect } from 'react';
import NotesSection from './NotesSection';

export default function PrintSettingsModal({ isOpen, onClose, onPrint, bomData, aluminumRate, sparePercentage, moduleWp, changeLog, userNotes }) {
  const [settings, setSettings] = useState({
    includeQuantity: true,
    includeSpare: true,
    includeCosting: true,
    includeDisclaimer: false
  });
  const [scale, setScale] = useState(70); // Scale for preview in modal - default to landscape optimized

  // Calculate orientation based on selections
  const getOrientation = () => {
    const { includeQuantity, includeSpare, includeCosting } = settings;
    const count = [includeQuantity, includeSpare, includeCosting].filter(Boolean).length;

    if (count === 3) return 'landscape';
    if (count === 2 && includeQuantity && includeSpare) return 'portrait';
    if (count === 1 && includeQuantity) return 'portrait';
    return 'portrait';
  };

  const handleCheckboxChange = (field) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [field]: !prev[field]
      };

      // Auto-adjust scale based on orientation
      const { includeQuantity, includeSpare, includeCosting } = newSettings;
      const count = [includeQuantity, includeSpare, includeCosting].filter(Boolean).length;

      if (count === 3) {
        // Landscape mode - use smaller scale to fit
        setScale(70);
      } else {
        // Portrait mode - use larger scale
        setScale(70);
      }

      return newSettings;
    });
  };

  // Format numbers in Indian style
  const formatIndianNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return '0';
    if (typeof value !== 'number') return '0';

    const fixedValue = value.toFixed(decimals);
    const [integerPart, decimalPart] = fixedValue.split('.');

    let lastThree = integerPart.slice(-3);
    let otherNumbers = integerPart.slice(0, -3);

    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }

    let formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

    return decimalPart ? `${formatted}.${decimalPart}` : formatted;
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return '-';
    return typeof value === 'number' ? value.toFixed(decimals) : '-';
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
  const { includeQuantity, includeSpare, includeCosting } = settings;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Print Settings & Preview</h2>
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

        {/* Main Content - Split Screen */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Settings */}
          <div className="w-96 p-6 border-r border-gray-200 flex flex-col overflow-y-auto">
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

              {/* Disclaimer/Changelog Section */}
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.includeDisclaimer}
                  onChange={() => handleCheckboxChange('includeDisclaimer')}
                  className="mt-1 h-5 w-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    Disclaimer/Changelog
                    {changeLog && changeLog.length > 0 && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                        {changeLog.length} changes
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Show change history and modifications made to this BOM
                  </div>
                </div>
              </label>
            </div>

            {/* Orientation Indicator */}
            <div className={`mb-6 p-3 border rounded-lg ${orientation === 'landscape'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-green-50 border-green-200'
              }`}>
              <div className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${orientation === 'landscape' ? 'text-blue-600' : 'text-green-600'
                  }`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className={orientation === 'landscape' ? 'text-blue-800' : 'text-green-800'}>
                  <strong>Print Orientation:</strong> {orientation.toUpperCase()}
                  {orientation === 'landscape' && ' (Wide format)'}
                </span>
              </div>
            </div>

            {/* Scale Control */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preview Scale: {scale}%
              </label>
              <p className="text-xs text-gray-500 mb-2">Auto-adjusts when changing orientation</p>
              <input
                type="range"
                min="30"
                max="100"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setScale(40)}
                  className={`flex-1 px-2 py-1 text-xs rounded ${scale === 40 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  40%
                </button>
                <button
                  onClick={() => setScale(50)}
                  className={`flex-1 px-2 py-1 text-xs rounded ${scale === 50 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  50%
                </button>
                <button
                  onClick={() => setScale(70)}
                  className={`flex-1 px-2 py-1 text-xs rounded ${scale === 70 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  70%
                </button>
                <button
                  onClick={() => setScale(90)}
                  className={`flex-1 px-2 py-1 text-xs rounded ${scale === 90 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  90%
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto space-y-3">
              {/* <button
                onClick={() => onPrint(settings, 'pdf')}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" />
                </svg>
                Export PDF
              </button> */}

              <button
                onClick={handleDirectPrint}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                </svg>
                Print
              </button>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="flex-1 p-6 bg-gray-100 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start">
            <div className="mb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Live Preview</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${orientation === 'landscape'
                    ? 'bg-blue-500 text-white'
                    : 'bg-green-500 text-white'
                  }`}>
                  {orientation === 'landscape' ? '📄 LANDSCAPE' : '📄 PORTRAIT'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {orientation === 'landscape'
                  ? 'Wide page format (297mm × 210mm)'
                  : 'Tall page format (210mm × 297mm)'
                }
              </p>
            </div>

            {bomData ? (
              <div className="space-y-6">
                {/* Page 1 */}
                <div
                  className="bg-white shadow-2xl border-2 border-gray-400 overflow-hidden"
                  style={{
                    transform: `scale(${scale / 100})`,
                    transformOrigin: 'top center',
                    width: orientation === 'landscape' ? '297mm' : '210mm',
                    height: orientation === 'landscape' ? '210mm' : '297mm',
                    transition: 'all 0.5s ease-in-out'
                  }}
                >
                  <div className="p-3 h-full flex flex-col">
                    {/* Page Number */}
                    <div className="text-right text-xs text-gray-500 mb-1">Page 1</div>

                    {/* Header */}
                    <div className="mb-2 border-b-2 border-purple-600 pb-1">
                      <h1 className="text-base font-bold text-gray-900">Bill of Materials (BOM)</h1>
                      <p className="text-xs text-gray-700">{bomData.projectInfo.projectName}</p>
                      <p className="text-xs text-gray-500">
                        Generated: {new Date(bomData.projectInfo.generatedAt).toLocaleString()}
                      </p>
                    </div>

                    {/* BOM Table */}
                    <div className="flex-1 overflow-hidden">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          {/* Row 1: Main headers */}
                          <tr className="bg-yellow-400">
                            {includeQuantity && (
                              <>
                                <th colSpan={5} className="border border-gray-400 px-2 py-1 text-sm font-bold text-center">
                                  {bomData.projectInfo.projectName}
                                </th>
                                <th colSpan={2} className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
                                  Building Code
                                </th>
                                {bomData.tabs.map((tab, index) => (
                                  <th key={`bc-${index}`} className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
                                    {tab}
                                  </th>
                                ))}
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Total</th>
                              </>
                            )}
                            {includeSpare && (
                              <>
                                <th rowSpan={2} className="bg-gray-200 w-4"></th>
                                <th rowSpan={2} colSpan={2} className="border border-gray-400 px-2 py-1 text-sm font-bold text-center">Spare</th>
                              </>
                            )}
                            {includeCosting && (
                              <>
                                <th className="bg-gray-200 w-4"></th>
                                <th colSpan={6} className="border border-gray-400 px-2 py-1 text-sm font-bold text-center">
                                  Weight Calculation and Cost Calculation
                                </th>
                              </>
                            )}
                          </tr>

                          {/* Row 2: Secondary headers */}
                          <tr className="bg-yellow-400">
                            {includeQuantity && (
                              <>
                                <th colSpan={5} className="border border-gray-400 px-2 py-1 text-sm font-bold text-center">
                                  {bomData.projectInfo.longRailVariation || 'BOM for U Cleat Long Rail'}
                                </th>
                                <th colSpan={2} className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
                                  No. of Panels
                                </th>
                                {bomData.tabs.map((tab, index) => (
                                  <th key={`panel-${index}`} className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
                                    {bomData.panelCounts[tab] || 0}
                                  </th>
                                ))}
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
                                  {Object.values(bomData.panelCounts).reduce((a, b) => a + b, 0)}
                                </th>
                              </>
                            )}
                            {includeCosting && (
                              <>
                                <th className="bg-gray-200 w-4"></th>
                                <th colSpan={6} className="border border-gray-400 px-2 py-1 text-sm font-bold text-center">
                                  Aluminum Rate per kg: ₹{aluminumRate}
                                </th>
                              </>
                            )}
                          </tr>

                          {/* Row 3: Column headers */}
                          <tr className="bg-yellow-400">
                            {includeQuantity && (
                              <>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">S.N</th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Sunrack<br />Code</th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Profile</th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Item Description</th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Material</th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Length<br />(mm)</th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">UoM</th>
                                {bomData.tabs.map((_, index) => (
                                  <th key={`qty-${index}`} className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Qty.</th>
                                ))}
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Quantity</th>
                              </>
                            )}
                            {includeSpare && (
                              <>
                                <th className="bg-gray-200 w-4"></th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Spare<br />Quantity</th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Total<br />Quantity</th>
                              </>
                            )}
                            {includeCosting && (
                              <>
                                <th className="bg-gray-200 w-4"></th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Wt/RM<br />(kg/m)</th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">RM<br />(m)</th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Wt<br />(kg)</th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Al Rate/Kg<br />(₹/kg)</th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Rate/Piece<br />(₹)</th>
                                <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Cost<br />(₹)</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {bomData.bomItems.map((item, index) => (
                            <tr key={item._id || item.sn} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {includeQuantity && (
                                <>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center">{item.sn}</td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center">{item.sunrackCode || '-'}</td>
                                  <td className="border border-gray-400 px-2 py-1 text-center">
                                    {item.profileImage ? (
                                      <img src={item.profileImage} alt={item.sunrackCode} className="w-8 h-8 object-contain mx-auto" />
                                    ) : '-'}
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-left">{item.itemDescription || '-'}</td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center">{item.material || '-'}</td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center">{item.length || '-'}</td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center">{item.uom}</td>
                                  {bomData.tabs.map((tab, idx) => (
                                    <td key={`qty-${idx}`} className="border border-gray-400 px-2 py-1 text-xs text-center">
                                      {item.quantities[tab] || 0}
                                    </td>
                                  ))}
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center font-bold bg-blue-50">{item.totalQuantity}</td>
                                </>
                              )}
                              {includeSpare && (
                                <>
                                  <td className="bg-gray-200"></td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center bg-green-50">{item.spareQuantity}</td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center font-bold bg-purple-50">{item.finalTotal}</td>
                                </>
                              )}
                              {includeCosting && (
                                <>
                                  <td className="bg-gray-200"></td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center bg-yellow-50">{formatNumber(item.wtPerRm, 2)}</td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center bg-yellow-50">{formatNumber(item.rm, 1)}</td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center bg-orange-50">{formatNumber(item.wt, 1)}</td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center bg-orange-50">
                                    {((item.wtPerRm > 0 || item.wt > 0) && !item.costPerPiece) ? formatNumber(item.userEdits?.manualAluminumRate || aluminumRate, 2) : '-'}
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center">
                                    {item.costPerPiece ? formatNumber(item.costPerPiece, 2) : '-'}
                                  </td>
                                  <td className="border border-gray-400 px-2 py-1 text-xs text-center font-bold bg-green-50">₹{formatIndianNumber(item.cost, 2)}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Page 2 - Summary, Notes, Disclaimer */}
                <div
                  className="bg-white shadow-2xl border-2 border-gray-400 overflow-hidden"
                  style={{
                    transform: `scale(${scale / 100})`,
                    transformOrigin: 'top center',
                    width: orientation === 'landscape' ? '297mm' : '210mm',
                    height: orientation === 'landscape' ? '210mm' : '297mm',
                    transition: 'all 0.5s ease-in-out'
                  }}
                >
                  <div className="p-3 h-full flex flex-col overflow-y-auto">
                    {/* Page Number */}
                    <div className="text-right text-xs text-gray-500 mb-2">Page 2</div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="p-2 border border-gray-300 rounded">
                        <p className="text-xs font-semibold text-gray-600">Total Capacity</p>
                        <p className="text-sm font-bold text-gray-800">
                          {((Object.values(bomData.panelCounts).reduce((a, b) => a + b, 0) * moduleWp) / 1000).toFixed(2)} kWp
                        </p>
                      </div>
                      <div className="p-2 border border-gray-300 rounded">
                        <p className="text-xs font-semibold text-gray-600">Cost/Wp</p>
                        <p className="text-sm font-bold text-gray-800">
                          ₹{formatIndianNumber(
                            bomData.bomItems.reduce((acc, item) => acc + (item.cost || 0), 0) /
                            (Object.values(bomData.panelCounts).reduce((a, b) => a + b, 0) * moduleWp),
                            2
                          )}
                        </p>
                      </div>
                      <div className="p-2 border border-gray-300 rounded">
                        <p className="text-xs font-semibold text-gray-600">Total Cost</p>
                        <p className="text-sm font-bold text-gray-800">
                          ₹{formatIndianNumber(bomData.bomItems.reduce((acc, item) => acc + (item.cost || 0), 0), 2)}
                        </p>
                      </div>
                    </div>

                    {/* Notes Section */}
                    {/* <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded mb-3">
                      <h3 className="text-xs font-bold text-gray-800 mb-1">Note:</h3>
                      <ol className="list-decimal list-inside space-y-0.5 text-xs text-gray-700">
                        <li>Cut Length of Long Rails subject to change during detailing based on availability.</li>
                        <li>For all Roofs purlins are assumed to be at 1300mm where details of existing purlins are not shown in layout shared by client.</li>
                        <li>Length of Long Rails subject to change based on actual purlin locations at site to fix the Long rail only on purlin. If any extra length of rails are required, they shall be charged extra.</li>
                        <li>For Roofs with purlin span more than 1.7m, 2 Long Rails + 1 Mini Rail per each side of panel are considered.</li>
                        <li>Purlin Details of sheds T10, T11, T14, T15 are not mentioned in report. They are assumed to be 1.5m. If the actual span is more than 1.7m, an extra Mini rail must be considered additionally (at extra cost).</li>
                      </ol>
                    </div> */}

                    {/* User Notes Section */}
                    {/* {userNotes && userNotes.length > 0 && ( */}
                      <div className="mb-3" style={{ transform: `scale(${scale / 100})`, transformOrigin: 'top left' }}>
                        <NotesSection
                          userNotes={userNotes}
                          onNotesChange={() => {}}
                          editMode={false}
                        />
                      </div>
                    {/* )} */}

                    {/* Disclaimer/Changelog Section */}
                    {settings.includeDisclaimer && changeLog && changeLog.length > 0 && (
                      <div className="p-2 bg-red-50 border-l-4 border-red-400 rounded">
                        <h3 className="text-xs font-bold text-gray-800 mb-1">Disclaimer - Changes Made:</h3>
                        <div className="space-y-1">
                          {changeLog.slice(0, 10).map((change, idx) => (
                            <div key={idx} className="text-xs text-gray-700">
                              <strong>{change.type}:</strong> {change.itemName} - {change.reason || 'No reason provided'}
                            </div>
                          ))}
                          {changeLog.length > 10 && (
                            <p className="text-xs text-gray-500 italic">... and {changeLog.length - 10} more changes</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p>No BOM data available for preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
