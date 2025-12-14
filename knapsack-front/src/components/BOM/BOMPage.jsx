// src/components/BOM/BOMPage.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BOMTable from './BOMTable';
import ComboBox from '../ComboBox';
import AddRowModal from './AddRowModal';
import { bomAPI } from '../../services/api';

export default function BOMPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bomData, setBomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);  // NEW
  const [profiles, setProfiles] = useState([]);  // NEW
  const [sparePercentage, setSparePercentage] = useState(1);
  const [aluminumRate, setAluminumRate] = useState(527.85);  // NEW: Aluminum rate per kg
  const [changeLog, setChangeLog] = useState([]); // NEW: for edit tracking
  const [isSaving, setIsSaving] = useState(false); // NEW: for save feedback
  const [showAddModal, setShowAddModal] = useState(false); // NEW: Add row modal
  const [addAfterRow, setAddAfterRow] = useState(1); // NEW: Row number to add after (1-based)

  useEffect(() => {
    const loadBOM = async () => {
      try {
        setLoading(true);
        let data;
        let bomId = location.state?.bomId;

        if (bomId) {
          // Fetch BOM from database
          data = await bomAPI.getBOMById(bomId);
          setChangeLog(data.changeLog || []);
        } else if (location.state?.bomData) {
          // Fallback: Direct BOM data
          data = { bomData: location.state.bomData };
        } else {
          // No data provided, redirect
          console.warn('No BOM data or ID provided, redirecting to home');
          navigate('/');
          return;
        }

        if (data && data.bomData) {
          setBomData(data.bomData);

          // Extract profiles from bomData
          if (data.bomData.profilesMap) {
            const profilesList = Object.values(data.bomData.profilesMap);
            setProfiles(profilesList);
          }

          // Set initial aluminum rate from bomData if available
          if (data.bomData.aluminumRate) {
            setAluminumRate(data.bomData.aluminumRate);
          }
          // Set initial spare percentage from bomData if available
          if (typeof data.bomData.sparePercentage === 'number') {
            setSparePercentage(data.bomData.sparePercentage);
          }

          // Set default addAfterRow to last row number
          if (data.bomData.bomItems && data.bomData.bomItems.length > 0) {
            setAddAfterRow(data.bomData.bomItems.length);
          }
        } else {
          console.error('BOM data is missing or invalid.', data);
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to load BOM data:', error);
        alert('Failed to load BOM. It may have been deleted or an error occurred.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadBOM();
  }, [location.state, navigate]);

  // Recalculate costs when aluminum rate changes
  useEffect(() => {
    if (!bomData || loading) return;

    const updatedBomData = { ...bomData };
    updatedBomData.bomItems = bomData.bomItems.map(item => {
      const profile = bomData.profilesMap[item.profileSerialNumber];
      if (profile) {
        const weightCost = calculateWeightAndCost(item, profile, aluminumRate);
        return { ...item, ...weightCost };
      }
      return item;
    });

    setBomData(updatedBomData);
  }, [aluminumRate, loading]);

  // Recalculate all items when spare percentage changes
  useEffect(() => {
    if (!bomData || loading) return;

    const updatedBomData = { ...bomData };
    updatedBomData.bomItems = bomData.bomItems.map(item => {
      // For each item, recalculate spare, final total, weight and cost
      const totalQty = item.totalQuantity;
      const spareQty = Math.ceil(totalQty * (sparePercentage / 100));
      const finalTotal = totalQty + spareQty;

      const updatedItem = {
        ...item,
        spareQuantity: spareQty,
        finalTotal: finalTotal
      };

      const profile = bomData.profilesMap[updatedItem.profileSerialNumber];
      if (profile) {
        const weightCost = calculateWeightAndCost(updatedItem, profile, aluminumRate);
        return { ...updatedItem, ...weightCost };
      }

      return updatedItem;
    });

    setBomData(updatedBomData);
  }, [sparePercentage]);

  const handleBack = () => {
    navigate('/');
  };

  // Helper function to calculate weight and cost for an item
  const calculateWeightAndCost = (item, profile, aluRate) => {
    const result = {
      wtPerRm: null,
      rm: null,
      wt: null,
      cost: null
    };

    // Check if profile has cost_per_piece (for fasteners)
    if (profile.costPerPiece && profile.costPerPiece > 0) {
      result.cost = parseFloat(profile.costPerPiece) * item.finalTotal;
      return result;
    }

    // Weight-based calculation for aluminum profiles
    // Use item.length (for cut lengths) or profile.standardLength (for accessories)
    const lengthToUse = item.length || profile.standardLength;

    if (profile.designWeight && profile.designWeight > 0 && lengthToUse) {
      result.wtPerRm = parseFloat(profile.designWeight);
      result.rm = (lengthToUse / 1000) * item.finalTotal;  // Convert mm to meters
      result.wt = result.rm * result.wtPerRm;
      result.cost = result.wt * aluRate;
    }

    return result;
  };

  const handleProfileChange = (profileSerialNumber, itemToUpdate) => {
    if (!itemToUpdate || !profileSerialNumber) return;

    const selectedProfile = profiles.find(p => p.serialNumber === profileSerialNumber);
    if (!selectedProfile) return;

    // Update bomData based on row type
    const updatedBomData = { ...bomData };

    if (itemToUpdate.calculationType === 'CUT_LENGTH') {
      // Update ALL cut length rows with the same profile
      updatedBomData.bomItems = bomData.bomItems.map(item => {
        if (item.calculationType === 'CUT_LENGTH') {
          const updatedItem = {
            ...item,
            sunrackCode: selectedProfile.preferredRmCode || selectedProfile.sunrackCode,
            profileImage: selectedProfile.profileImagePath,
            itemDescription: selectedProfile.genericName,
            material: selectedProfile.material,
            profileSerialNumber: profileSerialNumber
          };

          // Recalculate weight and cost
          const weightCost = calculateWeightAndCost(updatedItem, selectedProfile);
          updatedItem.wtPerRm = weightCost.wtPerRm;
          updatedItem.rm = weightCost.rm;
          updatedItem.wt = weightCost.wt;
          updatedItem.cost = weightCost.cost;

          return updatedItem;
        }
        return item;
      });
    } else if (itemToUpdate.calculationType === 'ACCESSORY') {
      // Update only the selected row
      updatedBomData.bomItems = bomData.bomItems.map(item => {
        if (item.sn === itemToUpdate.sn) {
          const updatedItem = {
            ...item,
            sunrackCode: selectedProfile.preferredRmCode || selectedProfile.sunrackCode,
            profileImage: selectedProfile.profileImagePath,
            itemDescription: selectedProfile.genericName,
            material: selectedProfile.material,
            profileSerialNumber: profileSerialNumber
          };

          // Recalculate weight and cost
          const weightCost = calculateWeightAndCost(updatedItem, selectedProfile);
          updatedItem.wtPerRm = weightCost.wtPerRm;
          updatedItem.rm = weightCost.rm;
          updatedItem.wt = weightCost.wt;
          updatedItem.cost = weightCost.cost;

          return updatedItem;
        }
        return item;
      });
    }

    setBomData(updatedBomData);
  };

  const handleItemUpdate = (itemSn, field, value) => {
    const newBomItems = bomData.bomItems.map(item => {
      if (item.sn === itemSn) {
        let updatedItem = { ...item };

        // Initialize userEdits if it doesn't exist
        if (!updatedItem.userEdits) {
          updatedItem.userEdits = {};
        }

        // Update the specific field that was changed
        if (field.startsWith('quantity_')) {
          const tabName = field.split('_')[1];
          updatedItem.quantities = { ...updatedItem.quantities, [tabName]: Number(value) || 0 };
        } else if (field === 'spareQuantity') {
          // Manual spare quantity override
          const manualSpare = Number(value) || 0;
          updatedItem.spareQuantity = manualSpare;
          updatedItem.userEdits = { ...updatedItem.userEdits, manualSpareQuantity: manualSpare };
        } else if (field === 'resetSpare') {
          // Reset manual spare override - remove from userEdits
          const { manualSpareQuantity, ...restEdits } = updatedItem.userEdits;
          updatedItem.userEdits = Object.keys(restEdits).length > 0 ? restEdits : null;
        }

        // Recalculate derived fields for the updated item
        const totalQty = Object.values(updatedItem.quantities).reduce((sum, q) => sum + q, 0);
        updatedItem.totalQuantity = totalQty;

        // If a building quantity was changed OR spare was reset, recalculate spare based on global percentage
        if (field.startsWith('quantity_') || field === 'resetSpare') {
          // Check if there's a manual override
          if (updatedItem.userEdits?.manualSpareQuantity !== undefined) {
            // Keep manual override
            updatedItem.spareQuantity = updatedItem.userEdits.manualSpareQuantity;
          } else {
            // Auto-calculate from percentage
            updatedItem.spareQuantity = Math.ceil(totalQty * (sparePercentage / 100));
          }
        }

        const finalTotal = totalQty + updatedItem.spareQuantity;
        updatedItem.finalTotal = finalTotal;

        // Recalculate weight and cost
        const profile = bomData.profilesMap[updatedItem.profileSerialNumber];
        if (profile) {
          const weightCost = calculateWeightAndCost(updatedItem, profile, aluminumRate);
          updatedItem = { ...updatedItem, ...weightCost };
        }

        return updatedItem;
      }
      return item;
    });

    setBomData({ ...bomData, bomItems: newBomItems });
  };

  const handleAddRowClick = () => {
    setShowAddModal(true);
  };

  const handleAddRowConfirm = (newItemData) => {
    const profile = profiles.find(p => p.serialNumber === newItemData.profileSerialNumber);
    if (!profile) {
      alert('Profile not found');
      return;
    }

    console.log('Selected profile for add row:', profile);
    console.log('Profile has designWeight:', profile.designWeight);
    console.log('Profile has standardLength:', profile.standardLength);
    console.log('Profile has costPerPiece:', profile.costPerPiece);
    console.log('Custom length provided:', newItemData.customLength);

    // Validate addAfterRow
    const maxRow = bomData.bomItems.length;
    const insertAfter = Math.max(0, Math.min(addAfterRow, maxRow));

    // Calculate totals
    const totalQty = Object.values(newItemData.quantities).reduce((sum, qty) => sum + qty, 0);
    const spareQty = Math.ceil(totalQty * (sparePercentage / 100));
    const finalTotal = totalQty + spareQty;

    // Create new item
    const newItem = {
      sn: insertAfter + 1, // Temporary SN
      profileSerialNumber: newItemData.profileSerialNumber,
      sunrackCode: profile.preferredRmCode || profile.sunrackCode,
      profileImage: profile.profileImagePath,
      itemDescription: profile.genericName,
      material: profile.material,
      length: newItemData.customLength,
      uom: profile.uom,
      calculationType: newItemData.customLength ? 'CUT_LENGTH' : 'ACCESSORY',
      quantities: newItemData.quantities,
      totalQuantity: totalQty,
      spareQuantity: spareQty,
      finalTotal: finalTotal,
      userEdits: {
        addedManually: true,
        reason: newItemData.reason
      }
    };

    // Calculate weight and cost
    const weightCost = calculateWeightAndCost(newItem, profile, aluminumRate);
    console.log('Calculated weight and cost:', weightCost);
    newItem.wtPerRm = weightCost.wtPerRm;
    newItem.rm = weightCost.rm;
    newItem.wt = weightCost.wt;
    newItem.cost = weightCost.cost;

    // Insert into array at the specified position
    const updatedItems = [...bomData.bomItems];
    updatedItems.splice(insertAfter, 0, newItem);

    // Renumber all S.N
    updatedItems.forEach((item, index) => {
      item.sn = index + 1;
    });

    // Add to change log
    const newChangeLog = [...changeLog, {
      type: 'ADD_ROW',
      itemName: newItem.itemDescription,
      rowNumber: insertAfter + 1,
      reason: newItemData.reason,
      timestamp: new Date().toISOString()
    }];

    setBomData({ ...bomData, bomItems: updatedItems });
    setChangeLog(newChangeLog);
    setShowAddModal(false);

    // Reset addAfterRow to new last row
    setAddAfterRow(updatedItems.length);
  };

  const handleSaveChanges = async () => {
    const bomId = location.state?.bomId;
    if (!bomId) {
      alert('Cannot save changes: BOM ID is missing.');
      return;
    }

    setIsSaving(true);
    try {
      // Construct a clean data object to save, sending only what the backend needs.
      const dataToSave = {
        projectInfo: bomData.projectInfo,
        tabs: bomData.tabs,
        panelCounts: bomData.panelCounts,
        bomItems: bomData.bomItems,
        aluminumRate: aluminumRate,
        sparePercentage: sparePercentage,
      };

      // Save the changes to backend
      await bomAPI.updateBOM(bomId, dataToSave, changeLog);

      // Reload the BOM from backend to get recalculated weights and costs
      const freshData = await bomAPI.getBOMById(bomId);

      if (freshData && freshData.bomData) {
        setBomData(freshData.bomData);
        setChangeLog(freshData.changeLog || []);

        // Update profiles list
        if (freshData.bomData.profilesMap) {
          const profilesList = Object.values(freshData.bomData.profilesMap);
          setProfiles(profilesList);
        }

        // Update aluminum rate
        if (freshData.bomData.aluminumRate) {
          setAluminumRate(freshData.bomData.aluminumRate);
        }
      }

      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert(`Failed to save changes: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEditMode = () => {
    if (editMode) {
      // Exiting edit mode, so save changes
      handleSaveChanges();
    }
    setEditMode(!editMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BOM...</p>
        </div>
      </div>
    );
  }

  if (!bomData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600">Could not load BOM data. It might have been deleted or is invalid.</p>
          <button onClick={handleBack} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const profileOptions = profiles.map(profile => ({
    value: profile.serialNumber,
    label: `${profile.genericName} (${profile.preferredRmCode || profile.sunrackCode || 'No Code'})`
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-gray-700"
              title="Back to main page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bill of Materials (BOM)</h1>
              <p className="text-sm text-gray-600">{bomData.projectInfo.projectName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* NEW: Enable Edit Button */}
            <button
              onClick={handleToggleEditMode}
              disabled={isSaving}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
                editMode
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'text-gray-700 border-gray-300 hover:bg-gray-50'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  {editMode ? 'Done Editing' : 'Enable Edit'}
                </>
              )}
            </button>

            <button
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              onClick={() => window.print()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                  clipRule="evenodd"
                />
              </svg>
              Print
            </button>
          </div>
        </div>
      </header>

      {/* BOM Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Project Info Bar */}
          <div className="bg-linear-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{bomData.projectInfo.projectName}</h2>
                <p className="text-sm text-purple-100">
                  {bomData.projectInfo.totalTabs} Building{bomData.projectInfo.totalTabs > 1 ? 's' : ''} | {bomData.bomItems.length} Items
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-100">Generated</p>
                <p className="text-sm font-medium">
                  {new Date(bomData.projectInfo.generatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Settings Bar - Always visible */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-6">
              {/* Aluminum Rate Input */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Aluminum Rate (₹/kg):
                </label>
                <input
                  type="number"
                  value={aluminumRate}
                  onChange={(e) => setAluminumRate(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  disabled={!editMode}
                  className={`w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Spare Percentage Input */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Spare %:
                </label>
                <input
                  type="number"
                  value={sparePercentage}
                  onChange={(e) => setSparePercentage(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                  disabled={!editMode}
                  className={`w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Add Row Section - Only visible in edit mode */}
              {editMode && (
                <>
                  <div className="h-8 w-px bg-gray-300"></div>

                  {/* Add After Input */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      Add After:
                    </label>
                    <input
                      type="number"
                      value={addAfterRow}
                      onChange={(e) => setAddAfterRow(parseInt(e.target.value) || 1)}
                      min="0"
                      max={bomData.bomItems.length}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Add Row Button */}
                  <button
                    onClick={handleAddRowClick}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-semibold"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Row
                  </button>
                </>
              )}
            </div>
          </div>

          {/* BOM Table with integrated Spare columns */}
          <BOMTable
            bomData={bomData}
            editMode={editMode}
            onProfileChange={handleProfileChange}
            profileOptions={profileOptions}
            onItemUpdate={handleItemUpdate}
            aluminumRate={aluminumRate}
            sparePercentage={sparePercentage}
          />
        </div>
      </main>

      {/* Add Row Modal */}
      <AddRowModal
        isOpen={showAddModal}
        afterRowNumber={addAfterRow}
        profiles={profiles}
        tabs={bomData.tabs}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddRowConfirm}
      />
    </div>
  );
}
