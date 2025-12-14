// // src/components/BOM/BOMTable.jsx
import BOMTableRow from './BOMTableRow';

export default function BOMTable({ bomData, editMode, onProfileChange, profileOptions, onItemUpdate, aluminumRate, sparePercentage }) {
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

            {/* Blank separator column */}
            <th className="bg-gray-200 w-4"></th>

            {/* Weight & Cost Calculation section header */}
            <th
              colSpan={4}
              className="border border-gray-400 px-3 py-1 text-sm font-bold text-center"
            >
              Weight Calculation and Cost Calculation
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

            {/* Spare section - spare percentage label spanning 2 columns */}
            <th
              colSpan={2}
              className="border border-gray-400 px-3 py-1 text-sm font-bold text-center"
            >
              {sparePercentage}%
            </th>

            {/* Blank separator column */}
            <th className="bg-gray-200 w-4"></th>

            {/* Weight & Cost section - Aluminum Rate */}
            <th
              colSpan={4}
              className="border border-gray-400 px-3 py-1 text-sm font-bold text-center"
            >
              Aluminum Rate per kg: ₹{aluminumRate}
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

            {/* Blank separator column */}
            <th className="bg-gray-200 w-4"></th>

            {/* Weight & Cost Calculation columns */}
            <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-center">
              Wt/RM<br />(kg/m)
            </th>
            <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-center">
              RM<br />(m)
            </th>
            <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-center">
              Wt<br />(kg)
            </th>
            <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-center">
              Cost<br />(₹)
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
              profileOptions={profileOptions}
              onProfileChange={onProfileChange}
              onItemUpdate={onItemUpdate}
            />
          ))}
        </tbody>
      </table>
    </div >
  );
}






// src/components/BOM/BOMTable.jsx
// import { useMemo } from 'react';

// // Helper to format numbers
// const fmt = (num) => {
//   if (num === null || num === undefined) return '-';
//   return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
// };

// export default function BOMTable({ bomData, editMode, selectedRow, onRowSelect }) {
//   const { tabs, panelCounts, bomItems } = bomData;

//   // Calculate Footer Totals
//   const totals = useMemo(() => {
//     const t = {
//       projectTotals: {},
//       totalQty: 0,
//       spareQty: 0,
//       finalQty: 0
//     };

//     // Initialize project totals
//     tabs.forEach(tab => t.projectTotals[tab] = 0);

//     bomItems.forEach(item => {
//       // Sum global columns
//       t.totalQty += Number(item.totalQuantity) || 0;
//       t.spareQty += Number(item.spareQuantity) || 0;
//       t.finalQty += Number(item.finalTotal) || 0;

//       // Sum specific project columns
//       tabs.forEach(tab => {
//         t.projectTotals[tab] += Number(item.quantities[tab]) || 0;
//       });
//     });

//     return t;
//   }, [bomItems, tabs]);

//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full text-sm text-left border-collapse">
        
//         {/* === HEADER === */}
//         <thead className="bg-gray-50 text-gray-600">
//           {/* Top Row: Grouping Titles */}
//           <tr>
//             <th rowSpan={2} className="px-4 py-3 border-b border-gray-200 text-center font-semibold w-12">S.N.</th>
//             <th rowSpan={2} className="px-4 py-3 border-b border-gray-200 font-semibold text-left">Item Details</th>
//             <th rowSpan={2} className="px-4 py-3 border-b border-gray-200 font-semibold text-left hidden md:table-cell">Specs</th>
            
//             {/* Dynamic Project Group Header */}
//             {tabs.length > 0 && (
//               <th 
//                 colSpan={tabs.length} 
//                 className="px-3 py-2 text-center font-semibold text-purple-700 border-b border-x border-purple-100 bg-purple-50"
//               >
//                 Project Breakdown & Panel Counts
//               </th>
//             )}

//             {/* Summary Group Header */}
//             <th colSpan={3} className="px-3 py-2 text-center font-semibold text-gray-700 border-b border-l border-gray-200 bg-gray-100">
//                Summary
//             </th>
//           </tr>

//           {/* Bottom Row: Specific Columns */}
//           <tr>
//             {/* Project Columns with Panel Counts */}
//             {tabs.map(tab => (
//               <th key={tab} className="px-3 py-2 text-center border-b border-gray-200 bg-white min-w-[80px]">
//                 <div className="flex flex-col items-center">
//                   <span className="text-xs font-bold text-gray-700 uppercase">{tab}</span>
//                   <span className="mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded-full font-medium">
//                     {panelCounts[tab] || 0} Panels
//                   </span>
//                 </div>
//               </th>
//             ))}

//             {/* Summary Columns */}
//             <th className="px-3 py-2 text-center border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 w-24">Total</th>
//             <th className="px-3 py-2 text-center border-b border-gray-200 bg-yellow-50 text-xs font-bold uppercase tracking-wider text-yellow-700 w-24">Spare</th>
//             <th className="px-3 py-2 text-center border-b border-gray-200 bg-green-50 text-xs font-bold uppercase tracking-wider text-green-700 w-24">Final</th>
//           </tr>
//         </thead>

//         {/* === BODY === */}
//         <tbody className="divide-y divide-gray-100">
//           {bomItems.map((item, index) => {
//              const isSelected = selectedRow?.sn === item.sn;
             
//              return (
//               <tr 
//                 key={`${item.sn}-${index}`} 
//                 onClick={() => editMode && onRowSelect(item)}
//                 className={`transition-colors duration-150 hover:bg-gray-50 
//                   ${isSelected ? 'bg-purple-50 ring-2 ring-inset ring-purple-400' : ''}
//                   ${editMode ? 'cursor-pointer' : ''}
//                 `}
//               >
//                 {/* S.N. */}
//                 <td className="px-4 py-3 text-center text-gray-500 font-medium">
//                   {item.sn}
//                 </td>

//                 {/* Description & Image */}
//                 <td className="px-4 py-3">
//                   <div className="flex items-center gap-4">
//                     {/* Image Thumbnail */}
//                     <div className="h-10 w-10 flex-shrink-0 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm overflow-hidden p-1">
//                       {item.profileImage ? (
//                          <img 
//                            src={item.profileImage} 
//                            alt="Part" 
//                            className="w-full h-full object-contain"
//                            onError={(e) => { e.target.style.display='none'; }} 
//                          />
//                       ) : (
//                         <span className="text-[10px] text-gray-300">No Img</span>
//                       )}
//                     </div>
                    
//                     {/* Text Info */}
//                     <div>
//                       <div className="font-semibold text-gray-800 text-sm">{item.itemDescription}</div>
//                       <div className="flex items-center gap-2 mt-0.5">
//                         <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
//                           {item.sunrackCode || 'No Code'}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 </td>

//                 {/* Specs (Material/Length) */}
//                 <td className="px-4 py-3 hidden md:table-cell">
//                   <div className="text-xs text-gray-700 font-medium">{item.material}</div>
//                   {(item.length && item.length > 0) ? (
//                     <div className="text-[10px] text-gray-500">L: {item.length}mm</div>
//                   ) : (
//                     <div className="text-[10px] text-gray-400">{item.uom}</div>
//                   )}
//                 </td>

//                 {/* Dynamic Project Quantities */}
//                 {tabs.map(tab => {
//                   const qty = item.quantities[tab];
//                   return (
//                     <td key={`${item.sn}-${tab}`} className="px-3 py-3 text-center">
//                       {qty > 0 ? (
//                         <span className="text-sm font-medium text-gray-600">{qty}</span>
//                       ) : (
//                         <span className="text-gray-200 text-xs">-</span>
//                       )}
//                     </td>
//                   );
//                 })}

//                 {/* Total Quantity */}
//                 <td className="px-3 py-3 text-center bg-gray-50/50">
//                   <span className="text-sm font-semibold text-gray-700">{fmt(item.totalQuantity)}</span>
//                 </td>

//                 {/* Spare Quantity */}
//                 <td className="px-3 py-3 text-center bg-yellow-50/30">
//                   <span className="text-sm font-medium text-yellow-700">{fmt(item.spareQuantity)}</span>
//                 </td>

//                 {/* Final Total */}
//                 <td className="px-3 py-3 text-center bg-green-50/30">
//                   <span className="inline-block px-3 py-1 bg-white border border-green-200 rounded-md text-sm font-bold text-green-700 shadow-sm">
//                     {fmt(item.finalTotal)}
//                   </span>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>

//         {/* === FOOTER (TOTALS) === */}
//         <tfoot className="bg-linear-to-r from-purple-100 to-purple-50 border-t-2 border-purple-300">
//           <tr>
//             <td colSpan={3} className="px-4 py-4 text-right font-bold text-purple-800 text-xs uppercase tracking-wide">
//               Grand Totals
//             </td>

//             {/* Dynamic Project Totals */}
//             {tabs.map(tab => (
//               <td key={tab} className="px-3 py-4 text-center border-l border-purple-200">
//                 <span className="font-bold text-purple-900 text-sm">{fmt(totals.projectTotals[tab])}</span>
//               </td>
//             ))}

//             {/* Sum Totals */}
//             <td className="px-3 py-4 text-center border-l border-purple-200">
//               <span className="font-bold text-gray-800">{fmt(totals.totalQty)}</span>
//             </td>
//             <td className="px-3 py-4 text-center border-l border-purple-200 bg-yellow-50/50">
//               <span className="font-bold text-yellow-800">{fmt(totals.spareQty)}</span>
//             </td>
//             <td className="px-3 py-4 text-center border-l border-purple-200 bg-green-50/50">
//               <span className="font-bold text-green-800 text-base">{fmt(totals.finalQty)}</span>
//             </td>
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   );
// }