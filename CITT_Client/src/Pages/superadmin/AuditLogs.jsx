import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const LOGS_PER_PAGE = 20;

const actionTypeConfig = {
  login: { label: 'Login', color: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400' },
  logout: { label: 'Logout', color: 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400' },
  create: { label: 'Create', color: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' },
  update: { label: 'Update', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' },
  delete: { label: 'Delete', color: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400' },
  role_change: { label: 'Role Change', color: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400' },
  approval: { label: 'Approval', color: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-400' },
  rejection: { label: 'Rejection', color: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400' },
  other: { label: 'Other', color: 'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-400' },
};

const getActionType = (log) => {
  const action = String(log?.action || '').toLowerCase();
  if (action.includes('approve')) return 'approval';
  if (action.includes('reject')) return 'rejection';
  if (action.includes('change_user_role') || (action.includes('role') && action.includes('user'))) return 'role_change';
  if (action.includes('login')) return 'login';
  if (action.includes('logout')) return 'logout';
  if (action.startsWith('post ')) return 'create';
  if (action.startsWith('put ') || action.startsWith('patch ')) return 'update';
  if (action.startsWith('delete ')) return 'delete';
  return 'other';
};

const parseDetails = (details) => {
  if (!details) return null;
  try {
    return typeof details === 'string' ? JSON.parse(details) : details;
  } catch {
    return typeof details === 'string' ? details : null;
  }
};

const getDescription = (log) => {
  const actionType = getActionType(log);
  const details = parseDetails(log.details);
  const resource = log.resource ? `${log.resource}${log.resource_id ? ` #${log.resource_id}` : ''}` : '';

  if (actionType === 'approval') {
    const comments = details?.body?.comments;
    const amount = details?.body?.amount_approved;
    let desc = `Approved ${resource}`;
    if (amount) desc += ` (${Number(amount).toLocaleString()} TZS)`;
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
  if (actionType === 'update') return `Updated ${resource}`;
  if (actionType === 'delete') return `Deleted ${resource}`;
  return [log.action, resource].filter(Boolean).join(' — ') || 'No details';
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className || ''}`} />
);

const AuditLogs = () => {
  const { getAuthenticatedAxios, role } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('');
  const [filterResource, setFilterResource] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [cleanupMsg, setCleanupMsg] = useState(null);

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const params = { limit: LOGS_PER_PAGE, offset: (page - 1) * LOGS_PER_PAGE };

      if (filterType !== 'all' && filterType !== 'other') {
        params.action = filterType;
      } else if (filterType === 'all') {
        // no action filter
      }

      if (filterUser.trim()) {
        params.user_id = filterUser.trim();
      }
      if (filterResource !== 'all') {
        params.resource = filterResource;
      }
      if (filterStartDate) {
        params.start_date = filterStartDate;
      }
      if (filterEndDate) {
        params.end_date = filterEndDate;
      }

      const response = await api.get('/api/admin/audit-logs', { params });
      setLogs(response.data.logs || []);
      setTotal(response.data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedAxios, filterType, filterUser, filterResource, filterStartDate, filterEndDate]);

  useEffect(() => { fetchLogs(currentPage); }, [currentPage, fetchLogs]);

  useEffect(() => { setCurrentPage(1); }, [filterType, filterUser, filterResource, filterStartDate, filterEndDate]);

  const handleCleanup = async () => {
    const days = window.prompt('Delete logs older than how many days?', '90');
    if (!days) return;
    try {
      const api = getAuthenticatedAxios();
      const res = await api.delete(`/api/superadmin/audit-logs/cleanup?days=${encodeURIComponent(days)}`);
      setCleanupMsg(`${res.data.message} (${res.data.deletedCount} deleted)`);
      fetchLogs(1);
      setTimeout(() => setCleanupMsg(null), 5000);
    } catch (err) {
      setCleanupMsg(err.response?.data?.error || 'Cleanup failed');
      setTimeout(() => setCleanupMsg(null), 5000);
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action Type', 'Description', 'Status'];
    const rows = logs.map(log => {
      const actionType = getActionType(log);
      const config = actionTypeConfig[actionType] || actionTypeConfig.other;
      const userLabel = log.user_email || (log.user_id ? `User #${log.user_id}` : 'Anonymous');
      return [
        formatDate(log.created_at || log.timestamp),
        userLabel,
        log.user_role || '',
        config.label,
        getDescription(log).replace(/"/g, '""'),
        log.status || 'N/A',
      ];
    });
    const csvContent = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
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
      const config = actionTypeConfig[actionType] || actionTypeConfig.other;
      const userLabel = log.user_email || (log.user_id ? `User #${log.user_id}` : 'Anonymous');
      return `<tr>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${formatDate(log.created_at || log.timestamp)}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${userLabel}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${log.user_role || ''}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${config.label}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${getDescription(log)}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${log.status || 'N/A'}</td>
      </tr>`;
    }).join('');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Audit Logs Report</title>
      <style>body{font-family:Arial,sans-serif;margin:20px}h1{color:#1a202c;font-size:22px}p{color:#4a5568;font-size:13px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#0d9488;color:#fff;padding:8px;text-align:left;font-size:11px;border:1px solid #0d9488}@media print{body{margin:10px}}</style></head><body>
      <h1>CITT System - Audit Logs Report</h1>
      <p>Generated: ${new Date().toLocaleString()} | Total Logs: ${total}${filterType !== 'all' ? ` | Filter: ${actionTypeConfig[filterType]?.label || filterType}` : ''}${filterUser ? ` | User: ${filterUser}` : ''}</p>
      <table><thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action Type</th><th>Description</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const totalPages = Math.ceil(total / LOGS_PER_PAGE);

  const loginCount = logs.filter(l => getActionType(l) === 'login').length;
  const modCount = logs.filter(l => ['create', 'update', 'delete'].includes(getActionType(l))).length;
  const roleCount = logs.filter(l => getActionType(l) === 'role_change').length;

  const uniqueResources = [...new Set(logs.map(l => l.resource).filter(Boolean))].sort();

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-slate-400">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Audit Logs</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2">View all system activity and user actions</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportToCSV} disabled={logs.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm flex items-center gap-2 disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export CSV
            </button>
            <button onClick={exportToPDF} disabled={logs.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm flex items-center gap-2 disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              Export PDF
            </button>
            {role === 'superAdmin' && (
              <button onClick={handleCleanup}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Cleanup Old Logs
              </button>
            )}
          </div>
        </div>

        {/* Cleanup message */}
        {cleanupMsg && (
          <div className="mb-4 bg-teal-50 dark:bg-teal-500/10 border-l-4 border-teal-500 p-4 rounded">
            <p className="text-sm text-teal-700 dark:text-teal-300">{cleanupMsg}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 p-4 rounded">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button onClick={() => fetchLogs(currentPage)} className="text-sm text-red-600 hover:text-red-800 underline">Retry</button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Logs', value: total },
            { label: 'Login Events', value: loginCount, note: 'on page' },
            { label: 'Modifications', value: modCount, note: 'on page' },
            { label: 'Role Changes', value: roleCount, note: 'on page' },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
              <p className="text-gray-500 dark:text-slate-400 text-sm">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{card.value}</p>
              {card.note && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">({card.note})</p>}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Action Type</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm text-gray-900 dark:text-slate-100">
                <option value="all">All Actions</option>
                {Object.entries(actionTypeConfig).map(([type, cfg]) => (
                  <option key={type} value={type}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Resource</label>
              <select value={filterResource} onChange={e => setFilterResource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm text-gray-900 dark:text-slate-100">
                <option value="all">All Resources</option>
                {uniqueResources.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Search User</label>
              <input type="text" value={filterUser} onChange={e => setFilterUser(e.target.value)}
                placeholder="Email, role, or ID"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500" />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Start Date</label>
              <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm text-gray-900 dark:text-slate-100" />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">End Date</label>
              <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm text-gray-900 dark:text-slate-100" />
            </div>
            <div className="flex items-end">
              <button onClick={() => { setFilterType('all'); setFilterUser(''); setFilterResource('all'); setFilterStartDate(''); setFilterEndDate(''); }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium text-sm">
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        {logs.length === 0 && !loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-slate-100">No Logs Found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              No audit logs match your filters. Try adjusting the filters or clear them.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Action Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {logs.map((log, index) => {
                      const actionType = getActionType(log);
                      const config = actionTypeConfig[actionType] || actionTypeConfig.other;
                      const userLabel = log.user_email || (log.user_id ? `User #${log.user_id}` : 'Anonymous');
                      const isExpanded = expandedRow === (log.id || index);
                      const description = getDescription(log);

                      return (
                        <React.Fragment key={log.id || index}>
                          <tr
                            onClick={() => setExpandedRow(isExpanded ? null : (log.id || index))}
                            className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                              {formatDate(log.created_at || log.timestamp)}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-teal-700 dark:text-teal-400 font-semibold text-xs">{userLabel.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="ml-3 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate max-w-[160px]">{userLabel}</p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400">{log.user_role || ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                              <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
                                {config.label}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-900 dark:text-slate-100 max-w-md">
                              <span className={isExpanded ? '' : 'line-clamp-2'}>{description}</span>
                              {!isExpanded && description && description.length > 80 && (
                                <span className="text-teal-600 dark:text-teal-400 text-xs ml-1 cursor-pointer">more</span>
                              )}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                                {log.status || 'N/A'}
                              </span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50">
                                <div className="text-sm">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                    <div><span className="text-gray-500 dark:text-slate-400">Action:</span> <span className="text-gray-900 dark:text-slate-100 font-mono text-xs">{log.action}</span></div>
                                    <div><span className="text-gray-500 dark:text-slate-400">Resource:</span> <span className="text-gray-900 dark:text-slate-100">{log.resource}{log.resource_id ? ` #${log.resource_id}` : ''}</span></div>
                                    <div><span className="text-gray-500 dark:text-slate-400">IP:</span> <span className="text-gray-900 dark:text-slate-100 font-mono text-xs">{log.ip_address || 'N/A'}</span></div>
                                  </div>
                                  <div className="mb-3">
                                    <span className="text-gray-500 dark:text-slate-400">User Agent:</span>
                                    <p className="text-gray-900 dark:text-slate-100 text-xs font-mono mt-1 break-all">{log.user_agent || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-slate-400">Details:</span>
                                    <pre className="mt-1 text-xs bg-gray-100 dark:bg-slate-900 p-3 rounded overflow-x-auto text-gray-900 dark:text-slate-100 max-h-48">
                                      {JSON.stringify(parseDetails(log.details) || log.details || 'No details', null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-700 sm:px-6 mt-4 rounded-lg shadow-md">
              <div>
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  Showing <span className="font-medium">{total === 0 ? 0 : (currentPage - 1) * LOGS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * LOGS_PER_PAGE, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> results
                </p>
              </div>
              {totalPages > 1 && (
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50">Prev</button>
                    {(() => {
                      const pages = [];
                      const maxVisible = 7;
                      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                      let end = Math.min(totalPages, start + maxVisible - 1);
                      if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
                      for (let i = start; i <= end; i++) pages.push(i);
                      return pages.map(p => (
                        <button key={p} onClick={() => setCurrentPage(p)}
                          className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${currentPage === p ? 'z-10 bg-teal-600 border-teal-600 text-white' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'}`}>
                          {p}
                        </button>
                      ));
                    })()}
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50">Next</button>
                  </nav>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
