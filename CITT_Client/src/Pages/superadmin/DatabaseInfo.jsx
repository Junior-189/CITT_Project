import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const TABLE_DESCRIPTIONS = {
  users: 'User accounts and authentication data',
  projects: 'Innovation projects submitted by users',
  funding: 'Funding requests and applications',
  ip_management: 'Intellectual property management records',
  events: 'System events and activities',
  audit_logs: 'System activity and audit trail',
  notifications: 'User notifications and alerts',
  role_permissions: 'Role-based access control permissions',
};

const getTableDescription = (name) => TABLE_DESCRIPTIONS[name] || 'Database table';

const ICON_COLORS = {
  teal: { bg: 'bg-teal-100 dark:bg-teal-500/20', text: 'text-teal-700 dark:text-teal-400' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
  green: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400' },
};

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className || ''}`} />
);

const DatabaseInfo = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [databaseData, setDatabaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTable, setExpandedTable] = useState(null);

  useEffect(() => { fetchDatabaseInfo(); }, []);

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const response = await api.get('/api/superadmin/database/info');
      setDatabaseData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch database information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-slate-400">Loading database information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 p-4 rounded">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button onClick={fetchDatabaseInfo} className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 underline">Retry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { tables, overview } = databaseData || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Database Information</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2">Detailed view of database tables and records</p>
        </div>

        {/* Database Overview */}
        {overview && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Database Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Tables', value: overview.total_tables || 0, color: 'teal', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /> },
                { label: 'Total Records', value: overview.total_records || 0, color: 'blue', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
                { label: 'Database Size', value: overview.database_size || 'N/A', color: 'purple', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /> },
                { label: 'Status', value: 'Connected', color: 'green', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
              ].map((card, i) => {
                const c = ICON_COLORS[card.color];
                return (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${c.bg}`}>
                        <svg className={`w-8 h-8 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{card.svg}</svg>
                      </div>
                      <div className="ml-4 min-w-0">
                        <p className="text-gray-500 dark:text-slate-400 text-sm">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 truncate">{card.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tables & Records */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Tables &amp; Records</h2>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Table Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Records</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Columns</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {tables && tables.length > 0 ? (
                    tables.map((table, index) => {
                      const isExpanded = expandedTable === index;
                      const colCount = table.columns?.length || 0;
                      return (
                        <React.Fragment key={index}>
                          <tr
                            onClick={() => setExpandedTable(isExpanded ? null : index)}
                            className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-teal-700 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{table.name}</div>
                                  {table.error && (
                                    <div className="text-xs text-red-500 dark:text-red-400 mt-0.5">{table.error}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-slate-100">{getTableDescription(table.name)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-400">
                                {table.record_count || 0} records
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                              {colCount} columns
                            </td>
                          </tr>
                          {isExpanded && table.columns && table.columns.length > 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50">
                                <div className="text-sm text-gray-700 dark:text-slate-300 mb-2 font-medium">Columns for {table.name}</div>
                                <div className="flex flex-wrap gap-2">
                                  {table.columns.map((col, ci) => (
                                    <span key={ci} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-slate-300">
                                      {col.column_name}
                                      <span className="ml-1.5 text-gray-400 dark:text-slate-500 font-mono">{col.data_type}</span>
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">No tables found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Database tables information is not available.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DatabaseInfo;
