import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { savedBomAPI, projectAPI, bomAPI, tabAPI, rowAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { setCurrentProjectId } from '../lib/tabStorageAPI';
import BOMTable from '../components/BOM/BOMTable';
import ChangeLogDisplay from '../components/BOM/ChangeLogDisplay';
import NotesSection from '../components/BOM/NotesSection';
import PrintSettingsModal from '../components/BOM/PrintSettingsModal';
import {
  DEFAULT_ALUMINIUM_RATE_PER_KG,
  DEFAULT_SPARE_PERCENTAGE,
  DEFAULT_MODULE_WP
} from '../constants/bomDefaults';

export default function AdminBOMView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get currently logged-in admin
  const [bomData, setBomData] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [changeLog, setChangeLog] = useState([]);
  const [userNotes, setUserNotes] = useState([]);
  const [savedBy, setSavedBy] = useState(null);
  const [printSettingsModalOpen, setPrintSettingsModalOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadBOM();
  }, [projectId]);

  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 3500);
  };

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
        console.log('AdminBOMView - Loaded savedBom:', savedBom);
        console.log('AdminBOMView - savedBom.userNotes:', savedBom.userNotes);
        console.log('AdminBOMView - savedBom.changeLog:', savedBom.changeLog);

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

  const handlePrintSettings = (settings, action) => {
    if (action === 'preview') {
      navigate('/bom/print-preview', {
        state: {
          bomData,
          printSettings: settings,
          aluminumRate,
          sparePercentage,
          moduleWp,
          changeLog,
          userNotes
        }
      });
    } else if (action === 'direct') {
      navigate('/bom/print-preview', {
        state: {
          bomData,
          printSettings: settings,
          aluminumRate,
          sparePercentage,
          moduleWp,
          changeLog,
          userNotes,
          autoPrint: true
        }
      });
    } else if (action === 'pdf') {
      // PDF export functionality can be added here if needed
      console.log('PDF export not implemented yet');
    }
    setPrintSettingsModalOpen(false);
  };

  const handleCopyBOM = async () => {
    if (!user) {
      showToast('You must be logged in to copy this BOM', 'error');
      return;
    }

    if (!confirm('This will create a copy of this BOM under your account. Do you want to continue?')) {
      return;
    }

    try {
      setCopying(true);

      // Step 1: Get the full original project with all tabs and rows
      const originalProjectFull = await projectAPI.getWithDetails(projectId);
      console.log('Original project with tabs and rows:', originalProjectFull);

      // Step 2: Create a new project under current admin's account
      const newProject = await projectAPI.create({
        name: `${projectInfo?.name || 'Copied Project'} (Copy)`,
        clientName: projectInfo?.clientName || bomData?.projectInfo?.clientName || '',
        projectId: projectInfo?.projectId || bomData?.projectInfo?.projectId || '',
        longRailVariation: projectInfo?.longRailVariation || bomData?.projectInfo?.longRailVariation || 'U Cleat Long Rail',
        userId: user.id // Current admin's ID
      });

      console.log('Created new project:', newProject);

      // Step 3: Copy all tabs and their rows
      if (originalProjectFull.tabs && originalProjectFull.tabs.length > 0) {
        for (const originalTab of originalProjectFull.tabs) {
          // Create new tab with all settings
          const newTab = await tabAPI.create(newProject.id, {
            name: originalTab.name,
            settings: {
              moduleLength: originalTab.moduleLength,
              moduleWidth: originalTab.moduleWidth,
              frameThickness: originalTab.frameThickness,
              midClamp: originalTab.midClamp,
              endClampWidth: originalTab.endClampWidth,
              buffer: originalTab.buffer,
              purlinDistance: originalTab.purlinDistance,
              railsPerSide: originalTab.railsPerSide,
              lengthsInput: originalTab.lengthsInput,
              enabledLengths: originalTab.enabledLengths,
              maxPieces: originalTab.maxPieces,
              maxWastePct: originalTab.maxWastePct,
              alphaJoint: originalTab.alphaJoint,
              betaSmall: originalTab.betaSmall,
              allowUndershootPct: originalTab.allowUndershootPct,
              gammaShort: originalTab.gammaShort,
              costPerMm: originalTab.costPerMm,
              costPerJointSet: originalTab.costPerJointSet,
              joinerLength: originalTab.joinerLength,
              priority: originalTab.priority,
              userMode: originalTab.userMode,
              enableSB2: originalTab.enableSb2
            }
          });

          console.log('Created new tab:', newTab);

          // Copy all rows for this tab
          if (originalTab.rows && originalTab.rows.length > 0) {
            for (const originalRow of originalTab.rows) {
              await rowAPI.create(newTab.id, {
                rowNumber: originalRow.rowNumber,
                modules: originalRow.modules,
                quantity: originalRow.quantity,
                supportBase1: originalRow.supportBase1,
                supportBase2: originalRow.supportBase2
              });
            }
            console.log(`Copied ${originalTab.rows.length} rows to new tab`);
          }
        }
      }

      // Step 4: Copy the BOM data with all settings
      const copiedBomData = {
        ...bomData,
        projectInfo: {
          ...bomData.projectInfo,
          projectName: `${projectInfo?.name || 'Copied Project'} (Copy)`,
          generatedAt: new Date().toISOString()
        },
        aluminumRate: aluminumRate,
        sparePercentage: sparePercentage,
        moduleWp: moduleWp
      };

      // Step 5: Save the copied BOM to the new project
      const savedBOM = await bomAPI.saveBOM(newProject.id, copiedBomData);
      console.log('Saved BOM to new project:', savedBOM);

      // Step 6: Save the BOM snapshot with changeLog and userNotes
      await savedBomAPI.saveBomSnapshot(
        newProject.id,
        copiedBomData,
        userNotes || [],
        changeLog || []
      );

      console.log('Saved BOM snapshot with notes and changelog');

      // Step 7: Set the current project ID in storage (so "back" button works correctly)
      setCurrentProjectId(newProject.id);

      // Step 8: Navigate to BOM page with the copied BOM - load from savedBomAPI
      navigate('/bom', {
        state: {
          bomData: copiedBomData,
          projectId: newProject.id,
          savedBomId: null,
          changeLog: changeLog || [],
          userNotes: userNotes || []
        }
      });

    } catch (error) {
      console.error('Failed to copy BOM:', error);
      showToast(`Failed to copy BOM: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setCopying(false);
    }
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

  // Get aluminum rate, spare percentage, and module Wp from bomData
  const aluminumRate = bomData.aluminumRate || DEFAULT_ALUMINIUM_RATE_PER_KG;
  const sparePercentage = bomData.sparePercentage || DEFAULT_SPARE_PERCENTAGE;
  const moduleWp = bomData.moduleWp || DEFAULT_MODULE_WP;

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

  console.log("AdminBOMView - userNotes:", userNotes);
  console.log("AdminBOMView - userNotes length:", userNotes?.length);

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



        {/* Summary Card */}
        <div className="bg-blue-50 shadow rounded-lg p-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {((Object.values(panelCounts).reduce((a, b) => a + b, 0) * moduleWp) / 1000).toFixed(2)} kWp
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500">Cost/Wp</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{formatNumber(
                  totals.totalCost / (Object.values(panelCounts).reduce((a, b) => a + b, 0) * moduleWp)
                )}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">₹ {formatNumber(totals.totalCost)}</p>
            </div>
          </div>
        </div>

        {/* Notes Section (always show - includes default notes) */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <NotesSection
            userNotes={userNotes || []}
            onNotesChange={() => {}}
            editMode={false}
          />
        </div>

        {/* Back, Copy, and Print Buttons at Bottom */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Admin Panel
          </button>

          <button
            onClick={handleCopyBOM}
            disabled={copying}
            className={`px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium flex items-center gap-2 ${copying ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
              <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
            </svg>
            {copying ? 'Copying...' : 'Copy this BOM'}
          </button>

          <button
            onClick={() => setPrintSettingsModalOpen(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Print BOM
          </button>
        </div>
      </main>

      {/* Print Settings Modal */}
      <PrintSettingsModal
        isOpen={printSettingsModalOpen}
        onClose={() => setPrintSettingsModalOpen(false)}
        onPrint={handlePrintSettings}
        bomData={bomData}
        aluminumRate={aluminumRate}
        sparePercentage={sparePercentage}
        moduleWp={moduleWp}
        changeLog={changeLog}
        userNotes={userNotes}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`text-white text-sm px-4 py-2 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' :
            toast.type === 'error' ? 'bg-red-600' :
            toast.type === 'warning' ? 'bg-yellow-600' :
            'bg-gray-900'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
