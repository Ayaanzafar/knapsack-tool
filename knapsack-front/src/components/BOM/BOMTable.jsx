// src/components/BOM/BOMTable.jsx
import BOMTableRow from './BOMTableRow';

export default function BOMTable({ bomData }) {
  const { tabs, panelCounts, bomItems } = bomData;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          {/* Main Header Row */}
          <tr className="bg-yellow-400">
            <th className="border border-gray-400 px-2 py-2 text-sm font-bold text-gray-900 text-center" rowSpan="2">S.N</th>
            <th className="border border-gray-400 px-2 py-2 text-sm font-bold text-gray-900 text-center" rowSpan="2">Sunrack Code</th>
            <th className="border border-gray-400 px-2 py-2 text-sm font-bold text-gray-900 text-center" rowSpan="2">Profile</th>
            <th className="border border-gray-400 px-2 py-2 text-sm font-bold text-gray-900 text-center" rowSpan="2">Item Description</th>
            <th className="border border-gray-400 px-2 py-2 text-sm font-bold text-gray-900 text-center" rowSpan="2">Material</th>
            <th className="border border-gray-400 px-2 py-2 text-sm font-bold text-gray-900 text-center" rowSpan="2">Length</th>
            <th className="border border-gray-400 px-2 py-2 text-sm font-bold text-gray-900 text-center" rowSpan="2">UoM</th>
            <th className="border border-gray-400 px-3 py-2 text-sm font-bold text-gray-900 text-center" colSpan={tabs.length + 1}>
              Building Code
            </th>
            <th className="border border-gray-400 px-3 py-2 text-sm font-bold text-gray-900 text-center" colSpan="3">
              Spare
            </th>
          </tr>

          {/* Sub Header Row */}
          <tr className="bg-yellow-400">
            {/* No. of Panels for each tab */}
            {tabs.map(tabName => (
              <th key={`panel-${tabName}`} className="border border-gray-400 px-2 py-1 text-xs font-bold text-gray-900 text-center">
                {tabName}
              </th>
            ))}
            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-gray-900 text-center">
              Quantity
            </th>
            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-gray-900 text-center">
              Spare Quantity
            </th>
            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-gray-900 text-center">
              1%
            </th>
            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-gray-900 text-center">
              Total Quantity
            </th>
          </tr>

          {/* Panel Counts Row */}
          <tr className="bg-blue-50">
            <td colSpan="7" className="border border-gray-400 px-3 py-2 text-sm font-semibold text-gray-700 text-right">
              No. of Panels
            </td>
            {tabs.map(tabName => (
              <td key={`count-${tabName}`} className="border border-gray-400 px-2 py-2 text-sm font-bold text-center text-blue-700">
                {panelCounts[tabName] || 0}
              </td>
            ))}
            <td colSpan="4" className="border border-gray-400 bg-gray-100"></td>
          </tr>
        </thead>

        <tbody>
          {bomItems.map((item, index) => (
            <BOMTableRow
              key={`${item.sn}-${index}`}
              item={item}
              tabs={tabs}
              isEven={index % 2 === 0}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
