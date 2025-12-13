// src/components/BOM/CreateBOMButton.jsx
import { useNavigate } from 'react-router-dom';
import { collectBOMData, getActiveCutLengths } from '../../services/bomDataCollection';
import { generateCompleteBOM } from '../../services/bomCalculations';

export default function CreateBOMButton({ tabsData, projectName }) {
  const navigate = useNavigate();

  const handleCreateBOM = async () => {
    try {
      // Collect data from all tabs
      const bomData = collectBOMData(tabsData, projectName);

      // Get active cut lengths (non-zero)
      const activeCutLengths = getActiveCutLengths(bomData);

      // Generate complete BOM structure (NOW ASYNC!)
      const completeBOM = await generateCompleteBOM(bomData, activeCutLengths);

      // Navigate to BOM page with data
      navigate('/bom', { state: { bomData: completeBOM } });
    } catch (error) {
      console.error('Error generating BOM:', error);
      alert('Failed to generate BOM. Please check the console for details.');
    }
  };

  return (
    <div className="mt-6 flex justify-center">
      <button
        onClick={handleCreateBOM}
        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-3"
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
        <span>Create BOM</span>
      </button>
    </div>
  );
}
