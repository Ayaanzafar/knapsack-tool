import { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setCurrentProjectId } from '../lib/tabStorageAPI';

export default function CreateCustomBomProjectPage() {
  const [activeTab, setActiveTab] = useState('new');
  const [clientName, setClientName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [existingProjects, setExistingProjects] = useState([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latestUpdated');
  const pageSize = 10;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
      if (response.projects && Array.isArray(response.projects)) {
        setExistingProjects(response.projects);
        setTotalProjects(response.total || response.projects.length);
      } else if (Array.isArray(response)) {
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
        userId: user.id
      });
      setCurrentProjectId(newProject.id);
      navigate('/custom-bom/app');
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenProject = (project) => {
    setCurrentProjectId(project.id);
    navigate('/custom-bom/app');
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
    <div className="min-h-screen bg-linear-to-br from-yellow-300 via-yellow-100 to-white transition-colors duration-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Animated Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-600 via-amber-600 to-yellow-500 mb-3 tracking-tight">
            Custom BOM
          </h1>
          <p className="text-gray-700 text-lg font-medium">
            Create or access your custom BOM projects
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-visible border border-yellow-200/50 transform transition-all duration-300 hover:shadow-yellow-200/50 hover:shadow-3xl">
          {/* HEADER CLIPPER */}
          <div className="rounded-t-3xl overflow-hidden">
            <div className="flex border-b border-yellow-200/50 bg-linear-to-r from-yellow-50/50 to-amber-50/50">
              <button
                onClick={() => setActiveTab("new")}
                className={`flex-1 py-5 text-center text-base font-bold transition-all duration-300 relative overflow-hidden group ${activeTab === "new" ? "text-white" : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <span
                  className={`absolute inset-0 transition-all duration-300 ${activeTab === "new"
                      ? "bg-linear-to-r from-yellow-500 to-amber-500 opacity-100"
                      : "bg-linear-to-r from-yellow-400 to-amber-400 opacity-0 group-hover:opacity-10"
                    }`}
                />
                <span className="relative flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Project
                </span>
                {activeTab === "new" && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-yellow-500 to-amber-500" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("existing")}
                className={`flex-1 py-5 text-center text-base font-bold transition-all duration-300 relative overflow-hidden group ${activeTab === "existing" ? "text-white" : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <span
                  className={`absolute inset-0 transition-all duration-300 ${activeTab === "existing"
                      ? "bg-linear-to-r from-yellow-500 to-amber-500 opacity-100"
                      : "bg-linear-to-r from-yellow-400 to-amber-400 opacity-0 group-hover:opacity-10"
                    }`}
                />
                <span className="relative flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                    />
                  </svg>
                  Open Existing Project
                </span>
                {activeTab === "existing" && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-yellow-500 to-amber-500" />
                )}
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="px-8 py-10">
            {error && (
              <div className="mb-6 bg-linear-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm animate-shake">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {activeTab === "new" ? (
              /* CREATE NEW FORM */
              <form onSubmit={handleCreateSubmit} className="space-y-7">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-600 to-amber-600">
                    Enter Project Details
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Fill in the information below to create your new custom BOM project
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="group">
                    <label
                      htmlFor="clientName"
                      className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="clientName"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="appearance-none block w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 hover:border-yellow-300 shadow-sm"
                      placeholder="e.g. SolarCorp"
                    />
                  </div>

                  <div className="group">
                    <label
                      htmlFor="projectId"
                      className="block text-sm font-bold text-gray-700 mb-2 items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Project ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="projectId"
                      required
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="appearance-none block w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 hover:border-yellow-300 shadow-sm"
                      placeholder="e.g. SC-2025-001"
                    />
                  </div>

                  <div className="group">
                    <label
                      htmlFor="projectName"
                      className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path
                          fillRule="evenodd"
                          d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Project Name <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="projectName"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="appearance-none block w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 hover:border-yellow-300 shadow-sm"
                      placeholder="Defaults to 'Client Name - Project ID'"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-6 border-2 border-gray-300 rounded-xl text-base font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center items-center gap-2 py-3.5 px-6 rounded-xl text-base font-bold text-white bg-linear-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${isLoading ? "opacity-70 cursor-not-allowed hover:transform-none" : ""
                      }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Create Project
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* OPEN EXISTING LIST */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3.5 pl-12 pr-12 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 hover:border-yellow-300 shadow-sm"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100"
                        title="Clear search"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm font-medium hover:border-yellow-300 transition-all duration-300 shadow-sm cursor-pointer"
                  >
                    <option value="latestUpdated">Latest Updated</option>
                    <option value="latest">Latest Created</option>
                    <option value="oldest">Oldest Created</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>

                {!isLoading && totalProjects > 0 && (
                  <div className="text-sm font-medium text-gray-600 text-center bg-yellow-50/50 rounded-lg py-2 px-4">
                    Showing <span className="font-bold text-yellow-600">{startIndex}-{endIndex}</span> of <span className="font-bold text-yellow-600">{totalProjects}</span> projects
                  </div>
                )}

                {isLoading ? (
                  <div className="text-center py-16">
                    <div className="relative inline-block">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200"></div>
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-yellow-500 absolute top-0 left-0"></div>
                    </div>
                    <p className="text-gray-600 mt-4 font-medium">Loading projects...</p>
                  </div>
                ) : existingProjects.length === 0 ? (
                  <div className="text-center py-16 bg-linear-to-br from-yellow-50/50 to-amber-50/50 rounded-2xl border-2 border-dashed border-yellow-300">
                    <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 font-medium text-lg">
                      {searchTerm ? 'No projects found matching your search.' : 'No projects found.'}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {searchTerm ? 'Try adjusting your search terms.' : 'Create your first project to get started!'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {existingProjects.map((project, index) => (
                        <div
                          key={project.id}
                          onClick={() => handleOpenProject(project)}
                          className="p-5 bg-white border-2 border-gray-200 rounded-2xl hover:border-yellow-400 hover:shadow-xl cursor-pointer transition-all duration-300 group transform hover:-translate-y-1"
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animation: 'fadeInUp 0.5s ease-out forwards',
                            opacity: 0
                          }}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-yellow-400 to-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-yellow-600 transition-colors truncate">
                                    {project.name}
                                  </h3>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-3">
                                <span className="flex items-center gap-1.5" title="Client Name">
                                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-gray-400 text-xs">Client:</span>
                                  <span className="font-medium">{project.clientName || 'N/A'}</span>
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-1.5" title="Project ID">
                                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-gray-400 text-xs">ID:</span>
                                  {project.projectId || 'N/A'}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-1.5" title="Created Date & Time">
                                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-gray-400 text-xs">Created:</span>
                                  {new Date(project.createdAt).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-1.5" title="Last Updated Date & Time">
                                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-gray-400 text-xs">Updated:</span>
                                  {new Date(project.updatedAt).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-yellow-100 to-amber-100 flex items-center justify-center group-hover:from-yellow-500 group-hover:to-amber-500 transition-all duration-300 group-hover:scale-110">
                                <svg className="w-5 h-5 text-yellow-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 pt-4">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2 shadow-sm ${
                            currentPage === 1
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-linear-to-r from-yellow-500 to-amber-500 border-transparent text-white hover:from-yellow-600 hover:to-amber-600 hover:shadow-lg transform hover:-translate-y-0.5'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                          </svg>
                          Previous
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">
                            Page <span className="font-bold text-yellow-600 text-base">{currentPage}</span> of <span className="font-bold text-yellow-600 text-base">{totalPages}</span>
                          </span>
                        </div>

                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2 shadow-sm ${
                            currentPage === totalPages
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-linear-to-r from-yellow-500 to-amber-500 border-transparent text-white hover:from-yellow-600 hover:to-amber-600 hover:shadow-lg transform hover:-translate-y-0.5'
                          }`}
                        >
                          Next
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className="pt-6 border-t-2 border-gray-100">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-6 border-2 border-gray-300 rounded-xl text-base font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Home
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      .animate-shake { animation: shake 0.3s ease-in-out; }

      @keyframes fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .animate-fade-in { animation: fade-in 0.6s ease-out; }
    `}</style>
    </div>
  );
}
