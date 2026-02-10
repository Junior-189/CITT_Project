import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * General ProtectedRoute - Requires authentication
 * Optionally checks for specific roles
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, role, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user && !profile) {
    return <Navigate to="/login" replace />;
  }

  // Check if specific roles are required
  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

/**
 * AdminRoute - Requires admin role only (SuperAdmin can also access)
 */
export const AdminRoute = ({ children }) => {
  const { role, loading, user, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user && !profile) {
    return <Navigate to="/login" replace />;
  }

  // Allow admin and superAdmin (SuperAdmin can access Admin panel)
  if (role !== 'admin' && role !== 'superAdmin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

/**
 * SuperAdminRoute - Requires superAdmin role only
 */
export const SuperAdminRoute = ({ children }) => {
  const { role, loading, user, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user && !profile) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is superAdmin
  if (role !== 'superAdmin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

/**
 * IPManagerRoute - Requires ipManager role only
 */
export const IPManagerRoute = ({ children }) => {
  const { role, loading, user, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user && !profile) {
    return <Navigate to="/login" replace />;
  }

  // Only IP Manager role allowed
  if (role !== 'ipManager') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

/**
 * InnovatorRoute - Requires innovator role only
 */
export const InnovatorRoute = ({ children }) => {
  const { user, profile, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user && !profile) {
    return <Navigate to="/login" replace />;
  }

  // Only Innovator role allowed
  if (role !== 'innovator') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

/**
 * PublicRoute - Only accessible when NOT authenticated
 * Redirects to dashboard if user is logged in
 */
export const PublicRoute = ({ children }) => {
  const { user, profile, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Already authenticated - redirect to appropriate dashboard based on role
  if (user || profile) {
    if (role === 'superAdmin') {
      return <Navigate to="/superadmin/dashboard" replace />;
    } else if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === 'ipManager') {
      return <Navigate to="/ipmanager/dashboard" replace />;
    } else {
      // innovator or any other role goes to home
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

/**
 * RoleRedirect - Redirects user to appropriate dashboard based on role
 */
export const RoleRedirect = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Redirect to appropriate dashboard
  if (role === 'superAdmin') {
    return <Navigate to="/superadmin/dashboard" replace />;
  } else if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (role === 'ipManager') {
    return <Navigate to="/ipmanager/dashboard" replace />;
  } else {
    return <Navigate to="/" replace />;
  }
};
