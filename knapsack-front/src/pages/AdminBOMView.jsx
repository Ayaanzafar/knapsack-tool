import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { savedBomAPI, projectAPI } from '../services/api';
import BOMTable from '../components/BOM/BOMTable';
import ChangeLogDisplay from '../components/BOM/ChangeLogDisplay';

export default function AdminBOMView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [bomData, setBomData] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [changeLog, setChangeLog] = useState([]);
  const [userNotes, setUserNotes] = useState([]);
  const [savedBy, setSavedBy] = useState(null);

  useEffect(() => {
    loadBOM();
  }, [projectId]);

  const loadBOM = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch project info and saved BOM in parallel
      const [project, savedBom] = await Promise.all([
        projectAPI.getById(projectId),
        savedBomAPI.getSavedBom(projectId)
      ]);

      if (savedBom && savedBom.bomData) {
        setBomData(savedBom.bomData);
        setChangeLog(savedBom.changeLog || []);
        setUserNotes(savedBom.userNotes || []);
        setSavedBy(savedBom.user);
        setProjectInfo(project);
      } else {
        setError('No saved BOM found for this project');
      }
    } catch (err) {
      console.error('Failed to load BOM:', err);
      if (err.response?.status === 404) {
        setError('No saved BOM found for this project');
      } else {
        setError('Failed to load BOM. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin', { state: { activeTab: 'boms' } });
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading BOM...</p>
        </div>
      </div>
    );
  }

  if (error || !bomData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'BOM not found'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Admin Panel
          </button>
        </div>
      </div>
    );
  }

  const { tabs = [], panelCounts = {}, bomItems = [] } = bomData;

  // Get aluminum rate and spare percentage from bomData
  const aluminumRate = bomData.aluminumRate || 527.85;
  const sparePercentage = bomData.sparePercentage || 1;

  // Calculate totals
  const totals = bomItems.reduce(
    (acc, item) => {
      acc.totalWeight += Number(item.wt || 0);
      acc.totalCost += Number(item.cost || 0);
      return acc;
    },
    { totalWeight: 0, totalCost: 0 }
  );

  // Dummy handlers for BOMTable (read-only mode)
  const handleProfileChange = () => {};
  const handleItemUpdate = () => {};
  const handleDeleteRow = () => {};
  const handleDragEnd = () => {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">BOM View (Read Only)</h1>
            <p className="text-sm text-gray-600 mt-1">Admin View - No Editing Allowed</p>
          </div>
          <button
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Admin Panel
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Project Info Card */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Project Name</p>
              <p className="font-medium text-gray-900">{projectInfo?.name || projectInfo?.projectName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Client Name</p>
              <p className="font-medium text-gray-900">{projectInfo?.clientName || bomData?.projectInfo?.clientName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Project ID</p>
              <p className="font-medium text-gray-900">{projectInfo?.projectId || bomData?.projectInfo?.projectId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Long Rail Variation</p>
              <p className="font-medium text-gray-900">{projectInfo?.longRailVariation || bomData?.projectInfo?.longRailVariation || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Buildings</p>
              <p className="font-medium text-gray-900">{tabs?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Panels</p>
              <p className="font-medium text-gray-900">{panelCounts?.grandTotal || 0}</p>
            </div>
          </div>

          {/* BOM Save Info */}
          {savedBy && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">BOM Save Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Saved By</p>
                  <p className="font-medium text-gray-900">{savedBy.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Changes Made</p>
                  <p className="font-medium text-gray-900">{changeLog?.length || 0} changes</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOM Items Table - Using BOMTable Component */}
        <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">BOM Items (Read-Only View)</h2>
            <p className="text-sm text-gray-600 mt-1">Same table format as BOMPage - Total Items: {bomItems.length}</p>
          </div>

          <BOMTable
            bomData={bomData}
            editMode={false}
            onProfileChange={handleProfileChange}
            profileOptions={[]}
            onItemUpdate={handleItemUpdate}
            aluminumRate={aluminumRate}
            sparePercentage={sparePercentage}
            onDeleteRow={handleDeleteRow}
            onDragEnd={handleDragEnd}
          />
        </div>

        {/* Change Log */}
        {changeLog && changeLog.length > 0 && (
          <div className="bg-white shadow rounded-lg mb-6 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Change History</h2>
            <ChangeLogDisplay changeLog={changeLog} />
          </div>
        )}

        {/* User Notes */}
        {userNotes && userNotes.length > 0 && (
          <div className="bg-white shadow rounded-lg mb-6 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Notes</h2>
            <div className="space-y-3">
              {userNotes.map((note, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                  <p className="text-sm text-gray-700">{note.text}</p>
                  {note.timestamp && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(note.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-blue-50 shadow rounded-lg p-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{bomItems.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Weight</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totals.totalWeight)} kg</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">₹ {formatNumber(totals.totalCost)}</p>
            </div>
          </div>
        </div>

        {/* Back Button at Bottom */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            ← Back to Admin Panel
          </button>
        </div>
      </main>
    </div>
  );
}
