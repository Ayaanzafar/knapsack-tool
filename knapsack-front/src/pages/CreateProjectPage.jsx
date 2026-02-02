// import { useState, useEffect } from 'react';
// import { projectAPI } from '../services/api';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { setCurrentProjectId } from '../lib/tabStorageAPI';
// import { LongRailDropdown } from "../components/LongRailDropdown"; // adjust path
// import { LONG_RAIL_OPTIONS } from '../constants/longRailVariation';


// export default function CreateProjectPage() {
//   const [activeTab, setActiveTab] = useState('new'); // 'new' or 'existing'

//   // Create New State
//   const [clientName, setClientName] = useState('');
//   const [projectId, setProjectId] = useState('');
//   const [projectName, setProjectName] = useState('');
//   const [longRailVariation, setLongRailVariation] = useState('');

//   // Open Existing State with Pagination
//   const [existingProjects, setExistingProjects] = useState([]);
//   const [totalProjects, setTotalProjects] = useState(0);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
//   const [sortBy, setSortBy] = useState('latestUpdated'); // 'latestUpdated', 'latest', 'oldest', 'name'
//   const pageSize = 10;

//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();
//   const { user } = useAuth();

//   // Debounce search term
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearchTerm(searchTerm);
//       setCurrentPage(1); // Reset to page 1 when search changes
//     }, 300); // 300ms debounce

//     return () => clearTimeout(timer);
//   }, [searchTerm]);

//   // Fetch existing projects when tab changes or pagination/sort changes
//   useEffect(() => {
//     if (activeTab === 'existing') {
//       loadProjects();
//     }
//   }, [activeTab, currentPage, sortBy, debouncedSearchTerm]);

//   const loadProjects = async () => {
//     setIsLoading(true);
//     setError('');
//     try {
//       const params = {
//         page: currentPage,
//         limit: pageSize,
//         sortBy: sortBy,
//         search: debouncedSearchTerm || undefined
//       };

//       const response = await projectAPI.getAll(params);

//       // Handle both paginated and non-paginated responses
//       if (response.projects && Array.isArray(response.projects)) {
//         setExistingProjects(response.projects);
//         setTotalProjects(response.total || response.projects.length);
//       } else if (Array.isArray(response)) {
//         // Fallback for non-paginated API
//         setExistingProjects(response);
//         setTotalProjects(response.length);
//       } else {
//         setExistingProjects([]);
//         setTotalProjects(0);
//       }
//     } catch (err) {
//       console.error('Failed to load projects:', err);
//       setError('Failed to load your projects.');
//       setExistingProjects([]);
//       setTotalProjects(0);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCreateSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     if (!longRailVariation) {
//       setError("Please select Long Rail Variation.");
//       setIsLoading(false);
//       return;
//     }


//     try {
//       const newProject = await projectAPI.create({
//         name: projectName || `${clientName} - ${projectId}`,
//         clientName,
//         projectId,
//         longRailVariation,
//         userId: user.id
//       });

//       setCurrentProjectId(newProject.id);
//       navigate('/app');
//     } catch (err) {
//       setError(err.message || 'Failed to create project');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleOpenProject = (project) => {
//     setCurrentProjectId(project.id);
//     navigate('/app');
//   };

//   const totalPages = Math.ceil(totalProjects / pageSize);
//   const startIndex = (currentPage - 1) * pageSize + 1;
//   const endIndex = Math.min(currentPage * pageSize, totalProjects);

//   const handlePreviousPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   const handleNextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-12 pb-64 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-visible mb-20">

//         {/* Tabs */}
//         <div className="flex border-b border-gray-200">
//           <button
//             onClick={() => setActiveTab('new')}
//             className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${activeTab === 'new'
//               ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
//               : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
//               }`}
//           >
//             Create New Project
//           </button>
//           <button
//             onClick={() => setActiveTab('existing')}
//             className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${activeTab === 'existing'
//               ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
//               : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
//               }`}
//           >
//             Open Existing Project
//           </button>
//         </div>

//         <div className="px-6 py-8">
//           {error && (
//             <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
//               {error}
//             </div>
//           )}

//           {activeTab === 'new' ? (
//             /* CREATE NEW FORM */
//             <form onSubmit={handleCreateSubmit} className="space-y-6">
//               <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
//                 Enter Project Details
//               </h2>
//               <div>
//                 <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
//                   Client Name <span className="text-red-500">*</span>
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="text"
//                     id="clientName"
//                     required
//                     value={clientName}
//                     onChange={(e) => setClientName(e.target.value)}
//                     className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="e.g. SolarCorp"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
//                   Project ID <span className="text-red-500">*</span>
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="text"
//                     id="projectId"
//                     required
//                     value={projectId}
//                     onChange={(e) => setProjectId(e.target.value)}
//                     className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="e.g. SC-2025-001"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
//                   Project Name (Optional)
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="text"
//                     id="projectName"
//                     value={projectName}
//                     onChange={(e) => setProjectName(e.target.value)}
//                     className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Defaults to 'Client Name - Project ID'"
//                   />
//                 </div>
//               </div>

//               <div>
//                 {/* <label htmlFor="longRailVariation" className="block text-sm font-medium text-gray-700">
//                   Long Rail Variation <span className="text-red-500">*</span>
//                 </label> */}
//                 <div className="mt-1">

//                   <LongRailDropdown
//                     label="Long Rail Variation"
//                     required
//                     value={longRailVariation}
//                     onChange={(val) => setLongRailVariation(val)}
//                     options={LONG_RAIL_OPTIONS}
//                   />

//                   {/* <select
//                     id="longRailVariation"
//                     required
//                     value={longRailVariation}
//                     onChange={(e) => setLongRailVariation(e.target.value)}
//                     className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${!longRailVariation ? 'text-gray-400' : 'text-gray-900'
//                       }`}
//                   >
//                     <option value="" disabled className="text-gray-400">-SELECT-</option>
//                     <option value="U Cleat Long Rail - Regular" className="text-gray-900">U Cleat Long Rail - Regular</option>
//                     <option disabled value="U Cleat Long Rail - Regular - Asbestos" className="text-gray-900">U Cleat Long Rail - Regular - Asbestos</option>
//                     <option disabled value="U Cleat Long Rail - Regular - Seam Clamp" className="text-gray-900">U Cleat Long Rail - Regular - Seam Clamp</option>
//                     <option disabled value="U Cleat Long Rail - Large Span/Height" className="text-gray-900">U Cleat Long Rail - Large Span/Height</option>
//                     <option disabled value="U Cleat Long Rail - Large Span - Asbestos" className="text-gray-900">U Cleat Long Rail - Large Span - Asbestos</option>
//                     <option disabled value="U Cleat Long Rail - Large Height - Seam Clamp" className="text-gray-900">U Cleat Long Rail - Large Height - Seam Clamp</option>
//                     <option disabled value="Double U Cleat Long Rail -160mm Height" className="text-gray-900">Double U Cleat Long Rail -160mm Height</option>
//                     <option disabled value="Double U Cleat Long Rail -180mm Height" className="text-gray-900">Double U Cleat Long Rail -180mm Height</option>
//                     <option disabled value="L Cleat Long Rail - Regular" className="text-gray-900">L Cleat Long Rail - Regular</option>
//                     <option disabled value="L Cleat Long Rail - Regular - Asbestos" className="text-gray-900">L Cleat Long Rail - Regular - Asbestos</option>
//                     <option disabled value="L Cleat Long Rail - Regular - Seam Clamp" className="text-gray-900">L Cleat Long Rail - Regular - Seam Clamp</option>
//                     <option disabled value="L Cleat Long Rail - Large Cleat" className="text-gray-900">L Cleat Long Rail - Large Cleat</option>
//                     <option disabled value="L Cleat Long Rail - Large span" className="text-gray-900">L Cleat Long Rail - Large span</option>
//                     <option disabled value="L Cleat Long Rail - Large Height - Asbestos" className="text-gray-900">L Cleat Long Rail - Large Height - Asbestos</option>
//                     <option disabled value="L Cleat Long Rail - Large Height - Seam Clamp" className="text-gray-900">L Cleat Long Rail - Large Height - Seam Clamp</option>
//                     <option disabled value="L Cleat Long Rail - Large Cleat - Asbestos" className="text-gray-900">L Cleat Long Rail - Large Cleat - Asbestos</option>
//                     <option disabled value="L Cleat Long Rail - Large Cleat - Seam Clamp" className="text-gray-900">L Cleat Long Rail - Large Cleat - Seam Clamp</option>
//                     <option disabled value="C45 Long Rail" className="text-gray-900">C45 Long Rail</option>
//                     <option disabled value="C45 Long Rail - Asbestos" className="text-gray-900">C45 Long Rail - Asbestos</option>
//                     <option disabled value="C45 Long Rail - Seam Clamp" className="text-gray-900">C45 Long Rail - Seam Clamp</option>
//                   </select> */}
//                 </div>
//               </div>

//               <div className="flex gap-4 pt-4">
//                 <button
//                   type="button"
//                   onClick={() => navigate('/')}
//                   className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isLoading}
//                   className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
//                 >
//                   {isLoading ? 'Creating...' : 'Create Project'}
//                 </button>
//               </div>
//             </form>
//           ) : (
//             /* OPEN EXISTING LIST */
//             <div className="space-y-6">
//               {/* Search and Sort Row */}
//               <div className="flex gap-3">
//                 <div className="relative flex-1">
//                   <input
//                     type="text"
//                     placeholder="Search projects..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                   <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                   </svg>
//                   {searchTerm && (
//                     <button
//                       onClick={() => setSearchTerm('')}
//                       className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
//                       title="Clear search"
//                     >
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                       </svg>
//                     </button>
//                   )}
//                 </div>

//                 {/* Sort Dropdown */}
//                 <select
//                   value={sortBy}
//                   onChange={(e) => {
//                     setSortBy(e.target.value);
//                     setCurrentPage(1); // Reset to page 1 when sorting changes
//                   }}
//                   className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
//                 >
//                   <option value="latestUpdated">Latest Updated</option>
//                   <option value="latest">Latest Created</option>
//                   <option value="oldest">Oldest Created</option>
//                   <option value="name">Name (A-Z)</option>
//                 </select>
//               </div>

//               {/* Pagination Info */}
//               {!isLoading && totalProjects > 0 && (
//                 <div className="text-sm text-gray-600 text-center">
//                   Showing {startIndex}-{endIndex} of {totalProjects} projects
//                 </div>
//               )}

//               {isLoading ? (
//                 <div className="text-center py-8">
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
//                   <p className="text-gray-500">Loading projects...</p>
//                 </div>
//               ) : existingProjects.length === 0 ? (
//                 <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
//                   <p className="text-gray-500">
//                     {searchTerm ? 'No projects found matching your search.' : 'No projects found.'}
//                   </p>
//                 </div>
//               ) : (
//                 <>
//                   <div className="space-y-3">
//                     {existingProjects.map(project => (
//                       <div
//                         key={project.id}
//                         onClick={() => handleOpenProject(project)}
//                         className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:ring-1 hover:ring-blue-500 hover:bg-blue-50 cursor-pointer transition-all flex justify-between items-center group"
//                       >
//                         <div>
//                           <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
//                             {project.name}  ({project.longRailVariation || 'N/A'})
//                           </h3>
//                           <div className="text-xs text-gray-500 mt-1 flex gap-3">
//                             <span>Client: {project.clientName || 'N/A'}</span>
//                             <span>•</span>
//                             <span>Project ID: {project.projectId || 'N/A'}</span>
//                             <span>•</span>
//                             <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
//                             <span>•</span>
//                             <span>Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
//                           </div>
//                         </div>
//                         <div className="text-gray-400 group-hover:text-blue-600">
//                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//                           </svg>
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Pagination Buttons */}
//                   {totalPages > 1 && (
//                     <div className="flex justify-center items-center gap-4 pt-4">
//                       <button
//                         onClick={handlePreviousPage}
//                         disabled={currentPage === 1}
//                         className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
//                           ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                           : 'bg-blue-600 text-white hover:bg-blue-700'
//                           }`}
//                       >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
//                         </svg>
//                         Previous
//                       </button>

//                       <span className="text-sm text-gray-600">
//                         Page {currentPage} of {totalPages}
//                       </span>

//                       <button
//                         onClick={handleNextPage}
//                         disabled={currentPage === totalPages}
//                         className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages
//                           ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                           : 'bg-blue-600 text-white hover:bg-blue-700'
//                           }`}
//                       >
//                         Next
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//                         </svg>
//                       </button>
//                     </div>
//                   )}
//                 </>
//               )}

//               <div className="pt-4 border-t">
//                 <button
//                   type="button"
//                   onClick={() => navigate('/')}
//                   className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
//                 >
//                   Back to Home
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }










import { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setCurrentProjectId } from '../lib/tabStorageAPI';
import { LongRailDropdown } from "../components/LongRailDropdown";
import { LONG_RAIL_OPTIONS } from '../constants/longRailVariation';

export default function CreateProjectPage() {
  const [activeTab, setActiveTab] = useState('new');
  const [clientName, setClientName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [longRailVariation, setLongRailVariation] = useState('');
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
    if (!longRailVariation) {
      setError("Please select Long Rail Variation.");
      setIsLoading(false);
      return;
    }
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
    <div className="min-h-screen bg-linear-to-br from-yellow-300 via-yellow-100 to-white transition-colors duration-500 py-12 pb-64 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Animated Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-600 via-amber-600 to-yellow-500 mb-3 tracking-tight">
            Project Manager
          </h1>
          <p className="text-gray-700 text-lg font-medium">
            Create or access your projects with ease
          </p>
        </div>

        {/* ✅ MAIN CARD (keep overflow-visible so dropdown won't get clipped) */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-visible border border-yellow-200/50 transform transition-all duration-300 hover:shadow-yellow-200/50 hover:shadow-3xl">
          {/* ✅ HEADER CLIPPER (clips only top corners for tabs background) */}
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

          {/* ✅ BODY (still inside card, but NOT clipped) */}
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
                    Fill in the information below to create your new project
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

                  <div className="group">
                    <LongRailDropdown
                      label="Long Rail Variation"
                      required
                      value={longRailVariation}
                      onChange={(val) => setLongRailVariation(val)}
                      options={LONG_RAIL_OPTIONS}
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
                {/* (keep your existing “existing projects” UI exactly as it is) */}
                {/* --- paste your existing activeTab === 'existing' content here unchanged --- */}

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

                  {/* Sort Dropdown */}
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

                {/* Pagination Info */}
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
                                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full mt-1">
                                    {project.longRailVariation || 'N/A'}
                                  </span>
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

                    {/* Pagination Buttons */}
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