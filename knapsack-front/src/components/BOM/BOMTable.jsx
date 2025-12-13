// src/components/BOM/BOMTable.jsx
import BOMTableRow from './BOMTableRow';

export default function BOMTable({ bomData, editMode, selectedRow, onRowSelect }) {
  const { tabs, panelCounts, bomItems, projectInfo } = bomData;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-yellow-400">



            <th
              colSpan={5}
              className="border border-gray-400 px-3 py-1 text-sm font-bold text-center"
            >
              {projectInfo.projectName}
            </th>


            <th
              colSpan={2}
              className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
              Building Code
            </th>


            {tabs.map((tab, index) => (
              <th
                key={`bc-${index}-${tab}`}
                className="border border-gray-400 px-2 py-1 text-xs font-bold text-center"
              >
                {tab}
              </th>
            ))}


            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
              Total
            </th>

            {/* Blank separator column */}
            <th className="bg-gray-200 w-4"></th>

            {/* Spare section header */}
            <th
              colSpan={2}
              className="border border-gray-400 px-3 py-1 text-sm font-bold text-center"
            >
              Spare
            </th>
          </tr>

          {/* === ROW 2 === */}
          <tr className="bg-yellow-400">

            {/* left empty cell */}



            <th
              colSpan={5}
              
              className="border border-gray-400 px-3 py-1 text-sm font-bold text-center"
            >
              BOM for U Cleat Long Rail
            </th>


            <th
              colSpan={2}
              className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
              No. of Panels
            </th>


            {tabs.map((tab, index) => (
              <th
                key={`panel-${index}-${tab}`}
                className="border border-gray-400 px-2 py-1 text-xs font-bold text-center"
              >
                {panelCounts[tab] || 0}
              </th>
            ))}


            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
              {Object.values(panelCounts).reduce((a, b) => a + b, 0)}
            </th>

            {/* Blank separator column */}
            <th className="bg-gray-200 w-4"></th>

            {/* Spare section - "1%" label spanning 2 columns */}
            <th
              colSpan={2}
              className="border border-gray-400 px-3 py-1 text-sm font-bold text-center"
            >
              1%
            </th>

          </tr>


          {/* ROW 3 – column labels + Qty row */}
          <tr className="bg-yellow-400">
            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
              S.N
            </th>
            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
              Sunrack<br />Code
            </th>
            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
              Profile
            </th>
            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
              Item Description
            </th>
            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
              Material
            </th>
            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
              Length<br />(mm)
            </th>
            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
              UoM
            </th>

            {/* column under "Building Code" / "No. of Panels" is blank on row 3 */}


            {/* Qty. under each Tn */}
            {tabs.map((tab, index) => (
              <th
                key={`qty-${index}-${tab}`}
                className="border border-gray-400 px-2 py-1 text-xs font-bold text-center"
              >
                Qty.
              </th>
            ))}

            {/* last column under Total */}
            <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
              Quantity
            </th>

            {/* Blank separator column */}
            <th className="bg-gray-200 w-4"></th>

            {/* Spare Quantity column */}
            <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-center">
              Spare<br />Quantity
            </th>

            {/* Total Quantity column */}
            <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-center">
              Total<br />Quantity
            </th>
          </tr>


        </thead>

        <tbody>
          {bomItems.map((item, index) => (
            <BOMTableRow
              key={`${item.sn}-${index}`}
              item={item}
              tabs={tabs}
              isEven={index % 2 === 0}
              editMode={editMode}
              isSelected={selectedRow?.sn === item.sn}
              onSelect={() => onRowSelect(item)}
            />
          ))}
        </tbody>
      </table>
    </div >
  );
}
