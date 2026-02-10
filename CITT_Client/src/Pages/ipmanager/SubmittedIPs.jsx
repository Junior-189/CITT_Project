import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const SubmittedIPs = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [ips, setIps] = useState([]);
  const [filteredIps, setFilteredIps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [selectedIP, setSelectedIP] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchIPs();
  }, [page, statusFilter]);

  useEffect(() => {
    filterIPs();
  }, [search, ips]);

  const formatDate = (value) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleDateString();
    } catch (e) {
      return String(value);
    }
  };

  const fetchIPs = async () => {
    setLoading(true);
    setError(null);
    try {
      const api = getAuthenticatedAxios();
      const params = new URLSearchParams();
      if (statusFilter) params.append('approval_status', statusFilter);
      params.append('page', page);
      params.append('limit', 20);

      const res = await api.get(`/api/ipmanager/ip-records?${params.toString()}`);
      setIps(res.data.ipRecords || []);
      setPagination(res.data.pagination || { total: 0, pages: 0 });
    } catch (err) {
      console.error('Failed to fetch IPs:', err);
      setError('Failed to fetch IP submissions. Please try again.');
      setIps([]);
      setPagination({ total: 0, pages: 0 });
    }
    setLoading(false);
  };

  const filterIPs = () => {
    const filtered = ips.filter((ip) =>
      (ip.title || ip.ip_title || '').toLowerCase().includes(search.toLowerCase()) ||
      (ip.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (ip.description || ip.abstract || '').toLowerCase().includes(search.toLowerCase()) ||
      (ip.inventors || '').toLowerCase().includes(search.toLowerCase())
    );
    setFilteredIps(filtered);
  };

  const handleApprove = async () => {
    if (!selectedIP) return;
    try {
      setActionLoading(true);
      const api = getAuthenticatedAxios();
      await api.put(`/api/ipmanager/ip-records/${selectedIP.id}/approve`, {
        comments: reviewComment || null
      });
      setSuccess(`IP "${selectedIP.title || selectedIP.ip_title || 'Untitled'}" approved successfully`);
      setShowModal(false);
      setSelectedIP(null);
      setReviewComment('');
      fetchIPs();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedIP || !reviewComment.trim()) {
      setError('Please provide a rejection reason');
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      setActionLoading(true);
      const api = getAuthenticatedAxios();
      await api.put(`/api/ipmanager/ip-records/${selectedIP.id}/reject`, {
        reason: reviewComment
      });
      setSuccess(`IP "${selectedIP.title || selectedIP.ip_title || 'Untitled'}" rejected`);
      setShowModal(false);
      setSelectedIP(null);
      setReviewComment('');
      fetchIPs();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-slate-800 to-teal-700 rounded-lg shadow-md p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold">Submitted IPs</h1>
          <p className="mt-2 opacity-90">Review all IP submissions from innovators and researchers</p>
        </div>

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={fetchIPs} className="text-sm text-red-600 hover:text-red-800 underline">Retry</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by title, inventor, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : filteredIps.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No IP submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIps.map((ip) => (
                    <tr key={ip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ip.title || ip.ip_title || 'Untitled'}</div>
                        <div className="text-xs text-gray-500">{(ip.abstract || ip.description || '').substring(0, 50)}{(ip.abstract || ip.description || '').length > 50 ? '...' : ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ip.user_name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{ip.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{ip.ip_type || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ip.approval_status)}`}>
                          {ip.approval_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ip.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => { setSelectedIP(ip); setShowModal(true); setReviewComment(''); }}
                          className={`px-3 py-1 text-sm rounded-lg font-medium ${
                            ip.approval_status === 'pending'
                              ? 'bg-orange-600 text-white hover:bg-orange-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {ip.approval_status === 'pending' ? 'Review' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50">Previous</button>
            <span className="px-4 py-2 text-gray-700">Page {page} of {pagination.pages}</span>
            <button onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={page === pagination.pages} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50">Next</button>
          </div>
        )}

        {/* Review Modal */}
        {showModal && selectedIP && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => { setShowModal(false); setSelectedIP(null); }}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {selectedIP.approval_status === 'pending' ? 'Review IP Application' : 'IP Application Details'}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div><p className="font-semibold text-gray-700 text-sm">Title</p><p className="text-gray-900">{selectedIP.title || selectedIP.ip_title || 'Untitled'}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="font-semibold text-gray-700 text-sm">Applicant</p><p className="text-gray-900">{selectedIP.user_name || 'N/A'}</p></div>
                      <div><p className="font-semibold text-gray-700 text-sm">IP Type</p><p className="text-gray-900">{selectedIP.ip_type || 'N/A'}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="font-semibold text-gray-700 text-sm">Inventors</p><p className="text-gray-900">{selectedIP.inventors || 'N/A'}</p></div>
                      <div><p className="font-semibold text-gray-700 text-sm">Field</p><p className="text-gray-900">{selectedIP.field || 'N/A'}</p></div>
                    </div>
                    {(selectedIP.abstract || selectedIP.description) && (
                      <div><p className="font-semibold text-gray-700 text-sm">Description</p><p className="text-gray-600 text-sm">{selectedIP.abstract || selectedIP.description}</p></div>
                    )}
                    {selectedIP.trl && <div><p className="font-semibold text-gray-700 text-sm">TRL Level</p><p className="text-gray-900">{selectedIP.trl}</p></div>}
                    {selectedIP.rejection_reason && (
                      <div className="bg-red-50 p-3 rounded"><p className="font-semibold text-red-700 text-sm">Rejection Reason</p><p className="text-red-600 text-sm">{selectedIP.rejection_reason}</p></div>
                    )}
                  </div>

                  {selectedIP.approval_status === 'pending' && (
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comments / Rejection Reason
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                        placeholder="Add comments (required for rejection)..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  {selectedIP.approval_status === 'pending' && (
                    <>
                      <button onClick={handleApprove} disabled={actionLoading}
                        className="w-full inline-flex justify-center rounded-md shadow-sm px-4 py-2 bg-green-600 text-white font-medium hover:bg-green-700 sm:w-auto sm:text-sm disabled:opacity-50">
                        {actionLoading ? 'Processing...' : 'Approve'}
                      </button>
                      <button onClick={handleReject} disabled={actionLoading || !reviewComment.trim()}
                        className="w-full inline-flex justify-center rounded-md shadow-sm px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 sm:w-auto sm:text-sm disabled:opacity-50">
                        {actionLoading ? 'Processing...' : 'Reject'}
                      </button>
                    </>
                  )}
                  <button onClick={() => { setShowModal(false); setSelectedIP(null); setReviewComment(''); }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-700 font-medium hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
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

export default SubmittedIPs;
