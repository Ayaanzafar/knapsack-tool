import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleCreateBOM = () => {
    navigate('/projects/create');
  };

  const handleLongRail = () => {
    navigate('/projects/create');
  };

  const isManager = user?.role === 'MANAGER';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Knapsack Tool</h1>
          <div className="flex items-center gap-4">
            {isManager && (
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 border border-purple-600 text-sm font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50"
              >
                Admin Panel
              </button>
            )}
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
    </div>
  );
}
