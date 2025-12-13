// src/components/BOM/BOMPage.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BOMTable from './BOMTable';

export default function BOMPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bomData, setBomData] = useState(null);
  const [editMode, setEditMode] = useState(false);  // NEW
  const [selectedRow, setSelectedRow] = useState(null);  // NEW
  const [profiles, setProfiles] = useState([]);  // NEW

  useEffect(() => {
    if (location.state?.bomData) {
      setBomData(location.state.bomData);

      // Extract profiles from bomData
      if (location.state.bomData.profilesMap) {
        const profilesList = Object.values(location.state.bomData.profilesMap);
        setProfiles(profilesList);
      }
    } else {
      // No data provided, redirect back to home
      console.warn('No BOM data provided, redirecting to home');
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleBack = () => {
    navigate('/');
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
          return {
            ...item,
            sunrackCode: selectedProfile.preferredRmCode || selectedProfile.sunrackCode,
            profileImage: selectedProfile.profileImagePath,
            itemDescription: selectedProfile.genericName,
            profileSerialNumber: profileSerialNumber
          };
        }
        return item;
      });
    } else if (selectedRow.calculationType === 'ACCESSORY') {
      // Update only the selected row
      updatedBomData.bomItems = bomData.bomItems.map(item => {
        if (item.sn === selectedRow.sn) {
          return {
            ...item,
            sunrackCode: selectedProfile.preferredRmCode || selectedProfile.sunrackCode,
            profileImage: selectedProfile.profileImagePath,
            itemDescription: selectedProfile.genericName,
            profileSerialNumber: profileSerialNumber
          };
        }
        return item;
      });
    }

    setBomData(updatedBomData);
    setSelectedRow(null);  // Deselect after update
  };

  if (!bomData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BOM...</p>
        </div>
      </div>
    );
  }

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
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
                editMode
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              {editMode ? 'Done Editing' : 'Enable Edit'}
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

          {/* Profile Selector - Show when edit mode is ON */}
          {editMode && (
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">
                  Select Profile:
                </label>
                <select
                  className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={selectedRow?.profileSerialNumber || ''}
                  onChange={(e) => handleProfileChange(e.target.value)}
                  disabled={!selectedRow}
                >
                  <option value="">
                    {selectedRow ? '-- Choose a profile --' : '-- Click a row to select --'}
                  </option>
                  {profiles.map(profile => (
                    <option key={profile.serialNumber} value={profile.serialNumber}>
                      {profile.genericName} ({profile.preferredRmCode || profile.sunrackCode || 'No Code'})
                    </option>
                  ))}
                </select>
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
          />
        </div>
      </main>
    </div>
  );
}
