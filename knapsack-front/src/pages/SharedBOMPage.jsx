import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import bomShareAPI from '../services/bomShareAPI';

export default function SharedBOMPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    accessSharedBom();
  }, [token]);

  const accessSharedBom = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await bomShareAPI.accessSharedBom(token);

      // Redirect to the project page with the shared BOM
      // Pass share info via state so we can show the shared banner
      navigate('/app', {
        state: {
          projectId: response.projectId,
          isSharedCopy: true,
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
