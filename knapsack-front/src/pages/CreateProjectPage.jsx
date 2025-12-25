import { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setCurrentProjectId } from '../lib/tabStorageAPI';

export default function CreateProjectPage() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'existing'

  // Create New State
  const [clientName, setClientName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [longRailVariation, setLongRailVariation] = useState('');

  // Open Existing State with Pagination
  const [existingProjects, setExistingProjects] = useState([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'oldest', 'name'
  const pageSize = 10;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to page 1 when search changes
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch existing projects when tab changes or pagination/sort changes
  useEffect(() => {
    if (activeTab === 'existing') {
      loadProjects();
    }
  }, [activeTab, currentPage, sortBy, debouncedSearchTerm]);

  const loadProjects = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        sortBy: sortBy,
        search: debouncedSearchTerm || undefined
      };

      const response = await projectAPI.getAll(params);

      // Handle both paginated and non-paginated responses
      if (response.projects && Array.isArray(response.projects)) {
        setExistingProjects(response.projects);
        setTotalProjects(response.total || response.projects.length);
      } else if (Array.isArray(response)) {
        // Fallback for non-paginated API
        setExistingProjects(response);
        setTotalProjects(response.length);
      } else {
        setExistingProjects([]);
        setTotalProjects(0);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load your projects.');
      setExistingProjects([]);
      setTotalProjects(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const newProject = await projectAPI.create({
        name: projectName || `${clientName} - ${projectId}`,
        clientName,
        projectId,
        longRailVariation,
        userId: user.id
      });

      setCurrentProjectId(newProject.id);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenProject = (project) => {
    setCurrentProjectId(project.id);
    navigate('/app');
  };

  const totalPages = Math.ceil(totalProjects / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalProjects);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${activeTab === 'new'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            Create New Project
          </button>
          <button
            onClick={() => setActiveTab('existing')}
            className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${activeTab === 'existing'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            Open Existing Project
          </button>
        </div>

        <div className="px-6 py-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {activeTab === 'new' ? (
            /* CREATE NEW FORM */
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
                Enter Project Details
              </h2>
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="clientName"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. SolarCorp"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                  Project ID <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="projectId"
                    required
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. SC-2025-001"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                  Project Name (Optional)
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Defaults to 'Client Name - Project ID'"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="longRailVariation" className="block text-sm font-medium text-gray-700">
                  Long Rail Variation <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="longRailVariation"
                    required
                    value={longRailVariation}
                    onChange={(e) => setLongRailVariation(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${!longRailVariation ? 'text-gray-400' : 'text-gray-900'
                      }`}
                  >
                    <option value="" disabled className="text-gray-400">-SELECT-</option>
                    <option value="U Cleat Long Rail" className="text-gray-900">U Cleat Long Rail</option>
                    <option value="L Cleat Long Rail" disabled className="text-gray-900">L Cleat Long Rail</option>
                    <option value="Mini Rail" disabled className="text-gray-900">Mini Rail</option>
                    <option value="Short Rail" disabled className="text-gray-900">Short Rail</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          ) : (
            /* OPEN EXISTING LIST */
            <div className="space-y-6">
              {/* Search and Sort Row */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1); // Reset to page 1 when sorting changes
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>

              {/* Pagination Info */}
              {!isLoading && totalProjects > 0 && (
                <div className="text-sm text-gray-600 text-center">
                  Showing {startIndex}-{endIndex} of {totalProjects} projects
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading projects...</p>
                </div>
              ) : existingProjects.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-gray-500">
                    {searchTerm ? 'No projects found matching your search.' : 'No projects found.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {existingProjects.map(project => (
                      <div
                        key={project.id}
                        onClick={() => handleOpenProject(project)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:ring-1 hover:ring-blue-500 hover:bg-blue-50 cursor-pointer transition-all flex justify-between items-center group"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                            {project.name}  ({project.longRailVariation || 'N/A'})
                          </h3>
                          <div className="text-xs text-gray-500 mt-1 flex gap-3">
                            <span>Client: {project.clientName || 'N/A'}</span>
                            <span>•</span>
                            <span>Project ID: {project.projectId || 'N/A'}</span>
                            <span>•</span>
                            {/* <span>Variation: {project.longRailVariation || 'N/A'}</span>
                            <span>•</span> */}
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-gray-400 group-hover:text-blue-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Buttons */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 pt-4">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </button>

                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                      >
                        Next
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}

              <div className="pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
