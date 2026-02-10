import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const FundingManagement = () => {
  const { getAuthenticatedAxios, profile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [approvalAmount, setApprovalAmount] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (profile?.id && getAuthenticatedAxios) {
      fetchApplications();
    }
  }, [profile?.id]);

  const fetchApplications = async () => {
    if (!getAuthenticatedAxios) {
      setError('Authentication not ready');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const api = getAuthenticatedAxios();
      const response = await api.get('/api/admin/funding', {
        params: { limit: 1000, page: 1 }
      });

      // Map backend fields to frontend expected format
      const data = (response.data.funding || []).map(app => ({
        id: app.id,
        title: app.title,
        grantType: app.grant_type,
        amountRequested: Number(app.amount) || 0,
        amountApproved: app.amount_approved ? Number(app.amount_approved) : (app.approval_status === 'approved' ? (Number(app.amount) || 0) : 0),
        justification: app.description,
        status: app.approval_status === 'pending' ? 'Under Review' :
                app.approval_status === 'approved' ? 'Approved' :
                app.approval_status === 'rejected' ? 'Rejected' : 'Under Review',
        projectId: app.project_id,
        createdAt: app.created_at ? { seconds: Math.floor(new Date(app.created_at).getTime() / 1000) } : null,
        approvedAt: app.approved_at ? { seconds: Math.floor(new Date(app.approved_at).getTime() / 1000) } : null,
        files: app.files || [],
        supporting: app.supporting || [],
        userId: app.user_id,
        userName: app.user_name,
        approvalStatus: app.approval_status,
        fundingStatus: app.funding_status,
        rejectionReason: app.rejection_reason
      }));

      setApplications(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch funding applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;

    const approvedAmount = approvalAmount ? Number(approvalAmount) : selectedApp.amountRequested || 0;
    setActionLoading(true);
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/admin/funding/${selectedApp.id}/approve`, {
        comments: reviewComment.trim(),
        amount_approved: approvedAmount
      });

      setApplications((prev) =>
        prev.map((p) =>
          p.id === selectedApp.id
            ? {
              ...p,
              status: "Approved",
              amountApproved: approvedAmount,
              approvalStatus: 'approved',
              fundingStatus: 'approved',
              approvedAt: { seconds: Math.floor(Date.now() / 1000) }
            }
            : p
        )
      );

      closeReviewModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve application');
      console.error('approve:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (!reviewComment.trim()) {
      setError('Please provide a reason for rejection in the comment section.');
      return;
    }

    setActionLoading(true);
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/admin/funding/${selectedApp.id}/reject`, { reason: reviewComment.trim() });

      setApplications((prev) =>
        prev.map((p) =>
          p.id === selectedApp.id ? { ...p, status: "Rejected", approvalStatus: 'rejected', rejectionReason: reviewComment.trim() } : p
        )
      );

      closeReviewModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject application');
      console.error('reject:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewModal = (app) => {
    setSelectedApp(app);
    setApprovalAmount(app.amountRequested?.toString() || '');
    setReviewComment('');
    setShowDetailsModal(true);
  };

  const closeReviewModal = () => {
    setShowDetailsModal(false);
    setSelectedApp(null);
    setApprovalAmount('');
    setReviewComment('');
  };

  const downloadCSV = () => {
    if (filteredApplications.length === 0) {
      alert("No data to export.");
      return;
    }

    const rows = filteredApplications.map(app => ({
      ID: app.id,
      Title: app.title,
      'Grant Type': app.grantType,
      'Amount Requested': app.amountRequested,
      'Amount Approved': app.amountApproved || 0,
      Status: app.status,
      'Submitted Date': app.createdAt ? new Date(app.createdAt.seconds * 1000).toLocaleDateString() : 'N/A',
    }));

    const header = Object.keys(rows[0]);
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        header
          .map((h) => {
            const v = r[h] === undefined || r[h] === null ? "" : String(r[h]).replace(/"/g, '""');
            return `"${v}"`;
          })
          .join(",")
      ),
    ].join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `funding_applications_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      alert("Popup blocked. Please allow popups for this site to print reports.");
      return;
    }

    const rows = filteredApplications.map(app => ({
      ID: app.id,
      Title: app.title,
      'Grant Type': app.grantType,
      'Amount Requested': app.amountRequested,
      'Amount Approved': app.amountApproved || 0,
      Status: app.status,
      'Submitted Date': app.createdAt ? new Date(app.createdAt.seconds * 1000).toLocaleDateString() : 'N/A',
    }));

    const headerRow = rows.length ? Object.keys(rows[0]) : [];
    const html = `
      <html>
      <head>
        <title>Funding Applications Report</title>
        <style>
          body { font-family: system-ui, Arial; padding: 20px; color: #222; }
          h2 { text-align: center; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align:left; }
          th { background:#f4f4f4; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>Funding Applications Report</h2>
        <table>
          <thead>
            <tr>${headerRow.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map((r) => `<tr>${headerRow.map((h) => `<td>${String(r[h] ?? "")}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Disbursement Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = !searchTerm ||
      app.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.grantType?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'Under Review').length,
    approved: applications.filter(a => a.status === 'Approved').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
    totalRequested: applications.reduce((sum, a) => sum + (a.amountRequested || 0), 0),
    totalApproved: applications.reduce((sum, a) => sum + (a.amountApproved || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading funding applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Funding Management</h1>
          <p className="text-gray-600 mt-2">Review, approve, and manage funding applications</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
            <span className="mr-1"> </span> Admin Only
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Total Applications</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Rejected</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Total Requested</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{stats.totalRequested.toLocaleString()} TZS</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-600 text-sm">Total Approved</p>
            <p className="text-2xl font-bold text-teal-600 mt-2">{stats.totalApproved.toLocaleString()} TZS</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Applications
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or grant type..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
	              <select
	                value={filterStatus}
	                onChange={(e) => setFilterStatus(e.target.value)}
	                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900"
	              >
	                <option value="all">All Status</option>
	                <option value="Under Review">Under Review</option>
	                <option value="Approved">Approved</option>
	                <option value="Rejected">Rejected</option>
	              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={downloadCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                Export CSV
              </button>
              <button
                onClick={printReport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Applications Found</h3>
            <p className="mt-2 text-sm text-gray-600">
              No funding applications match your current filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{app.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Application ID: {app.id}</p>
                    <div className="mt-2">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                      <span className="ml-2 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {app.grantType}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Amount Requested</p>
                    <p className="text-2xl font-bold text-blue-600">{(app.amountRequested || 0).toLocaleString()} TZS</p>
                    {app.amountApproved > 0 && (
                      <>
                        <p className="text-sm text-gray-600 mt-2">Amount Approved</p>
                        <p className="text-xl font-bold text-green-600">{(app.amountApproved || 0).toLocaleString()} TZS</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Justification</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">{app.justification}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Submitted</p>
                    <p className="text-sm text-gray-600 mt-1">{formatDate(app.createdAt)}</p>
                    {app.approvedAt && (
                      <>
                        <p className="text-sm font-semibold text-gray-700 mt-2">Approved</p>
                        <p className="text-sm text-gray-600 mt-1">{formatDate(app.approvedAt)}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Files */}
                {app.files && app.files.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Budget Documents</p>
                    <div className="flex flex-wrap gap-2">
                      {app.files.map((file, index) => (
                        <a
                          key={index}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100"
                        >
                          📄 {file.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Supporting Files */}
                {app.supporting && app.supporting.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Supporting Documents</p>
                    <div className="flex flex-wrap gap-2">
                      {app.supporting.map((file, index) => (
                        <a
                          key={index}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-gray-50 text-gray-700 rounded-md text-sm hover:bg-gray-100"
                        >
                          📎 {file.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => openReviewModal(app)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
                  >
                    {app.status === 'Under Review' ? 'Review Application' : 'View Details'}
                  </button>
                </div>
              </div>
	            ))}
          </div>
        )}

        {/* Review Details Modal */}
        {showDetailsModal && selectedApp && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
              {/* Blur backdrop */}
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={closeReviewModal}
              ></div>

              {/* Modal card */}
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Application Review</h3>
                    <p className="text-sm text-gray-500 mt-1">Review the details before taking action</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedApp.status)}`}>
                      {selectedApp.status}
                    </span>
                    <button
                      onClick={closeReviewModal}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal body */}
                <div className="px-6 py-5 space-y-5">
                  {/* Application Info */}
                  <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{selectedApp.title}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Grant Type</p>
                        <p className="text-gray-900 mt-1">{selectedApp.grantType}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Applicant</p>
                        <p className="text-gray-900 mt-1">{selectedApp.userName || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project ID</p>
                        <p className="text-gray-900 mt-1">{selectedApp.projectId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</p>
                        <p className="text-gray-900 mt-1">{formatDate(selectedApp.createdAt)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Justification</p>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedApp.justification}</p>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Amount Requested</p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">{(selectedApp.amountRequested || 0).toLocaleString()} TZS</p>
                    </div>
                    {selectedApp.amountApproved > 0 && (
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Amount Approved</p>
                        <p className="text-2xl font-bold text-green-700 mt-1">{(selectedApp.amountApproved || 0).toLocaleString()} TZS</p>
                      </div>
                    )}
                  </div>

                  {/* Attached Files */}
                  {selectedApp.files && selectedApp.files.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Budget Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedApp.files.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApp.supporting && selectedApp.supporting.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Supporting Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedApp.supporting.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejection reason (if already rejected) */}
                  {selectedApp.rejectionReason && (
                    <div className="bg-red-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Rejection Reason</p>
                      <p className="text-red-800 mt-1">{selectedApp.rejectionReason}</p>
                    </div>
                  )}

                  {/* Review Section - Only for pending applications */}
                  {selectedApp.status === 'Under Review' && (
                    <div className="border-t border-gray-200 pt-5 space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">Admin Review</h4>

                      {/* Approval Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Approved Amount (TZS)
                        </label>
                        <input
                          type="number"
                          value={approvalAmount}
                          onChange={(e) => setApprovalAmount(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                          placeholder="Enter amount to approve"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Requested: {(selectedApp.amountRequested || 0).toLocaleString()} TZS
                        </p>
                      </div>

                      {/* Comment Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Comments / Reason <span className="text-gray-400">(required for rejection)</span>
                        </label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 resize-none"
                          placeholder="Add your review comments here..."
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleApprove}
                          disabled={actionLoading}
                          className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? 'Processing...' : 'Approve Application'}
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={actionLoading}
                          className="flex-1 sm:flex-none px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? 'Processing...' : 'Reject Application'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl flex justify-end">
                  <button
                    onClick={closeReviewModal}
                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
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

export default FundingManagement;
