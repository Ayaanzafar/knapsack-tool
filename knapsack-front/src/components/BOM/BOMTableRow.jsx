// src/components/BOM/BOMTableRow.jsx
import React, { forwardRef } from 'react';
import ComboBox from '../ComboBox';
import NumberInputWithSpinner from '../NumberInputWithSpinner';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../services/config';

const BOMTableRow = forwardRef(({ item, tabs, isEven, editMode, onProfileChange, profileOptions, onItemUpdate, onDeleteRow, dragHandleProps, aluminumRate, hdgRate, magnelisRate, ...props }, ref) => {
  const { user } = useAuth();
  const isBasicUser = user?.role === 'BASIC';

  const {
    sn,
    sunrackCode,
    profileImage: rawProfileImage,
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

  // Ensure image URL is absolute
  const profileImage = rawProfileImage && rawProfileImage.startsWith('/')
    ? `${API_URL}${rawProfileImage}`
    : rawProfileImage;

  // Determine the default rate based on material type
  const getDefaultRateByMaterial = () => {
    if (!material) return parseFloat(aluminumRate) || 0;

    const mat = material.toLowerCase();

    // Magnelis/Galvalume materials
    if (mat.includes('magnelis') || mat.includes('galvalume')) {
      return parseFloat(magnelisRate) || 0;
    }

    // HDG (Hot Dip Galvanized) materials
    if (mat.includes('hdg') || mat === 'gi' || mat.includes('galvanized')) {
      return parseFloat(hdgRate) || 0;
    }

    // Aluminium materials (AA 6063, AA 6065, etc.)
    if (mat.includes('aa 60') || mat.includes('alumin') || mat.includes('al ')) {
      return parseFloat(aluminumRate) || 0;
    }

    // Default to aluminium rate for unknown materials
    return parseFloat(aluminumRate) || 0;
  };

  // Get the material rate type for display
  const getMaterialRateType = () => {
    if (!material) return 'Al';

    const mat = material.toLowerCase();

    if (mat.includes('magnelis') || mat.includes('galvalume')) {
      return 'Magnelis';
    }
    if (mat.includes('hdg') || mat === 'gi' || mat.includes('galvanized')) {
      return 'HDG';
    }
    return 'Al';
  };

  // Check if spare quantity is manually overridden
  const hasManualSpare = userEdits?.manualSpareQuantity !== undefined && userEdits?.manualSpareQuantity !== null;
  const hasManualAlRate = userEdits?.manualAluminumRate !== undefined && userEdits?.manualAluminumRate !== null;

  // Helper function to validate and filter positive numeric input (integers only for quantities)
  const handleNumericInput = (value, allowDecimals = false) => {
    // Allow empty string for clearing
    if (value === '') return '';
    // Remove any negative signs and non-numeric characters
    if (allowDecimals) {
      const filtered = value.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const parts = filtered.split('.');
      if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
      }
      return filtered;
    } else {
      // Only allow integers (no decimals) for quantities
      return value.replace(/[^0-9]/g, '');
    }
  };

  // Get the default rate based on material, then check for manual override
  const defaultRateByMaterial = getDefaultRateByMaterial();
  const effectiveAlRate = hasManualAlRate ? (parseFloat(userEdits.manualAluminumRate) || 0) : defaultRateByMaterial;

  // Format numbers for display
  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return '-';
    return typeof value === 'number' ? value.toFixed(decimals) : '-';
  };

  // Format numbers in Indian style (lakhs, crores)
  const formatIndianNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return '-';
    if (typeof value !== 'number') return '-';

    const fixedValue = value.toFixed(decimals);
    const [integerPart, decimalPart] = fixedValue.split('.');

    // Indian numbering: first comma after 3 digits, then every 2 digits
    let lastThree = integerPart.slice(-3);
    let otherNumbers = integerPart.slice(0, -3);

    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }

    let formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

    return decimalPart ? `${formatted}.${decimalPart}` : formatted;
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

  const handleResetAlRate = () => {
    onItemUpdate(sn, 'resetAluminumRate', null);
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
        {editMode ? (
          <input
            type="text"
            value={material || ''}
            onChange={(e) => handleInputChange('material', e.target.value)}
            className="w-full p-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter material"
          />
        ) : (
          material
        )}
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
            <NumberInputWithSpinner
              value={quantities[tabName] || 0}
              onChange={(val) => handleInputChange(`quantity_${tabName}`, val)}
              minValue={0}
              size="sm"
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
            <NumberInputWithSpinner
              value={spareQuantity || 0}
              onChange={(val) => handleInputChange('spareQuantity', val)}
              minValue={0}
              size="sm"
              className={hasManualSpare ? 'border-blue-400 bg-blue-50' : ''}
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

      {/* Rate per Unit Wt */}
      <td className={`border border-gray-400 px-3 py-2 text-sm text-center ${hasManualAlRate ? 'bg-blue-100' : 'bg-orange-50'}`}>
        {((wtPerRm > 0 || wt > 0) && !costPerPiece) ? (
          editMode ? (
            <div className="flex items-center justify-center gap-1">
              <NumberInputWithSpinner
                value={hasManualAlRate ? (userEdits.manualAluminumRate || 0) : (defaultRateByMaterial || 0)}
                onChange={(val) => handleInputChange('manualAluminumRate', val)}
                minValue={0}
                size="sm"
                className={hasManualAlRate ? 'border-blue-400 bg-blue-50' : ''}
              />
              {hasManualAlRate && (
                <button
                  onClick={handleResetAlRate}
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded transition-colors"
                  title={`Reset to ${getMaterialRateType()} rate`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            formatNumber(effectiveAlRate, 2)
          )
        ) : (
          '-'
        )}
      </td>

      {/* Rate Per Piece */}
      <td className={`border border-gray-400 px-3 py-2 text-sm text-center ${getCellBgColor()}`}>
        {costPerPiece ? (
          editMode ? (
            <NumberInputWithSpinner
              value={costPerPiece || 0}
              onChange={(val) => handleInputChange('costPerPiece', val)}
              minValue={0}
              size="sm"
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
        {cost !== null && cost !== undefined ? `₹${formatIndianNumber(cost, 2)}` : '-'}
      </td>
    </tr>
  );
});

export default BOMTableRow;
