import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateBOM = () => {
    navigate('/projects/create');
  };

  const handleLongRail = () => {
    navigate('/projects/create');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { user: loggedInUser } = await login(username, password);
      if (loggedInUser.mustChangePassword) {
        navigate('/change-password');
      }
      // After successful login, user stays on HomePage (authenticated view)
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const isManager = user?.role === 'MANAGER';

  // Landing Page for Unauthenticated Users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm h-20">
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center">
            <img
              src="/white_back_photo.svg"
              alt="Knapsack Tool"
              className="h-8"
            />
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Site Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                  Solar Rail BOM Management System
                </h2>
                <p className="mt-4 text-xl text-gray-600">
                  Internal tool for creating and optimizing Bills of Materials for solar panel installations.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-800">Features</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Long Rail Profile BOM Creation</p>
                      <p className="text-sm text-gray-600">Create detailed BOMs for U Cleat Long Rail profiles with automated calculations</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Multi-Building Support</p>
                      <p className="text-sm text-gray-600">Manage BOMs across multiple buildings in a single project</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Cost & Weight Calculations</p>
                      <p className="text-sm text-gray-600">Automatic calculation of material costs, weights, and spare quantities</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Export to PDF</p>
                      <p className="text-sm text-gray-600">Generate professional PDF reports with customizable sections</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Sign In</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Enter your credentials to access the BOM management system
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter your password"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
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
                    'Sign In'
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>

        {/* <footer className="py-8 text-center text-sm text-gray-500">
          Rail Cut Optimizer - Built for solar rail standardization
        </footer> */}
      </div>
    );
  }

  // Authenticated HomePage - BOM Creation Interface
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow h-20">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <img
            src="/white_back_photo.svg"
            alt="Knapsack Tool"
            className="h-8"
          />
          <div className="flex items-center gap-4">
            {isManager && (
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 border border-purple-600 text-sm font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Solar Rail Optimization
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Internal tool for optimizing solar rail cuts and generating Bills of Materials.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-2">Create BOM for:</h3>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Long Rail Card */}
            <div
              onClick={handleLongRail}
              className="relative rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm flex flex-col items-center text-center hover:border-blue-500 hover:ring-1 hover:ring-blue-500 hover:shadow-md cursor-pointer transition-all group"
            >
              <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Long Rail</p>
              <p className="text-sm text-gray-500">Optimization tool for standard long rail cutting.</p>
              <div className="mt-6 text-blue-600 font-semibold flex items-center gap-1">
                Get Started
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Placeholder for future BOM types */}
            <div className="relative rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 flex flex-col items-center text-center opacity-60 grayscale">
              <div className="h-16 w-16 rounded-2xl bg-gray-200 flex items-center justify-center mb-4">
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-400 mb-2">Coming Soon</p>
              <p className="text-sm text-gray-400">Other BOM types will be added here.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-xs text-gray-500">
        Rail Cut Optimizer - Built for solar rail standardization
      </footer>
    </div>
  );
}
