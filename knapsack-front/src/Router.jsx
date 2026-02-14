// src/Router.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import App from './App';
import BOMPage from './components/BOM/BOMPage';
import BOMPrintPreview from './components/BOM/BOMPrintPreview';
import ChangePasswordPage from './components/Auth/ChangePasswordPage';
import HomePage from './pages/HomePage';
import CreateProjectPage from './pages/CreateProjectPage';
import AdminPanel from './pages/AdminPanel';
import AdminBOMView from './pages/AdminBOMView';
import SharedBOMPage from './pages/SharedBOMPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

const RoleRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function Router() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <RoleRoute roles={['MANAGER']}>
                <AdminPanel />
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/bom/project/:projectId"
          element={
            <PrivateRoute>
              <RoleRoute roles={['MANAGER']}>
                <AdminBOMView />
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/projects/create" 
          element={
            <PrivateRoute>
              <CreateProjectPage />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/app" 
          element={
            <PrivateRoute>
              <App />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/bom" 
          element={
            <PrivateRoute>
              <BOMPage />
            </PrivateRoute>
          } 
        />
        
        <Route
          path="/bom/print-preview"
          element={
            <PrivateRoute>
              <BOMPrintPreview />
            </PrivateRoute>
          }
        />

        {/* Shared BOM access via token */}
        <Route
          path="/bom/shared/:token"
          element={
            <PrivateRoute>
              <SharedBOMPage />
            </PrivateRoute>
          }
        />

        {/* 404 Not Found - Catch all undefined routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
