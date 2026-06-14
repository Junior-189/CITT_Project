import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const IPRecords = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIP, setSelectedIP] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  const fetchIPRecords = useCallback(async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const params = { page, limit: 50 };
      if (searchTerm) params.search = searchTerm;
      const response = await api.get('/api/ipmanager/ip-records', { params });
      setIps(response.data.ipRecords || []);
      setPagination(response.data.pagination || { total: 0, pages: 0 });
      setError(null);
    } catch (err) {
      console.error('Error fetching IP records:', err);
      setError('Failed to fetch IP records. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, getAuthenticatedAxios]);

  useEffect(() => {
    fetchIPRecords();
  }, [fetchIPRecords]);

  const formatDate = (value) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleString();
    } catch (e) {
      return String(value);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300';
    }
  };

  const getIPTypeColor = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'patent':
        return 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-400';
      case 'trademark':
        return 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400';
      case 'copyright':
        return 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400';
      case 'design':
        return 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300';
    }
  };

  const filteredIPs = ips.filter(ip => {
    const matchesType = filterType === 'all' || (ip.ip_type || '').toLowerCase() === filterType;
    const matchesStatus = filterStatus === 'all' || ip.approval_status === filterStatus;
    return matchesType && matchesStatus;
  });

  const stats = {
    total: pagination.total || ips.length,
    patent: ips.filter(ip => (ip.ip_type || '').toLowerCase() === 'patent').length,
    trademark: ips.filter(ip => (ip.ip_type || '').toLowerCase() === 'trademark').length,
    approved: ips.filter(ip => ip.approval_status === 'approved').length,
    pending: ips.filter(ip => ip.approval_status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-slate-400">Loading IP records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">IP Records</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">View and manage all intellectual property records</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400">
            IP Manager Access
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button onClick={fetchIPRecords} className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 underline">Retry</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <p className="text-gray-600 dark:text-slate-400 text-sm">Total IP Records</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <p className="text-gray-600 dark:text-slate-400 text-sm">Patents</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{stats.patent}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <p className="text-gray-600 dark:text-slate-400 text-sm">Pending</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <p className="text-gray-600 dark:text-slate-400 text-sm">Approved</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{stats.approved}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Search IP Records</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, inventors, or patent number..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Filter by IP Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700"
              >
                <option value="all">All Types</option>
                <option value="patent">Patent</option>
                <option value="trademark">Trademark</option>
                <option value="copyright">Copyright</option>
                <option value="design">Industrial Design</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {filteredIPs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-slate-100">No IP Records Found</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">No intellectual property records match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIPs.map((ip) => (
              <div key={ip.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{ip.title || ip.ip_title || 'Untitled'}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">IP ID: {ip.id}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ip.ip_type && (
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getIPTypeColor(ip.ip_type)}`}>
                          {ip.ip_type}
                        </span>
                      )}
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ip.approval_status)}`}>
                        {ip.approval_status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Submitted By</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{ip.user_name || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{ip.user_email || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Inventors</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{ip.inventors || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Submitted</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{formatDate(ip.created_at)}</p>
                  </div>
                </div>

                {(ip.abstract || ip.description) && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Description</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">{ip.abstract || ip.description}</p>
                  </div>
                )}

                {ip.rejection_reason && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">Rejection Reason</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{ip.rejection_reason}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <button
                    onClick={() => { setSelectedIP(ip); setShowDetailsModal(true); }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 disabled:opacity-50">Previous</button>
            <span className="px-4 py-2 text-gray-700 dark:text-slate-300">Page {page} of {pagination.pages}</span>
            <button onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={page === pagination.pages} className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 disabled:opacity-50">Next</button>
          </div>
        )}

        {showDetailsModal && selectedIP && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => { setShowDetailsModal(false); setSelectedIP(null); }}></div>
              <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-slate-100 mb-4">IP Record Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-slate-300">Title</p>
                      <p className="text-gray-900 dark:text-slate-100">{selectedIP.title || selectedIP.ip_title || 'Untitled'}</p>
                    </div>
                    {selectedIP.ip_type && (
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-slate-300">IP Type</p>
                        <p className="text-gray-900 dark:text-slate-100">{selectedIP.ip_type}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-slate-300">Submitted By</p>
                      <p className="text-gray-900 dark:text-slate-100">{selectedIP.user_name || 'N/A'} ({selectedIP.user_email || 'N/A'})</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-slate-300">Inventors</p>
                      <p className="text-gray-900 dark:text-slate-100">{selectedIP.inventors || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-slate-300">Description</p>
                      <p className="text-gray-900 dark:text-slate-100">{selectedIP.abstract || selectedIP.description || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-slate-300">Field</p>
                        <p className="text-gray-900 dark:text-slate-100">{selectedIP.field || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-slate-300">TRL Level</p>
                        <p className="text-gray-900 dark:text-slate-100">{selectedIP.trl || 'N/A'}</p>
                      </div>
                    </div>
                    {selectedIP.patent_number && (
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-slate-300">Patent/Registration Number</p>
                        <p className="text-gray-900 dark:text-slate-100 font-mono">{selectedIP.patent_number}</p>
                      </div>
                    )}
                    {selectedIP.prior_art && (
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-slate-300">Prior Art</p>
                        <p className="text-gray-900 dark:text-slate-100">{selectedIP.prior_art}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-slate-300">Approval Status</p>
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedIP.approval_status)}`}>
                          {selectedIP.approval_status || 'pending'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-slate-300">Submitted Date</p>
                        <p className="text-gray-900 dark:text-slate-100">{formatDate(selectedIP.created_at)}</p>
                      </div>
                    </div>
                    {selectedIP.approved_by_name && (
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-slate-300">Reviewed By</p>
                        <p className="text-gray-900 dark:text-slate-100">{selectedIP.approved_by_name} on {formatDate(selectedIP.approved_at)}</p>
                      </div>
                    )}
                    {selectedIP.rejection_reason && (
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                        <p className="font-semibold text-red-700 dark:text-red-400">Rejection Reason</p>
                        <p className="text-red-600 dark:text-red-400">{selectedIP.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => { setShowDetailsModal(false); setSelectedIP(null); }}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IPRecords;
