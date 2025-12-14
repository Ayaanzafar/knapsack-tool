// src/components/BOM/BOMTableRow.jsx
import ComboBox from '../ComboBox';

export default function BOMTableRow({ item, tabs, isEven, editMode, onProfileChange, profileOptions, onItemUpdate }) {
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
    profileSerialNumber,
    calculationType,
  } = item;

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

  return (
    <tr
      className={isEven ? 'bg-white' : 'bg-gray-50'}
    >
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
      <td className={`border border-gray-400 px-3 py-2 text-sm text-center bg-green-50`}>
        {editMode ? (
          <input
            type="number"
            value={spareQuantity}
            onChange={(e) => handleInputChange('spareQuantity', e.target.value)}
            className="w-20 p-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        ) : (
          spareQuantity
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

      {/* Cost */}
      <td className={`border border-gray-400 px-3 py-2 text-sm text-center font-bold bg-green-50`}>
        {cost !== null && cost !== undefined ? `₹${formatNumber(cost, 0)}` : '-'}
      </td>
    </tr>
  );
}
