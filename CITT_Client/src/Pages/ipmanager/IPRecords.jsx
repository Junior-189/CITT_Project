import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchIPRecords();
  }, [page]);

  const fetchIPRecords = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const response = await api.get('/api/ipmanager/ip-records', {
        params: { page, limit: 50 }
      });
      setIps(response.data.ipRecords || []);
      setPagination(response.data.pagination || { total: 0, pages: 0 });
      setError(null);
    } catch (err) {
      console.error('Error fetching IP records:', err);
      setError('Failed to fetch IP records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIPTypeColor = (type) => {
    switch (type) {
      case 'Patent':
        return 'bg-purple-100 text-purple-800';
      case 'Trademark':
        return 'bg-blue-100 text-blue-800';
      case 'Copyright':
        return 'bg-green-100 text-green-800';
      case 'Design':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredIPs = ips.filter(ip => {
    const title = ip.title || ip.ip_title || '';
    const matchesSearch = !searchTerm ||
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ip.inventors || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ip.patent_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ip.user_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || ip.ip_type === filterType;
    const matchesStatus = filterStatus === 'all' || ip.approval_status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: pagination.total || ips.length,
    patent: ips.filter(ip => ip.ip_type === 'Patent').length,
    trademark: ips.filter(ip => ip.ip_type === 'Trademark').length,
    approved: ips.filter(ip => ip.approval_status === 'approved').length,
    pending: ips.filter(ip => ip.approval_status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading IP records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">IP Records</h1>
          <p className="text-gray-600 mt-2">View and manage all intellectual property records</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            IP Manager Access
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={fetchIPRecords} className="text-sm text-red-600 hover:text-red-800 underline">Retry</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Total IP Records</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Patents</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.patent}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search IP Records</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, inventors, or patent number..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by IP Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              >
                <option value="all">All Types</option>
                <option value="Patent">Patent</option>
                <option value="Trademark">Trademark</option>
                <option value="Copyright">Copyright</option>
                <option value="Design">Design</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-gray-900"
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
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No IP Records Found</h3>
            <p className="mt-2 text-sm text-gray-600">No intellectual property records match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIPs.map((ip) => (
              <div key={ip.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{ip.title || ip.ip_title || 'Untitled'}</h3>
                    <p className="text-sm text-gray-500 mt-1">IP ID: {ip.id}</p>
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
                    <p className="text-sm font-semibold text-gray-700">Submitted By</p>
                    <p className="text-sm text-gray-600 mt-1">{ip.user_name || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{ip.user_email || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Inventors</p>
                    <p className="text-sm text-gray-600 mt-1">{ip.inventors || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Submitted</p>
                    <p className="text-sm text-gray-600 mt-1">{formatDate(ip.created_at)}</p>
                  </div>
                </div>

                {(ip.abstract || ip.description) && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700">Description</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ip.abstract || ip.description}</p>
                  </div>
                )}

                {ip.rejection_reason && (
                  <div className="mb-4 bg-red-50 p-3 rounded">
                    <p className="text-sm font-semibold text-red-700">Rejection Reason</p>
                    <p className="text-sm text-red-600 mt-1">{ip.rejection_reason}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-200">
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
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50">Previous</button>
            <span className="px-4 py-2 text-gray-700">Page {page} of {pagination.pages}</span>
            <button onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={page === pagination.pages} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50">Next</button>
          </div>
        )}

        {showDetailsModal && selectedIP && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => { setShowDetailsModal(false); setSelectedIP(null); }}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">IP Record Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-700">Title</p>
                      <p className="text-gray-900">{selectedIP.title || selectedIP.ip_title || 'Untitled'}</p>
                    </div>
                    {selectedIP.ip_type && (
                      <div>
                        <p className="font-semibold text-gray-700">IP Type</p>
                        <p className="text-gray-900">{selectedIP.ip_type}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-700">Submitted By</p>
                      <p className="text-gray-900">{selectedIP.user_name || 'N/A'} ({selectedIP.user_email || 'N/A'})</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Inventors</p>
                      <p className="text-gray-900">{selectedIP.inventors || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Description</p>
                      <p className="text-gray-900">{selectedIP.abstract || selectedIP.description || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-gray-700">Field</p>
                        <p className="text-gray-900">{selectedIP.field || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">TRL Level</p>
                        <p className="text-gray-900">{selectedIP.trl || 'N/A'}</p>
                      </div>
                    </div>
                    {selectedIP.patent_number && (
                      <div>
                        <p className="font-semibold text-gray-700">Patent/Registration Number</p>
                        <p className="text-gray-900 font-mono">{selectedIP.patent_number}</p>
                      </div>
                    )}
                    {selectedIP.prior_art && (
                      <div>
                        <p className="font-semibold text-gray-700">Prior Art</p>
                        <p className="text-gray-900">{selectedIP.prior_art}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-gray-700">Approval Status</p>
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedIP.approval_status)}`}>
                          {selectedIP.approval_status || 'pending'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Submitted Date</p>
                        <p className="text-gray-900">{formatDate(selectedIP.created_at)}</p>
                      </div>
                    </div>
                    {selectedIP.approved_by_name && (
                      <div>
                        <p className="font-semibold text-gray-700">Reviewed By</p>
                        <p className="text-gray-900">{selectedIP.approved_by_name} on {formatDate(selectedIP.approved_at)}</p>
                      </div>
                    )}
                    {selectedIP.rejection_reason && (
                      <div className="bg-red-50 p-3 rounded">
                        <p className="font-semibold text-red-700">Rejection Reason</p>
                        <p className="text-red-600">{selectedIP.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => { setShowDetailsModal(false); setSelectedIP(null); }}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
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
