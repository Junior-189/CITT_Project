import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

export const ProtectedRoute = ({ children }) => {
  const { profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner />;
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

export const PublicRoute = ({ children }) => {
  const { profile, loading, role } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (profile) {
    const paths = {
      superAdmin: '/superadmin/dashboard', admin: '/admin/dashboard',
      transferTechnologyOfficer: '/admin/dashboard', ipManager: '/ipmanager/dashboard',
      diiDirector: '/dii/dashboard', debmDirector: '/debm/dashboard',
      rtpDirector: '/rtp/dashboard', mentor: '/mentor/dashboard',
      technicalCommittee: '/tc/dashboard', coordinator: '/coordinator/dashboard',
      innovator: '/projects',
    };
    return <Navigate to={paths[role] || '/projects'} replace />;
  }
  return children;
};

export const AdminRoute = ({ children }) => {
  const { profile, role, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner />;
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!['admin','superAdmin','transferTechnologyOfficer'].includes(role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

export const SuperAdminRoute = ({ children }) => {
  const { profile, role, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner />;
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role !== 'superAdmin') return <Navigate to="/unauthorized" replace />;
  return children;
};

export const IPManagerRoute = ({ children }) => {
  const { profile, role, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner />;
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!['ipManager','admin','superAdmin','transferTechnologyOfficer'].includes(role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

export const RoleRoute = ({ children, roles = [] }) => {
  const { profile, role, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner />;
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!roles.includes(role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

export default ProtectedRoute;
