// src/components/BOM/BOMTableRow.jsx
export default function BOMTableRow({ item, tabs, isEven, editMode, isSelected, onSelect }) {
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
    finalTotal
  } = item;

  const rowClasses = `
    ${editMode ? 'cursor-pointer' : ''}
  `;

  const getCellBgColor = (isTotalCol = false) => {
    if (isSelected) {
      return 'bg-purple-200';
    }
    if (isTotalCol) {
      return 'bg-blue-50';
    }
    return isEven ? 'bg-white' : 'bg-gray-50';
  };

  const getCellBorderClasses = (isSpareCol = false) => {
    if (isSelected && !isSpareCol) {
      return 'border-t-4 border-purple-500';
    }
    return '';
  };

  const hoverClass = editMode ? 'hover:bg-blue-100' : '';

  return (
    <tr
      className={`${rowClasses} ${hoverClass}`}
      onClick={() => editMode && onSelect && onSelect()}
    >
      {/* S.N */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center font-medium ${getCellBgColor()} ${getCellBorderClasses()}`}>
        {sn}
      </td>

      {/* Sunrack Code */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center font-medium ${getCellBgColor()} ${getCellBorderClasses()}`}>
        {sunrackCode || '-'}
      </td>

      {/* Profile Image */}
      <td className={`border border-gray-400 px-2 py-2 text-center ${getCellBgColor()} ${getCellBorderClasses()}`}>
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
      <td className={`border border-gray-400 px-3 py-2 text-sm text-left ${getCellBgColor()} ${getCellBorderClasses()}`}>
        {itemDescription}
      </td>

      {/* Material */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center ${getCellBgColor()} ${getCellBorderClasses()}`}>
        {material}
      </td>

      {/* Length */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center ${getCellBgColor()} ${getCellBorderClasses()}`}>
        {length || '-'}
      </td>

      {/* UoM */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center ${getCellBgColor()} ${getCellBorderClasses()}`}>
        {uom}
      </td>

      {/* Quantities for each tab */}
      {tabs.map((tabName, index) => (
        <td
          key={`qty-${index}-${tabName}`}
          className={`border border-gray-400 px-2 py-2 text-sm text-center font-medium ${getCellBgColor()} ${getCellBorderClasses()}`}
        >
          {quantities[tabName] || 0}
        </td>
      ))}

      {/* Total Quantity */}
      <td className={`border border-gray-400 px-2 py-2 text-sm text-center font-bold ${getCellBgColor(true)} ${getCellBorderClasses()}`}>
        {totalQuantity}
      </td>

      {/* Blank separator column */}
      <td className="bg-gray-200"></td>

      {/* Spare Quantity */}
      <td className={`border border-gray-400 px-3 py-2 text-sm text-center bg-green-50 ${getCellBorderClasses(true)}`}>
        {spareQuantity}
      </td>

      {/* Final Total Quantity */}
      <td className={`border border-gray-400 px-3 py-2 text-sm text-center font-bold bg-purple-50 ${getCellBorderClasses(true)}`}>
        {finalTotal}
      </td>
    </tr>
  );
}
