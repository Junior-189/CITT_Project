import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

const getActionType = (log) => {
  const action = String(log?.action || '').toLowerCase();

  if (action.includes('approve')) return 'approval';
  if (action.includes('reject')) return 'rejection';
  if (action.includes('change_user_role') || (action.includes('role') && action.includes('user'))) {
    return 'role_change';
  }
  if (action.includes('login')) return 'login';
  if (action.includes('logout')) return 'logout';
  if (action.startsWith('post ')) return 'create';
  if (action.startsWith('put ') || action.startsWith('patch ')) return 'update';
  if (action.startsWith('delete ')) return 'delete';

  return 'other';
};

const AuditLogs = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [rawLogs, setRawLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterUser]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const response = await api.get('/api/admin/audit-logs', {
        params: { limit: 1000, offset: 0 }
      });
      setRawLogs(response.data.logs || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDescription = (log) => {
    const actionType = getActionType(log);
    const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
    const resource = log.resource ? `${log.resource}${log.resource_id ? ` #${log.resource_id}` : ''}` : '';

    if (actionType === 'approval') {
      const comments = details?.body?.comments;
      const amount = details?.body?.amount_approved;
      let desc = `Approved ${resource}`;
      if (amount) desc += ` (Amount: ${Number(amount).toLocaleString()} TZS)`;
      if (comments) desc += ` — "${comments}"`;
      return desc;
    }

    if (actionType === 'rejection') {
      const reason = details?.body?.reason || details?.body?.rejection_reason;
      let desc = `Rejected ${resource}`;
      if (reason) desc += ` — "${reason}"`;
      return desc;
    }

    if (actionType === 'role_change') {
      const newRole = details?.body?.role || details?.body?.newRole;
      let desc = `Role change on ${resource}`;
      if (newRole) desc += ` to "${newRole}"`;
      return desc;
    }

    if (actionType === 'login') return 'User logged in';
    if (actionType === 'logout') return 'User logged out';

    if (actionType === 'create') {
      const title = details?.body?.title;
      return title ? `Created ${resource}: "${title}"` : `Created ${resource}`;
    }

    if (actionType === 'update') {
      return `Updated ${resource}`;
    }

    if (actionType === 'delete') {
      return `Deleted ${resource}`;
    }

    return [log.action, resource].filter(Boolean).join(' — ') || 'No details';
  };

  const logs = useMemo(() => {
    const userQuery = filterUser.trim().toLowerCase();

    return rawLogs.filter((log) => {
      const actionType = getActionType(log);

      if (filterType !== 'all' && actionType !== filterType) return false;

      if (userQuery) {
        const searchable = [
          log.user_email,
          log.user_role,
          log.user_id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchable.includes(userQuery)) return false;
      }

      return true;
    });
  }, [rawLogs, filterType, filterUser]);

  const actionTypes = {
    login: { label: 'Login', color: 'bg-blue-100 text-blue-800' },
    logout: { label: 'Logout', color: 'bg-gray-100 text-gray-800' },
    create: { label: 'Create', color: 'bg-green-100 text-green-800' },
    update: { label: 'Update', color: 'bg-yellow-100 text-yellow-800' },
    delete: { label: 'Delete', color: 'bg-red-100 text-red-800' },
    role_change: { label: 'Role Change', color: 'bg-purple-100 text-purple-800' },
    approval: { label: 'Approval', color: 'bg-teal-100 text-teal-800' },
    rejection: { label: 'Rejection', color: 'bg-orange-100 text-orange-800' },
    other: { label: 'Other', color: 'bg-slate-100 text-slate-800' }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action Type', 'Description', 'Status'];
    const rows = logs.map(log => {
      const actionType = getActionType(log);
      const actionConfig = actionTypes[actionType] || actionTypes.other;
      const userLabel = log.user_email || (log.user_id ? `User #${log.user_id}` : 'Anonymous');
      return [
        formatDate(log.created_at || log.timestamp),
        userLabel,
        log.user_role || '',
        actionConfig.label,
        getDescription(log).replace(/"/g, '""'),
        log.status || 'N/A'
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    const rows = logs.map(log => {
      const actionType = getActionType(log);
      const actionConfig = actionTypes[actionType] || actionTypes.other;
      const userLabel = log.user_email || (log.user_id ? `User #${log.user_id}` : 'Anonymous');
      return `<tr>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${formatDate(log.created_at || log.timestamp)}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${userLabel}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${log.user_role || ''}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${actionConfig.label}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${getDescription(log)}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${log.status || 'N/A'}</td>
      </tr>`;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Audit Logs Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1a202c; font-size: 22px; }
          p { color: #4a5568; font-size: 13px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #0d9488; color: white; padding: 8px; text-align: left; font-size: 11px; border: 1px solid #0d9488; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <h1>CITT System - Audit Logs Report</h1>
        <p>Generated: ${new Date().toLocaleString()} | Total Logs: ${logs.length}${filterType !== 'all' ? ` | Filter: ${actionTypes[filterType]?.label}` : ''}${filterUser ? ` | User: ${filterUser}` : ''}</p>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Role</th>
              <th>Action Type</th>
              <th>Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  // Pagination logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-2">View all system activity and user actions</p>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-600">
              SuperAdmin & Admin Only
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
            <button
              onClick={exportToPDF}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Total Logs</p>
            <p className="text-3xl font-bold text-black mt-2">{logs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Login Events</p>
            <p className="text-3xl font-bold text-black mt-2">
              {logs.filter(log => getActionType(log) === 'login').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Modifications</p>
            <p className="text-3xl font-bold text-black mt-2">
              {logs.filter(log => ['create', 'update', 'delete'].includes(getActionType(log))).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Role Changes</p>
            <p className="text-3xl font-bold text-black mt-2">
              {logs.filter(log => getActionType(log) === 'role_change').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Action Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              >
                <option value="all">All Actions</option>
                {Object.entries(actionTypes).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by User
              </label>
              <input
                type="text"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                placeholder="Enter user email, role, or ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterUser('');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Logs List */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Logs Available</h3>
            <p className="mt-2 text-sm text-gray-600">
              No audit logs found. Activity will appear here once users perform actions in the system.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentLogs.map((log, index) => {
                      const actionType = getActionType(log);
                      const actionConfig = actionTypes[actionType] || actionTypes.other;
                      const userLabel = log.user_email || (log.user_id ? `User #${log.user_id}` : 'Anonymous');

                      return (
                        <tr key={log.id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.created_at || log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                              <span className="text-teal-700 font-semibold text-xs">
                                {userLabel.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {userLabel}
                              </p>
                              <p className="text-xs text-gray-500">{log.user_role || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            actionConfig.color
                          }`}>
                            {actionConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                          {getDescription(log)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {log.status || 'N/A'}
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-md">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstLog + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(indexOfLastLog, logs.length)}</span> of{' '}
                      <span className="font-medium">{logs.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {[...Array(Math.min(totalPages, 10))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 10) {
                          pageNum = i + 1;
                        } else if (currentPage <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 4) {
                          pageNum = totalPages - 9 + i;
                        } else {
                          pageNum = currentPage - 4 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-teal-600 border-teal-600 text-white'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
