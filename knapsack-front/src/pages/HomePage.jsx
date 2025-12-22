import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleCreateBOM = () => {
    navigate('/projects/create');
  };

  const handleLongRail = () => {
    navigate('/projects/create');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Knapsack Tool</h1>
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Login
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Solar Rail Optimization
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Internal tool for optimizing solar rail cuts and generating Bills of Materials.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
          {/* Create BOM Card */}
          <div 
            onClick={handleCreateBOM}
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-10 shadow-sm flex items-center space-x-3 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 cursor-pointer transition-all"
          >
            <div className="flex-shrink-0">
              <span className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-xl font-medium text-gray-900">Create BOM</p>
              <p className="text-gray-500">Generate a full Bill of Materials for your project.</p>
            </div>
          </div>

          {/* Long Rail Card */}
          <div 
            onClick={handleLongRail}
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-10 shadow-sm flex items-center space-x-3 hover:border-green-500 hover:ring-1 hover:ring-green-500 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500 cursor-pointer transition-all"
          >
            <div className="flex-shrink-0">
              <span className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-xl font-medium text-gray-900">Long Rail</p>
              <p className="text-gray-500">Access the rail cutting optimization tool.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
