// src/components/BOM/ReviewChangesModal.jsx
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ReviewChangesModal({ isOpen, changes, defaultNotesChanges = [], bomData, originalBomData, onCancel, onConfirm, showToast }) {
  const { user } = useAuth();
  const [reasons, setReasons] = useState({});
  const [updateMasterMap, setUpdateMasterMap] = useState({});
  const [materialUpdateChoice, setMaterialUpdateChoice] = useState({});
  const [defaultNotesUpdateChoice, setDefaultNotesUpdateChoice] = useState('bom-only'); // 'global' or 'bom-only'

  // Check if user is ADMIN or MANAGER
  const canUpdateMaster = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const hasDefaultNotesChanges = defaultNotesChanges && defaultNotesChanges.length > 0;

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

  useEffect(() => {
    if (isOpen) {
      const initialChoices = {};
      allChanges.forEach(change => {
        if (change.type === 'EDIT_MATERIAL') {
          initialChoices[change.id] = 'current';
        }
      });
      setMaterialUpdateChoice(initialChoices);
    }
  }, [isOpen, allChanges]);

  if (!isOpen) return null;

  // Helper function to get a human-readable name for change types
  const getChangeTypeName = (type) => {
    const typeMap = {
      'CHANGE_MODULE_WP': 'Module Wp',
      'CHANGE_SPARE_PERCENTAGE': 'Spare %',
      'CHANGE_ALUMINUM_RATE': 'Aluminium Rate (₹/kg)',
      'CHANGE_HDG_RATE': 'HDG Rate (₹/kg)',
      'CHANGE_MAGNELIS_RATE': 'Magnelis Rate (₹/kg)',
    };
    return typeMap[type] || type;
  };

  // Helper function to get column name for item-specific changes
  const getColumnName = (type) => {
    const columnMap = {
      'EDIT_PROFILE': 'Item Description',
      'EDIT_SPARE_QUANTITY': 'Spare Quantity',
      'EDIT_COST_PER_PIECE': 'Rate/Piece',
      'EDIT_ALUMINUM_RATE_OVERRIDE': 'Rate per Unit Wt',
      'EDIT_MATERIAL': 'Material',
      'EDIT_FASTENER_MATERIAL': 'Material',
      'EDIT_QUANTITY': 'Quantity',
    };
    return columnMap[type] || 'Item';
  };

  // Check if any change requires the "Update Master DB?" option
  const hasUpdateMasterChanges = allChanges.some(change => change.type === 'EDIT_COST_PER_PIECE');

  // Check if any change is a material edit
  const hasMaterialChanges = allChanges.some(change => change.type === 'EDIT_MATERIAL');

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

  const handleMaterialUpdateChoiceChange = (id, choice) => {
    setMaterialUpdateChoice(prev => ({
      ...prev,
      [id]: choice
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
      showToast?.('Please provide a reason for every change.', 'warning');
      return;
    }

    const changesWithReasons = allChanges.map(change => ({
      ...change,
      reason: reasons[change.id],
      updateMaster: updateMasterMap[change.id] || false,
      materialUpdateChoice: change.type === 'EDIT_MATERIAL'
        ? (materialUpdateChoice[change.id] || 'current')
        : undefined
    }));

    onConfirm(changesWithReasons, {
      defaultNotesChanges,
      defaultNotesUpdateChoice: hasDefaultNotesChanges ? defaultNotesUpdateChoice : null
    });
    setReasons({});
    setUpdateMasterMap({});
    setMaterialUpdateChoice({});
    setDefaultNotesUpdateChoice('bom-only');
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
                {hasUpdateMasterChanges && canUpdateMaster && (
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Update Master DB?</th>
                )}
                {hasMaterialChanges && (
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Update Scope</th>
                )}
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Reason <span className="text-red-500">*</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allChanges.map((change) => {
                // Check if this is a global parameter change
                const isGlobalChange = change.type && change.type.startsWith('CHANGE_');
                const displayName = isGlobalChange ? getChangeTypeName(change.type) : change.itemName;

                // Determine location display
                let displayLocation;
                if (isGlobalChange) {
                  displayLocation = 'Global';
                } else if (change.tabName) {
                  displayLocation = change.tabName;
                } else if (!change.tabName && change.rowNumber) {
                  // Item-specific change - show column name (tabName is null or undefined)
                  displayLocation = getColumnName(change.type);
                } else {
                  displayLocation = '-';
                }

                return (
                  <tr key={change.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{displayName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      <div className="font-medium">{displayLocation}</div>
                      {!isGlobalChange && change.rowNumber && (
                        <div className="text-xs text-gray-500 mt-0.5">(Row {change.rowNumber})</div>
                      )}
                    </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                        {change.type === 'EDIT_PROFILE' ? change.oldProfileName : change.oldValue}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                        {change.type === 'EDIT_PROFILE' ? change.newProfileName : change.newValue}
                      </span>
                    </div>
                  </td>
                  {hasUpdateMasterChanges && canUpdateMaster && (
                    <td className="px-4 py-3 text-center">
                      {change.type === 'EDIT_COST_PER_PIECE' &&  (
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
                  )}
                  {hasMaterialChanges && (
                    <td className="px-4 py-3 text-center">
                      {change.type === 'EDIT_MATERIAL' && (() => {
                        const sunrackCode = change.sunrackCode
                          || bomData?.bomItems?.find(item => item.sn === change.rowNumber)?.sunrackCode;

                        return (
                          <div className="flex flex-col gap-2 items-start">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`material-scope-${change.id}`}
                                value="current"
                                checked={(materialUpdateChoice[change.id] || 'current') === 'current'}
                                onChange={() => handleMaterialUpdateChoiceChange(change.id, 'current')}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="text-xs">
                                Only &quot;{sunrackCode || 'this sunrack code'}&quot;
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`material-scope-${change.id}`}
                                value="all"
                                checked={materialUpdateChoice[change.id] === 'all'}
                                onChange={() => handleMaterialUpdateChoiceChange(change.id, 'all')}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="text-xs">
                                All Sunrack Codes
                              </span>
                            </label>
                          </div>
                        );
                      })()}
                    </td>
                  )}
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
                );
              })}
            </tbody>
          </table>

          {/* Default Notes Changes Section */}
          {hasDefaultNotesChanges && (
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Default Notes Changes
              </h3>

              {defaultNotesChanges.map((change, index) => (
                <div key={index} className="mb-3 pb-3 border-b border-yellow-200 last:border-0">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                    <span>Note {change.noteOrder}</span>
                    {change.type === 'ADD' && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">NEW</span>}
                    {change.type === 'DELETE' && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">DELETED</span>}
                    {change.type === 'EDIT' && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">EDITED</span>}
                  </div>

                  {change.type === 'ADD' && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs flex-1">
                        {change.newText}
                      </span>
                    </div>
                  )}

                  {change.type === 'DELETE' && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs flex-1 line-through">
                        {change.oldText}
                      </span>
                    </div>
                  )}

                  {change.type === 'EDIT' && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs flex-1">
                        {change.oldText}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs flex-1">
                        {change.newText}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-4 p-3 bg-white rounded-md border border-yellow-300">
                <p className="text-sm font-semibold text-gray-800 mb-3">⚠️ How do you want to save these default note changes?</p>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name="defaultNotesChoice"
                      value="global"
                      checked={defaultNotesUpdateChoice === 'global'}
                      onChange={(e) => setDefaultNotesUpdateChoice(e.target.value)}
                      className="mt-1 w-4 h-4 text-purple-600"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">Update This Variation (All Future BOMs)</div>
                      <div className="text-xs text-gray-600">Changes will be saved to this variation template’s default notes. Future BOMs for this variation will use these updated notes.</div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name="defaultNotesChoice"
                      value="bom-only"
                      checked={defaultNotesUpdateChoice === 'bom-only'}
                      onChange={(e) => setDefaultNotesUpdateChoice(e.target.value)}
                      className="mt-1 w-4 h-4 text-purple-600"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">Use for This BOM Only</div>
                      <div className="text-xs text-gray-600">Changes will be saved only for this specific BOM. Other BOMs will still use the template default notes.</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
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
