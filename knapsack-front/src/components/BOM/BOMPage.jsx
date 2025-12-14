// src/components/BOM/BOMPage.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BOMTable from './BOMTable';
import ComboBox from '../ComboBox';
import { bomAPI } from '../../services/api';

export default function BOMPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bomData, setBomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);  // NEW
  const [selectedRow, setSelectedRow] = useState(null);  // NEW
  const [profiles, setProfiles] = useState([]);  // NEW
  const [aluminumRate, setAluminumRate] = useState(527.85);  // NEW: Aluminum rate per kg
  const [changeLog, setChangeLog] = useState([]); // NEW: for edit tracking
  const [isSaving, setIsSaving] = useState(false); // NEW: for save feedback

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
      // If item has weight data, recalculate cost
      if (item.wt !== null && item.wt !== undefined && item.wt > 0) {
        return {
          ...item,
          cost: item.wt * aluminumRate
        };
      }
      return item;
    });

    setBomData(updatedBomData);
  }, [aluminumRate, loading]);

  const handleBack = () => {
    navigate('/');
  };

  // Helper function to calculate weight and cost for an item
  const calculateWeightAndCost = (item, profile) => {
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
      result.cost = result.wt * aluminumRate;
    }

    return result;
  };

  const handleProfileChange = (profileSerialNumber) => {
    if (!selectedRow || !profileSerialNumber) return;

    const selectedProfile = profiles.find(p => p.serialNumber === profileSerialNumber);
    if (!selectedProfile) return;

    // Update bomData based on row type
    const updatedBomData = { ...bomData };

    if (selectedRow.calculationType === 'CUT_LENGTH') {
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
    } else if (selectedRow.calculationType === 'ACCESSORY') {
      // Update only the selected row
      updatedBomData.bomItems = bomData.bomItems.map(item => {
        if (item.sn === selectedRow.sn) {
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
    setSelectedRow(null);  // Deselect after update
  };

  const handleSaveChanges = async () => {
    const bomId = location.state?.bomId;
    if (!bomId) {
      alert('Cannot save changes: BOM ID is missing.');
      return;
    }

    setIsSaving(true);
    try {
      // Save the changes to backend
      await bomAPI.updateBOM(bomId, bomData, changeLog);

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
      setSelectedRow(null); // Clear selection
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
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Profile Selector - Show when edit mode is ON */}
          {editMode && (
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">
                  Select Profile:
                </label>
                <div className="flex-1 max-w-md">
                  <ComboBox
                    options={profileOptions}
                    value={selectedRow?.profileSerialNumber || ''}
                    onChange={handleProfileChange}
                    placeholder={selectedRow ? '-- Choose a profile --' : '-- Click a row to select --'}
                  />
                </div>
                {selectedRow && (
                  <span className="text-sm text-gray-600">
                    Selected Row: {selectedRow.sn}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* BOM Table with integrated Spare columns */}
          <BOMTable
            bomData={bomData}
            editMode={editMode}
            selectedRow={selectedRow}
            onRowSelect={setSelectedRow}
            aluminumRate={aluminumRate}
          />
        </div>
      </main>
    </div>
  );
}
