// src/components/BOM/ReviewChangesModal.jsx
import { useState, useMemo, useEffect } from 'react';

export default function ReviewChangesModal({ isOpen, changes, bomData, originalBomData, onCancel, onConfirm }) {
  const [reasons, setReasons] = useState({});
  const [updateMasterMap, setUpdateMasterMap] = useState({});

  const allChanges = useMemo(() => {
    if (!isOpen) return [];
    
    const updates = changes.updates || [];
    const additions = (changes.additions || []).map(item => ({
      id: item._id,
      type: 'ADD_ROW',
      itemName: item.itemDescription,
      rowNumber: item.sn,
      oldValue: 'N/A',
      newValue: 'Added',
      reason: item.userEdits?.reason,
      ...item
    }));
    const deletions = (changes.deletions || []).map(deletion => {
      const deletedItem = originalBomData.bomItems.find(item => item._id === deletion.rowId);
      return {
        id: deletion.rowId,
        type: 'DELETE_ROW',
        itemName: deletedItem?.itemDescription || `Item ID: ${deletion.rowId}`,
        rowNumber: deletedItem?.sn || 'N/A',
        oldValue: 'Present',
        newValue: 'Deleted',
        reason: deletion.reason,
      };
    });

    return [...updates, ...additions, ...deletions];
  }, [isOpen, changes, bomData, originalBomData]);

  useEffect(() => {
    if (isOpen) {
      const initialReasons = {};
      allChanges.forEach(change => {
        if (change.reason) {
          initialReasons[change.id] = change.reason;
        }
      });
      setReasons(initialReasons);
    }
  }, [isOpen, allChanges]);

  if (!isOpen) return null;

  const handleReasonChange = (id, value) => {
    setReasons(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleUpdateMasterChange = (id, checked) => {
    setUpdateMasterMap(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const isFormValid = () => {
    return allChanges.every(change => {
      const reason = reasons[change.id];
      return reason && reason.trim().length > 0;
    });
  };

  const handleConfirm = () => {
    if (!isFormValid()) {
      alert('Please provide a reason for every change.');
      return;
    }

    const changesWithReasons = allChanges.map(change => ({
      ...change,
      reason: reasons[change.id],
      updateMaster: updateMasterMap[change.id] || false
    }));

    onConfirm(changesWithReasons);
    setReasons({});
    setUpdateMasterMap({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-purple-600 text-white px-6 py-4 rounded-t-lg shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Review Changes
          </h2>
          <p className="text-purple-100 text-sm mt-1">
            Please review the changes made and provide a reason for each.
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Item Details</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Location</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Change</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Update Master DB?</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Reason <span className="text-red-500">*</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allChanges.map((change) => (
                <tr key={change.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{change.itemName}</div>
                    <div className="text-xs text-gray-500">Row {change.rowNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 font-medium">
                    {change.tabName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">{change.oldValue}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">{change.newValue}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {change.type === 'EDIT_COST_PER_PIECE' && (
                      <div className="flex flex-col items-center">
                        <input
                          type="checkbox"
                          checked={updateMasterMap[change.id] || false}
                          onChange={(e) => handleUpdateMasterChange(change.id, e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                        />
                        <span className="text-[10px] text-gray-500 mt-1">Apply to Future</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={reasons[change.id] || ''}
                      onChange={(e) => handleReasonChange(change.id, e.target.value)}
                      placeholder="Why was this changed?"
                      disabled={change.type === 'ADD_ROW' || change.type === 'DELETE_ROW'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t shrink-0 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Go Back & Edit
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isFormValid()}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors shadow-sm flex items-center gap-2 ${
              isFormValid() 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Confirm & Save Changes</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
