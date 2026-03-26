import { useNavigate } from 'react-router-dom';
import BOMManagementTab from './BOMManagementTab';

export default function BomListPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">BOM List</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Home
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <BOMManagementTab viewBasePath="/bom-list/bom/project" />
        </div>
      </main>
    </div>
  );
}
