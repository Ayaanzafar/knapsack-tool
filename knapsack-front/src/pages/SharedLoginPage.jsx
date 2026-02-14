import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bomShareAPI from '../services/bomShareAPI';

export default function SharedLoginPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sharePreview, setSharePreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/bom/shared/${token}`, { replace: true });
    }
  }, [isAuthenticated, token, navigate]);

  // Fetch share preview
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoadingPreview(true);
        const response = await bomShareAPI.getSharePreview(token);
        setSharePreview(response.preview);
      } catch (error) {
        console.error('Failed to fetch share preview:', error);
        setError('Invalid or expired share link');
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchPreview();
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { user: loggedInUser } = await login(username, password);
      if (loggedInUser.mustChangePassword) {
        navigate('/change-password');
      } else {
        // Redirect to the share link after successful login
        navigate(`/bom/shared/${token}`, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading share details...</p>
        </div>
      </div>
    );
  }

  if (error && !sharePreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Share Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center">
          <img
            src="/white_back_photo.svg"
            alt="Knapsack Tool"
            className="h-9 transition-transform hover:scale-105"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Share Invitation Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              📤 You've Been Invited!
            </h1>
            <p className="text-purple-100 text-lg">
              {sharePreview?.sharedBy.username} ({sharePreview?.sharedBy.role}) shared a BOM with{' '}
              {sharePreview?.sharedWithUsers.length > 1
                ? `${sharePreview.sharedWithUsers.length} users`
                : 'you'}
            </p>
          </div>

          {/* Share Details Card */}
          <div className="px-8 py-6 bg-gray-50">
            <div className="bg-white border-2 border-purple-200 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Project</p>
                  <p className="text-gray-900 font-bold text-xl">{sharePreview?.projectName}</p>
                </div>
              </div>

              {sharePreview?.clientName && (
                <div className="flex items-start gap-4 pt-4 border-t border-gray-200">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Client</p>
                    <p className="text-gray-900 font-semibold text-lg">{sharePreview.clientName}</p>
                  </div>
                </div>
              )}

              {sharePreview?.message && (
                <div className="flex items-start gap-4 pt-4 border-t border-gray-200">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Message</p>
                    <p className="text-gray-700 text-base italic">"{sharePreview.message}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Login Form */}
          <div className="px-8 py-8">
            <div className="mb-6 text-center">
              <p className="text-gray-700 font-semibold text-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Sign in to access this BOM
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3.5 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-all duration-200 ${
                  isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Sign In & Access BOM
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm">
            Solar Rail BOM Management System — Secure Share Access
          </p>
        </div>
      </main>
    </div>
  );
}
