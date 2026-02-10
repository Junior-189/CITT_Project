import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SystemStats = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const response = await api.get('/api/superadmin/system/stats');
      setSystemData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch system statistics');
      console.error('Error fetching system stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { system, database, users, projects, funding, ip_management } = systemData || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">System Statistics</h1>
          <p className="text-gray-600 mt-2">Comprehensive system information and metrics</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-600">
            <span className="mr-1"> </span> SuperAdmin Only
          </div>
        </div>

        {/* System Overview */}
        {system && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-600 text-sm">Server Status</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {system.status || 'Online'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Database Status</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {system.database_status || 'Connected'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">System Uptime</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {system.uptime || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Information */}
        {database && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Information</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-gray-600 text-sm">Total Tables</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {database.total_tables || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {database.total_records || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Database Size</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {database.size || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Last Backup</p>
                  <p className="text-lg font-bold text-gray-900 mt-2">
                    {database.last_backup || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comprehensive Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Users Statistics */}
          {users && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Statistics</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Users</span>
                    <span className="text-2xl font-bold text-gray-900">{users.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">SuperAdmins</span>
                    <span className="text-xl font-bold text-purple-600">{users.super_admins || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Admins</span>
                    <span className="text-xl font-bold text-teal-600">{users.admins || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">IP Managers</span>
                    <span className="text-xl font-bold text-orange-600">{users.ip_managers || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Innovators</span>
                    <span className="text-xl font-bold text-blue-600">{users.innovators || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Projects Statistics */}
          {projects && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Statistics</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Projects</span>
                    <span className="text-2xl font-bold text-gray-900">{projects.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Approval</span>
                    <span className="text-xl font-bold text-yellow-600">{projects.pending || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Approved</span>
                    <span className="text-xl font-bold text-green-600">{projects.approved || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">In Progress</span>
                    <span className="text-xl font-bold text-blue-600">{projects.in_progress || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completed</span>
                    <span className="text-xl font-bold text-purple-600">{projects.completed || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Funding Statistics */}
          {funding && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Funding Statistics</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Applications</span>
                    <span className="text-2xl font-bold text-gray-900">{funding.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending</span>
                    <span className="text-xl font-bold text-yellow-600">{funding.pending || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Approved</span>
                    <span className="text-xl font-bold text-green-600">{funding.approved || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Requested</span>
                    <span className="text-lg font-bold text-blue-600">
                      {funding.total_requested ? `${Number(funding.total_requested).toLocaleString()} TZS` : '0 TZS'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Approved</span>
                    <span className="text-lg font-bold text-green-600">
                      {funding.total_approved ? `${Number(funding.total_approved).toLocaleString()} TZS` : '0 TZS'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IP Management Statistics */}
          {ip_management && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">IP Management</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total IP Records</span>
                    <span className="text-2xl font-bold text-gray-900">{ip_management.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending</span>
                    <span className="text-xl font-bold text-yellow-600">{ip_management.pending || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Approved</span>
                    <span className="text-xl font-bold text-green-600">{ip_management.approved || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rejected</span>
                    <span className="text-xl font-bold text-red-600">{ip_management.rejected || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* System Health Indicators */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm text-gray-600">API Server</p>
                <p className="font-medium text-gray-900">Operational</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm text-gray-600">Database</p>
                <p className="font-medium text-gray-900">Connected</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm text-gray-600">Authentication</p>
                <p className="font-medium text-gray-900">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStats;
