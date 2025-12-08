// src/components/BOM/BOMTableRow.jsx
export default function BOMTableRow({ item, tabs, isEven }) {
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

  const bgColor = isEven ? 'bg-white' : 'bg-gray-50';

  return (
    <tr className={bgColor}>
      {/* S.N */}
      <td className="border border-gray-400 px-2 py-2 text-sm text-center font-medium">
        {sn}
      </td>

      {/* Sunrack Code */}
      <td className="border border-gray-400 px-2 py-2 text-sm text-center font-medium">
        {sunrackCode || '-'}
      </td>

      {/* Profile Image */}
      <td className="border border-gray-400 px-2 py-2 text-center">
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
      <td className="border border-gray-400 px-3 py-2 text-sm text-left">
        {itemDescription}
      </td>

      {/* Material */}
      <td className="border border-gray-400 px-2 py-2 text-sm text-center">
        {material}
      </td>

      {/* Length */}
      <td className="border border-gray-400 px-2 py-2 text-sm text-center">
        {length || '-'}
      </td>

      {/* UoM */}
      <td className="border border-gray-400 px-2 py-2 text-sm text-center">
        {uom}
      </td>

      {/* Quantities for each tab */}
      {tabs.map(tabName => (
        <td
          key={`qty-${tabName}`}
          className="border border-gray-400 px-2 py-2 text-sm text-center font-medium"
        >
          {quantities[tabName] || 0}
        </td>
      ))}

      {/* Total Quantity */}
      <td className="border border-gray-400 px-2 py-2 text-sm text-center font-bold bg-blue-50">
        {totalQuantity}
      </td>

      {/* Spare Quantity */}
      <td className="border border-gray-400 px-2 py-2 text-sm text-center bg-green-50">
        {spareQuantity}
      </td>

      {/* 1% Label */}
      <td className="border border-gray-400 px-2 py-2 text-xs text-center text-gray-500">
        1%
      </td>

      {/* Final Total */}
      <td className="border border-gray-400 px-2 py-2 text-sm text-center font-bold bg-purple-50">
        {finalTotal}
      </td>
    </tr>
  );
}
