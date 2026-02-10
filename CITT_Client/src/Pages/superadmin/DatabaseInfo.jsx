import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const DatabaseInfo = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [databaseData, setDatabaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const response = await api.get('/api/superadmin/database/info');
      setDatabaseData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch database information');
      console.error('Error fetching database info:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading database information...</p>
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

  const { tables, overview } = databaseData || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Database Information</h1>
          <p className="text-gray-600 mt-2">Detailed view of database tables and records</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
            <span className="mr-1"> </span> SuperAdmin Only
          </div>
        </div>

        {/* Overview Statistics */}
        {overview && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <svg className="w-8 h-8 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-600 text-sm">Total Tables</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.total_tables || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-600 text-sm">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.total_records || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-600 text-sm">Database Size</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.database_size || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-600 text-sm">Status</p>
                    <p className="text-xl font-bold text-green-600">Connected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tables Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tables & Records</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Records
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tables && tables.length > 0 ? (
                    tables.map((table, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-teal-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{table.name}</div>
                              <div className="text-xs text-gray-500">{table.schema || 'public'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{table.description || getTableDescription(table.name)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">
                            {table.record_count || 0} records
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {table.last_updated ? new Date(table.last_updated).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No tables found</h3>
                        <p className="mt-1 text-sm text-gray-500">Database tables information is not available.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Projects Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects Data</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Registered Projects</span>
                <span className="text-lg font-bold text-gray-900">
                  {tables?.find(t => t.name === 'projects')?.record_count || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Approvals</span>
                <span className="text-lg font-bold text-yellow-600">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Approved Projects</span>
                <span className="text-lg font-bold text-green-600">-</span>
              </div>
            </div>
          </div>

          {/* Funding Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding Data</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Funding Applications</span>
                <span className="text-lg font-bold text-gray-900">
                  {tables?.find(t => t.name === 'funding')?.record_count || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Review</span>
                <span className="text-lg font-bold text-yellow-600">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Approved Funding</span>
                <span className="text-lg font-bold text-green-600">-</span>
              </div>
            </div>
          </div>

          {/* Events Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Events Data</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Events</span>
                <span className="text-lg font-bold text-gray-900">
                  {tables?.find(t => t.name === 'events')?.record_count || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Events</span>
                <span className="text-lg font-bold text-blue-600">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Past Events</span>
                <span className="text-lg font-bold text-purple-600">-</span>
              </div>
            </div>
          </div>

          {/* IP Management Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">IP Management Data</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total IP Records</span>
                <span className="text-lg font-bold text-gray-900">
                  {tables?.find(t => t.name === 'ip_management')?.record_count || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Review</span>
                <span className="text-lg font-bold text-yellow-600">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Approved IPs</span>
                <span className="text-lg font-bold text-green-600">-</span>
              </div>
            </div>
          </div>

          {/* User Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Data</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Users</span>
                <span className="text-lg font-bold text-gray-900">
                  {tables?.find(t => t.name === 'users')?.record_count || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Users</span>
                <span className="text-lg font-bold text-green-600">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Inactive Users</span>
                <span className="text-lg font-bold text-red-600">-</span>
              </div>
            </div>
          </div>

          {/* System Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Data</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Audit Logs</span>
                <span className="text-lg font-bold text-gray-900">
                  {tables?.find(t => t.name === 'audit_logs')?.record_count || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Permissions</span>
                <span className="text-lg font-bold text-blue-600">
                  {tables?.find(t => t.name === 'role_permissions')?.record_count || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Notifications</span>
                <span className="text-lg font-bold text-purple-600">
                  {tables?.find(t => t.name === 'notifications')?.record_count || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to provide descriptions for common tables
const getTableDescription = (tableName) => {
  const descriptions = {
    users: 'User accounts and authentication data',
    projects: 'Innovation projects submitted by users',
    funding: 'Funding requests and applications',
    ip_management: 'Intellectual property management records',
    events: 'System events and activities',
    audit_logs: 'System activity and audit trail',
    notifications: 'User notifications and alerts',
    role_permissions: 'Role-based access control permissions'
  };

  return descriptions[tableName] || 'Database table';
};

export default DatabaseInfo;
