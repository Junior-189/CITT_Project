import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const PendingApprovals = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [pendingIPs, setPendingIPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedIP, setSelectedIP] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  const fetchPendingApplications = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const response = await api.get('/api/ipmanager/pending');
      setPendingIPs(response.data.pending || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching pending applications:', err);
      setError('Failed to fetch pending applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedIP) return;
    try {
      setActionLoading(true);
      const api = getAuthenticatedAxios();
      await api.put(`/api/ipmanager/ip-records/${selectedIP.id}/approve`, {
        comments: approveComment || null
      });
      setSuccess(`IP application "${selectedIP.title || selectedIP.ip_title || 'Untitled'}" has been approved successfully`);
      setShowApproveModal(false);
      setSelectedIP(null);
      setApproveComment('');
      fetchPendingApplications();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Approve error:', err);
      setError(err.response?.data?.message || 'Failed to approve application');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedIP) return;
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      setActionLoading(true);
      const api = getAuthenticatedAxios();
      await api.put(`/api/ipmanager/ip-records/${selectedIP.id}/reject`, {
        reason: rejectionReason
      });
      setSuccess(`IP application "${selectedIP.title || selectedIP.ip_title || 'Untitled'}" has been rejected`);
      setShowRejectModal(false);
      setSelectedIP(null);
      setRejectionReason('');
      fetchPendingApplications();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Reject error:', err);
      setError(err.response?.data?.message || 'Failed to reject application');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(false);
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

  const getIPTypeColor = (type) => {
    switch (type) {
      case 'Patent': return 'bg-purple-100 text-purple-800';
      case 'Trademark': return 'bg-blue-100 text-blue-800';
      case 'Copyright': return 'bg-green-100 text-green-800';
      case 'Design': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve IP applications awaiting approval</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            {pendingIPs.length} Applications in Queue
          </div>
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
              <button onClick={fetchPendingApplications} className="text-sm text-red-600 hover:text-red-800 underline">Retry</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Total Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingIPs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Patents</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {pendingIPs.filter(ip => ip.ip_type === 'Patent').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Trademarks</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {pendingIPs.filter(ip => ip.ip_type === 'Trademark').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Other Types</p>
            <p className="text-3xl font-bold text-gray-600 mt-2">
              {pendingIPs.filter(ip => ip.ip_type !== 'Patent' && ip.ip_type !== 'Trademark').length}
            </p>
          </div>
        </div>

        {pendingIPs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Pending Applications</h3>
            <p className="mt-2 text-sm text-gray-600">All IP applications have been reviewed. New applications will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingIPs.map((ip, index) => (
              <div key={ip.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Queue #{index + 1}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900">{ip.title || ip.ip_title || 'Untitled'}</h3>
                    </div>
                    <p className="text-sm text-gray-500">Application ID: {ip.id}</p>
                    {ip.ip_type && (
                      <div className="mt-2">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getIPTypeColor(ip.ip_type)}`}>
                          {ip.ip_type}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(ip.created_at)}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Applicant</p>
                    <p className="text-sm text-gray-600 mt-1">{ip.user_name || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{ip.user_email || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Inventors</p>
                    <p className="text-sm text-gray-600 mt-1">{ip.inventors || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Field</p>
                    <p className="text-sm text-gray-600 mt-1">{ip.field || 'N/A'}</p>
                  </div>
                </div>

                {ip.trl && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700">TRL Level</p>
                    <p className="text-sm text-gray-600 mt-1">{ip.trl}</p>
                  </div>
                )}

                {(ip.abstract || ip.description) && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700">Description</p>
                    <p className="text-sm text-gray-600 mt-1">{ip.abstract || ip.description}</p>
                  </div>
                )}

                {ip.prior_art && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700">Prior Art</p>
                    <p className="text-sm text-gray-600 mt-1">{ip.prior_art}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => { setSelectedIP(ip); setShowApproveModal(true); }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => { setSelectedIP(ip); setShowRejectModal(true); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedIP && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => { setShowApproveModal(false); setSelectedIP(null); setApproveComment(''); }}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Approve IP Application</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Application: <strong>{selectedIP.title || selectedIP.ip_title || 'Untitled'}</strong>
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                    <textarea
                      value={approveComment}
                      onChange={(e) => setApproveComment(e.target.value)}
                      rows={3}
                      placeholder="Add any comments or patent/registration number..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="button" onClick={handleApprove} disabled={actionLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                    {actionLoading ? 'Approving...' : 'Approve Application'}
                  </button>
                  <button type="button" onClick={() => { setShowApproveModal(false); setSelectedIP(null); setApproveComment(''); }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedIP && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => { setShowRejectModal(false); setSelectedIP(null); setRejectionReason(''); }}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Reject IP Application</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Application: <strong>{selectedIP.title || selectedIP.ip_title || 'Untitled'}</strong>
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      placeholder="Please provide a reason for rejection..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="button" onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                    {actionLoading ? 'Rejecting...' : 'Reject Application'}
                  </button>
                  <button type="button" onClick={() => { setShowRejectModal(false); setSelectedIP(null); setRejectionReason(''); }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
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

export default PendingApprovals;
