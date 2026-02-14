import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import bomShareAPI from '../services/bomShareAPI';
import { savedBomAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SharedBOMPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    handleShareAccess();
  }, [token, isAuthenticated]);

  const handleShareAccess = async () => {
    // If not authenticated, fetch preview and redirect to login
    if (!isAuthenticated) {
      try {
        const response = await bomShareAPI.getSharePreview(token);

        // Redirect to login with share preview info
        navigate('/', {
          state: {
            from: location,
            sharePreview: response.preview,
            shareToken: token
          },
          replace: true
        });
      } catch (error) {
        console.error('Failed to fetch share preview:', error);
        setError(error.message || 'Invalid or expired share link');
        setLoading(false);
      }
      return;
    }

    // If authenticated, proceed to access the shared BOM
    accessSharedBom();
  };

  const accessSharedBom = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Access the shared BOM (creates copy if needed)
      const response = await bomShareAPI.accessSharedBom(token);

      // Step 2: Fetch the actual BOM data from the saved BOM
      const savedBom = await savedBomAPI.getSavedBom(response.projectId);

      // Step 3: Navigate directly to BOM page with the actual BOM data
      navigate('/bom', {
        state: {
          bomData: savedBom.bomData,  // The actual BOM data
          savedBomId: response.bomId,
          projectId: response.projectId,
          userNotes: savedBom.userNotes,
          changeLog: savedBom.changeLog,
          isSharedCopy: !response.isSharer,  // True if recipient, false if sharer
          shareInfo: response.shareInfo,
          isFirstAccess: response.isFirstAccess
        },
        replace: true
      });
    } catch (error) {
      console.error('Failed to access shared BOM:', error);
      setError(error.message || 'Failed to access shared BOM');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading shared BOM...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we prepare your shared project</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-6xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Go to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
