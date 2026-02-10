import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Permissions = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const response = await api.get('/api/superadmin/permissions');
      setPermissions(response.data.permissions || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch permissions');
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const rolePermissions = [
    {
      role: 'superAdmin',
      label: 'Super Admin',
      icon: '👑',
      color: 'bg-teal-100 text-teal-800',
      permissions: [
        { name: 'Manage Users', description: 'Create, edit, delete users', enabled: true },
        { name: 'Manage Roles', description: 'Assign and modify user roles', enabled: true },
        { name: 'View Audit Logs', description: 'Access system audit logs', enabled: true },
        { name: 'Manage Permissions', description: 'Modify system permissions', enabled: true },
        { name: 'Database Access', description: 'View database information', enabled: true },
        { name: 'System Settings', description: 'Modify system configuration', enabled: true },
        { name: 'View Analytics', description: 'Access all analytics', enabled: true },
        { name: 'Restore Deleted Users', description: 'Restore deleted accounts', enabled: true },
      ]
    },
    {
      role: 'admin',
      label: 'Admin',
      icon: '🔑',
      color: 'bg-teal-100 text-teal-800',
      permissions: [
        { name: 'Manage Users', description: 'Create, edit, delete users', enabled: true },
        { name: 'View Audit Logs', description: 'Access system audit logs', enabled: true },
        { name: 'Approve Projects', description: 'Approve/reject projects', enabled: true },
        { name: 'Manage Funding', description: 'Review funding applications', enabled: true },
        { name: 'Manage Events', description: 'Create and manage events', enabled: true },
        { name: 'View Analytics', description: 'Access admin analytics', enabled: true },
        { name: 'Restore Deleted Users', description: 'Restore deleted accounts', enabled: true },
        { name: 'Manage Roles', description: 'Assign roles (limited)', enabled: false },
      ]
    },
    {
      role: 'ipManager',
      label: 'IP Manager',
      icon: '📜',
      color: 'bg-teal-100 text-teal-800',
      permissions: [
        { name: 'View IP Records', description: 'Access IP records', enabled: true },
        { name: 'Approve IP Applications', description: 'Review IP applications', enabled: true },
        { name: 'Manage IP Records', description: 'Create and edit IP records', enabled: true },
        { name: 'View IP Statistics', description: 'Access IP statistics', enabled: true },
        { name: 'View Projects', description: 'View innovation projects', enabled: true },
        { name: 'Manage Users', description: 'Create, edit users', enabled: false },
        { name: 'View Analytics', description: 'Access analytics', enabled: false },
      ]
    },
    {
      role: 'innovator',
      label: 'Innovator',
      icon: '💡',
      color: 'bg-teal-100 text-teal-800',
      permissions: [
        { name: 'Submit Projects', description: 'Submit innovation projects', enabled: true },
        { name: 'View Own Projects', description: 'View submitted projects', enabled: true },
        { name: 'Apply for Funding', description: 'Submit funding applications', enabled: true },
        { name: 'Register for Events', description: 'Register for events', enabled: true },
        { name: 'Submit IP Applications', description: 'Submit IP applications', enabled: true },
        { name: 'View Own Profile', description: 'View and edit profile', enabled: true },
        { name: 'Manage Users', description: 'Create, edit users', enabled: false },
        { name: 'View Analytics', description: 'Access analytics', enabled: false },
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">System Permissions</h1>
          <p className="text-gray-600 mt-2">Manage role-based access control and permissions</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-600">
            SuperAdmin Only
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert - Updated to remove placeholder message */}
        {error && (
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Role Permissions Overview</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 mb-4">
              This page allows SuperAdmins to manage system-wide permissions for different user roles.
              Each role has specific permissions that determine what actions users can perform in the system.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-teal-50 rounded-lg">
                <div className="font-semibold text-teal-600">Super Admin</div>
                <div className="text-sm text-gray-600 mt-1">Full Access</div>
              </div>
              <div className="text-center p-4 bg-teal-50 rounded-lg">
                <div className="font-semibold text-teal-600">Admin</div>
                <div className="text-sm text-gray-600 mt-1">Management Access</div>
              </div>
              <div className="text-center p-4 bg-teal-50 rounded-lg">
                <div className="font-semibold text-teal-600">IP Manager</div>
                <div className="text-sm text-gray-600 mt-1">IP Management</div>
              </div>
              <div className="text-center p-4 bg-teal-50 rounded-lg">
                <div className="font-semibold text-teal-600">Innovator</div>
                <div className="text-sm text-gray-600 mt-1">Basic Access</div>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions by Role */}
        <div className="space-y-6">
          {rolePermissions.map((roleData) => (
            <div key={roleData.role} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className={`px-6 py-4 ${roleData.color} border-b border-gray-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-teal-600">{roleData.label}</h3>
                      <p className="text-sm opacity-80">
                        {roleData.permissions.filter(p => p.enabled).length} of {roleData.permissions.length} permissions enabled
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-teal-600`}>
                    {roleData.role}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roleData.permissions.map((permission, index) => (
                    <div key={index} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      <div className="flex-shrink-0 mt-1">
                        {permission.enabled ? (
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box - Removed as placeholder note no longer needed */}

      </div>
    </div>
  );
};

export default Permissions;
