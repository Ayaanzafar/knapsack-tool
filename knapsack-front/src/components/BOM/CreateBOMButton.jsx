// src/components/BOM/CreateBOMButton.jsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collectBOMData, getActiveCutLengths } from '../../services/bomDataCollection';
import { generateCompleteBOM } from '../../services/bomCalculations';
import { bomAPI, savedBomAPI } from '../../services/api';
import { getCurrentProjectId } from '../../lib/tabStorageAPI';
import { useAuth } from '../../context/AuthContext';


export default function CreateBOMButton({ tabsData, projectName, longRailVariation, moduleWp }) {
  const navigate = useNavigate();
  const { appDefaults } = useAuth();
  const [hasSavedBom, setHasSavedBom] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if saved BOM exists
  useEffect(() => {
    const checkSavedBom = async () => {
      const projectId = getCurrentProjectId();
      if (!projectId) return;

      try {
        const result = await savedBomAPI.checkSavedBomExists(projectId);
        setHasSavedBom(result.exists);
      } catch (error) {
        console.error('Error checking saved BOM:', error);
      }
    };

    checkSavedBom();
  }, []);

  const handleCreateBOMClick = () => {
    if (hasSavedBom) {
      // Show warning if saved BOM exists
      setShowWarning(true);
    } else {
      // Create BOM directly
      handleCreateBOM();
    }
  };

  const handleCreateBOM = async () => {
    try {
      setIsLoading(true);
      // Get project ID
      const projectId = getCurrentProjectId();
      if (!projectId) {
        throw new Error('Project ID not found. Cannot save BOM.');
      }

      // Delete saved BOM if exists (overwrite)
      if (hasSavedBom) {
        await savedBomAPI.deleteSavedBom(projectId);
        setHasSavedBom(false);
      }

      // Collect data from all tabs — prefer admin-configured default over stale project-level value
      const effectiveModuleWp = appDefaults?.bomDefaults?.moduleWp ?? moduleWp;
      const bomData = collectBOMData(tabsData, projectName, longRailVariation, effectiveModuleWp);

      // Get active cut lengths (non-zero)
      const activeCutLengths = getActiveCutLengths(bomData);

      // Generate complete BOM structure (NOW ASYNC!)
      const generatedBOM = await generateCompleteBOM(bomData, activeCutLengths);

      // MERGE original bomData (with tabs, panelCounts, projectInfo) with generated items
      const completeBOM = {
        ...bomData,
        ...generatedBOM
      };

      // Save to database
      const savedBOM = await bomAPI.saveBOM(projectId, completeBOM);

      // Navigate to BOM page with bomId
      navigate('/bom', { state: { bomId: savedBOM.bomId } });
    } catch (error) {
      console.error('Error generating or saving BOM:', error);
      alert('Failed to create or save BOM. Please check the console for details.');
    } finally {
      setIsLoading(false);
      setShowWarning(false);
    }
  };

  const handleShowSavedBOM = async () => {
    try {
      const projectId = getCurrentProjectId();
      if (!projectId) {
        throw new Error('Project ID not found.');
      }

      const savedBom = await savedBomAPI.getSavedBom(projectId);

      // Navigate to BOM page with saved BOM data AND projectId
      navigate('/bom', {
        state: {
          bomData: savedBom.bomData,
          projectId: projectId,
          savedBomId: savedBom.id,
          changeLog: savedBom.changeLog || [],
          userNotes: savedBom.userNotes || []
        }
      });
    } catch (error) {
      console.error('Error loading saved BOM:', error);
      alert('Failed to load saved BOM.');
    }
  };

  return (
    <>
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={handleCreateBOMClick}
          disabled={isLoading}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          <span>{isLoading ? 'Creating...' : 'Create BOM'}</span>
        </button>

        {hasSavedBom && (
          <button
            onClick={handleShowSavedBOM}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9 4a1 1 0 102 0 1 1 0 00-2 0zm-3-1a1 1 0 00-1 1v3a1 1 0 002 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Show Last Saved BOM</span>
          </button>
        )}
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowWarning(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create New BOM?</h3>
              </div>
            </div>
            <div className="text-gray-700 mb-6 space-y-3">
              <p className="text-base">
                Do you want to create a new BOM?
              </p>
              <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                <strong>Warning:</strong> This will overwrite the previously saved BOM.
              </p>
              <p className="text-sm text-gray-600">
                Do you want to continue?
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWarning(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBOM}
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
