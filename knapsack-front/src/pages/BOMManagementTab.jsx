import { useState, useEffect } from 'react';
import { savedBomAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function BOMManagementTab() {
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBoms, setFilteredBoms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadAllBOMs();
  }, []);

  // Filter BOMs based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBoms(boms);
    } else {
      const filtered = boms.filter(bom =>
        bom.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bom.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bom.projectId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bom.createdByUsername?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBoms(filtered);
    }
  }, [searchTerm, boms]);

  const loadAllBOMs = async () => {
    try {
      setLoading(true);
      setError('');

      // Get all saved BOMs in one API call (already includes project info)
      const savedBoms = await savedBomAPI.getAllSavedBoms();

      // Transform the data for display
      const allBoms = savedBoms.map(savedBom => ({
        id: savedBom.id,
        projectDbId: savedBom.projectId,
        projectName: savedBom.project?.name || 'N/A',
        clientName: savedBom.project?.clientName || 'N/A',
        projectId: savedBom.project?.projectId || 'N/A',
        createdAt: savedBom.createdAt,
        updatedAt: savedBom.updatedAt,
        createdByUsername: savedBom.user?.username || 'N/A',
        createdById: savedBom.user?.id,
        changeLogCount: Array.isArray(savedBom.changeLog) ? savedBom.changeLog.length : 0,
        hasNotes: Array.isArray(savedBom.userNotes) && savedBom.userNotes.length > 0,
      }));

      setBoms(allBoms);
      setFilteredBoms(allBoms);
    } catch (err) {
      console.error('Failed to load BOMs:', err);
      setError('Failed to load BOMs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBOM = (projectDbId) => {
    navigate(`/admin/bom/project/${projectDbId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      {/* Search and Filter Section */}
      <div className="mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by project name, client, project ID, or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={loadAllBOMs}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {boms.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {searchTerm ? (
              <>Showing {filteredBoms.length} of {boms.length} saved BOM(s)</>
            ) : (
              <>Found {boms.length} project(s) with saved BOMs</>
            )}
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading BOMs...</p>
        </div>
      ) : filteredBoms.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {searchTerm ? 'No BOMs found matching your search.' : 'No BOMs available.'}
          </p>
        </div>
      ) : (
        /* BOMs Table */
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                  Project Name
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Client
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Project ID
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Created By
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Created At
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Last Updated
                </th>
                {/* <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Changes
                </th> */}
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredBoms.map((bom) => (
                <tr key={bom.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                    {bom.projectName || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                    {bom.clientName || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                    {bom.projectId || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                    <span className="inline-flex items-center">
                      {bom.createdByUsername}
                      {/* {bom.hasNotes && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          Notes
                        </span>
                      )} */}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(bom.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(bom.updatedAt)}
                  </td>
                  {/* <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                    {bom.changeLogCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        {bom.changeLogCount} changes
                      </span>
                    ) : (
                      <span className="text-gray-400">No changes</span>
                    )}
                  </td> */}
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <button
                      onClick={() => handleViewBOM(bom.projectDbId)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
