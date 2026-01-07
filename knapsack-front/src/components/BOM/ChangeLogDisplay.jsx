// src/components/BOM/ChangeLogDisplay.jsx
export default function ChangeLogDisplay({ changeLog }) {
  if (!changeLog || changeLog.length === 0) {
    return null;
  }

  const formatChangeMessage = (change) => {
    switch (change.type) {
      case 'EDIT_QUANTITY':
        return `The quantity for "${change.itemName}" (Row ${change.rowNumber}) in building "${change.tabName}" has been changed from ${change.oldValue} to ${change.newValue}.`;

      case 'ADD_ROW':
        return `New item "${change.itemName}" added after Row ${change.rowNumber - 1}.`;

      case 'DELETE_ROW':
        return `Item "${change.itemName}" (Row ${change.rowNumber}) has been deleted.`;

      case 'CHANGE_SPARE_PERCENTAGE':
        return `Spare percentage changed globally from ${change.oldValue}% to ${change.newValue}%.`;

      case 'EDIT_PROFILE':
        return `Profile for "${change.itemName}" changed from "${change.oldProfileName}" to "${change.newProfileName}".`;

      case 'REORDER_ROW':
        return `Item "${change.itemName}" moved from ${change.oldValue} to ${change.newValue}.`;
      
      case 'EDIT_SPARE_QUANTITY':
        return `Manual spare quantity for "${change.itemName}" (Row ${change.rowNumber}) changed from ${change.oldValue} to ${change.newValue}.`;

      case 'CHANGE_ALUMINUM_RATE':
        return `Global aluminum rate changed from ₹${change.oldValue} to ₹${change.newValue}.`;

      case 'EDIT_ALUMINUM_RATE_OVERRIDE':
        return `Aluminum rate for "${change.itemName}" (Row ${change.rowNumber}) changed from ₹${change.oldValue} to ₹${change.newValue}.`;

      case 'EDIT_COST_PER_PIECE':
        return `Cost per piece for "${change.itemName}" (Row ${change.rowNumber}) changed from ₹${change.oldValue} to ₹${change.newValue}.`;

      case 'EDIT_MATERIAL':
        return change.sunrackCode
          ? `Material for "${change.itemName}" (Sunrack Code: ${change.sunrackCode}, Row ${change.rowNumber}) changed from "${change.oldValue}" to "${change.newValue}".`
          : `Material for "${change.itemName}" (Row ${change.rowNumber}) changed from "${change.oldValue}" to "${change.newValue}".`;

      case 'CHANGE_MODULE_WP':
        return `Module Wp changed globally from ${change.oldValue}W to ${change.newValue}W.`;

      default:
        return 'Change recorded';
    }
  };

  return (
    <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg shadow-sm print:border-black print:bg-white print:mt-4 print:p-0 print:border-l-0">
      <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center gap-2 print:text-black print:uppercase print:border-b print:border-black print:pb-2">
        <svg className="w-6 h-6 print:hidden" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        DISCLAIMERS - Changes in BOM
      </h3>

      <div className="space-y-4 print:space-y-2">
        {changeLog.map((change, index) => (
          <div key={change.id || index} className="border-l-2 border-yellow-600 pl-4 pb-1 print:border-l-0 print:pl-0">
            <p className="text-sm text-gray-800 mb-1 print:text-black font-medium">
              • {formatChangeMessage(change)}
            </p>
            <p className="text-sm text-gray-700 ml-2 print:text-black print:ml-4">
              <span className="font-semibold">Reason:</span> {change.reason}
            </p>
            <p className="text-xs text-gray-500 ml-2 mt-1 print:text-gray-600 print:ml-4">
              Modified on: {new Date(change.timestamp).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
