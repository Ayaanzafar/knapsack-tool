// src/components/BOM/SpareTable.jsx
export default function SpareTable({ bomData }) {
  const { bomItems } = bomData;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          {/* Row 1: Spare | 1% */}
          <tr className="bg-yellow-400">
            <th className="border border-gray-400 px-3 py-1 text-sm font-bold text-center">
              Spare
            </th>
            <th className="border border-gray-400 px-3 py-1 text-sm font-bold text-center">
              1%
            </th>
          </tr>

          {/* Row 2: Spare Quantity | Total Quantity */}
          <tr className="bg-yellow-400">
            <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-center">
              Spare<br />Quantity
            </th>
            <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-center">
              Total<br />Quantity
            </th>
          </tr>
        </thead>

        <tbody>
          {bomItems.map((item, index) => {
            const bgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

            return (
              <tr key={`spare-${item.sn}-${index}`} className={bgColor}>
                {/* Spare Quantity (1%) */}
                <td className="border border-gray-400 px-3 py-2 text-sm text-center bg-green-50">
                  {item.spareQuantity}
                </td>

                {/* Total Quantity (Total + Spare) */}
                <td className="border border-gray-400 px-3 py-2 text-sm text-center font-bold bg-purple-50">
                  {item.finalTotal}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
