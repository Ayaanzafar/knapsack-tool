// src/components/BOM/BOMTableRow.jsx
import React, { forwardRef } from 'react';
import ComboBox from '../ComboBox';

const BOMTableRow = forwardRef(({ item, tabs, isEven, editMode, onProfileChange, profileOptions, onItemUpdate, onDeleteRow, dragHandleProps, ...props }, ref) => {
  const {
    sn,
    sunrackCode,
    profileImage,
    itemDescription,
    material,
    length,
    uom,
    quantities,
    totalQuantity,
    spareQuantity,
    finalTotal,
    wtPerRm,
    rm,
    wt,
    cost,
    costPerPiece, // Destructured
    profileSerialNumber,
    calculationType,
    userEdits,
  } = item;

  // Check if spare quantity is manually overridden
  const hasManualSpare = userEdits?.manualSpareQuantity !== undefined && userEdits?.manualSpareQuantity !== null;

  // Format numbers for display
  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return '-';
    return typeof value === 'number' ? value.toFixed(decimals) : '-';
  };

  const isEditable = calculationType === 'CUT_LENGTH' || calculationType === 'ACCESSORY';

  const getCellBgColor = (isTotalCol = false) => {
    if (isTotalCol) {
      return 'bg-blue-50';
    }
    return isEven ? 'bg-white' : 'bg-gray-50';
  };
  
  const handleInputChange = (field, value) => {
    onItemUpdate(sn, field, value);
  };

  const handleResetSpare = () => {
    onItemUpdate(sn, 'resetSpare', null);
  };

  return (
    <tr
      ref={ref}
      {...props}
      className={isEven ? 'bg-white' : 'bg-gray-50'}
    >
      {/* Actions Column (Edit Mode Only) */}
      {editMode && (
        <td className={`border border-gray-400 px-2 py-2 text-center ${getCellBgColor()}`}>
          <div className="flex items-center justify-center gap-2">
            {/* Drag Handle */}
            <div
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
              title="Drag to reorder"
              {...dragHandleProps}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Delete Button */}
            <button
              onClick={() => onDeleteRow(item)}
              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
              title="Delete Item"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </td>
      )}

      {/* S.N */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center font-medium ${getCellBgColor()}`}>
        {sn}
      </td>

      {/* Sunrack Code */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center font-medium ${getCellBgColor()}`}>
        {sunrackCode || '-'}
      </td>

      {/* Profile Image */}
      <td className={`border border-gray-400 px-2 py-2 text-center ${getCellBgColor()}`}>
        {profileImage ? (
          <div className="flex justify-center">
            <img
              src={profileImage}
              alt={sunrackCode || itemDescription}
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center hidden">
              <span className="text-xs text-gray-400">No Img</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-xs text-gray-400">-</span>
            </div>
          </div>
        )}
      </td>

      {/* Item Description */}
      <td className={`border border-gray-400 px-3 py-2 text-sm text-left ${getCellBgColor()}`}>
        {editMode && isEditable ? (
          <ComboBox
            options={profileOptions}
            value={profileSerialNumber}
            onChange={(newProfileSerial) => onProfileChange(newProfileSerial, item)}
            placeholder="-- Change Profile --"
          />
        ) : (
          itemDescription
        )}
      </td>

      {/* Material */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center ${getCellBgColor()}`}>
        {material}
      </td>

      {/* Length */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center ${getCellBgColor()}`}>
        {length || '-'}
      </td>

      {/* UoM */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center ${getCellBgColor()}`}>
        {uom}
      </td>

      {/* Quantities for each tab */}
      {tabs.map((tabName, index) => (
        <td
          key={`qty-${index}-${tabName}`}
          className={`border border-gray-400 px-2 py-2 text-sm text-center font-medium ${getCellBgColor()}`}
        >
          {editMode ? (
            <input
              type="number"
              value={quantities[tabName] || 0}
              onChange={(e) => handleInputChange(`quantity_${tabName}`, e.target.value)}
              className="w-16 p-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            quantities[tabName] || 0
          )}
        </td>
      ))}

      {/* Total Quantity */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center font-bold ${getCellBgColor(true)}`}>
        {totalQuantity}
      </td>

      {/* Blank separator column */}
      <td className="bg-gray-200"></td>

      {/* Spare Quantity */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center ${hasManualSpare ? 'bg-blue-100' : 'bg-green-50'}`}>
        {editMode ? (
          <div className="flex items-center justify-center gap-1">
            <input
              type="number"
              value={spareQuantity}
              onChange={(e) => handleInputChange('spareQuantity', e.target.value)}
              className={`w-16 p-1 text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                hasManualSpare ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
              title={hasManualSpare ? 'Manual override active' : 'Auto-calculated from spare %'}
            />
            {hasManualSpare && (
              <button
                onClick={handleResetSpare}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded transition-colors"
                title="Reset to percentage-based calculation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <span>{spareQuantity}</span>
            {/* {hasManualSpare && (
              <span className="text-blue-600 text-xs" title="Manual override">✓</span>
            )} */}
          </div>
        )}
      </td>

      {/* Final Total Quantity */}
      <td className={`border border-gray-400 px-3 py-2 text-sm text-center font-bold bg-purple-50`}>
        {finalTotal}
      </td>

      {/* Blank separator column */}
      <td className="bg-gray-200"></td>

      {/* Wt/RM (Weight per Running Meter) */}
      <td className={`border border-gray-400 px-3 py-2 text-sm text-center bg-yellow-50`}>
        {formatNumber(wtPerRm, 2)}
      </td>

      {/* RM (Running Meters) */}
      <td className={`border border-gray-400 px-3 py-2 text-sm text-center bg-yellow-50`}>
        {formatNumber(rm, 1)}
      </td>

      {/* Wt (Total Weight) */}
      <td className={`border border-gray-400 px-3 py-2 text-sm text-center bg-orange-50`}>
        {formatNumber(wt, 1)}
      </td>

      {/* Rate Per Piece */}
      <td className={`border border-gray-400 px-3 py-2 text-sm text-center ${getCellBgColor()}`}>
        {calculationType === 'ACCESSORY' ? (
          editMode ? (
            <input
              type="number"
              value={costPerPiece || 0}
              onChange={(e) => handleInputChange('costPerPiece', e.target.value)}
              className="w-20 p-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              step="0.01"
            />
          ) : (
            formatNumber(costPerPiece, 2)
          )
        ) : (
          '-'
        )}
      </td>

      {/* Cost */}
      <td className={`border border-gray-400 px-3 py-2 text-sm text-center font-bold bg-green-50`}>
        {cost !== null && cost !== undefined ? `₹${formatNumber(cost, 0)}` : '-'}
      </td>
    </tr>
  );
});

export default BOMTableRow;
