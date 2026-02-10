import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ProjectApprovals = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [approvalAction, setApprovalAction] = useState('view');
  const [comments, setComments] = useState('');

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' }
  };

  const projectStatusConfig = {
    submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
    on_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800' }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentPage, filterStatus]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const params = {
        page: currentPage,
        limit: 10,
        approval_status: filterStatus
      };

      const response = await api.get('/api/admin/projects', { params });
      setProjects(response.data.projects || response.data);
      setTotalPages(response.data.pagination?.pages || 1);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalClick = (project, action) => {
    setSelectedProject(project);
    setApprovalAction(action);
    setComments('');
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedProject) return;
    try {
      const api = getAuthenticatedAxios();
      const endpoint = approvalAction === 'approve' ? 'approve' : 'reject';
      const payload = approvalAction === 'approve'
        ? { comments }
        : { reason: comments };
      await api.put(`/api/admin/projects/${selectedProject.id}/${endpoint}`, payload);
      setSuccess(`Project ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowApprovalModal(false);
      setSelectedProject(null);
      setComments('');
      fetchProjects();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setShowApprovalModal(false);
      setSelectedProject(null);
      setComments('');
      setError(err.response?.data?.error || `Failed to ${approvalAction} project`);
      setTimeout(() => setError(null), 4000);
      console.error(`Error ${approvalAction}ing project:`, err);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Project Approvals</h1>
          <p className="text-gray-600 mt-2">Review and manage project submissions</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Approval Status
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === status
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 gap-6">
          {projects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
              <p className="mt-1 text-sm text-gray-500">No projects with {filterStatus} status</p>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{project.title || project.project_title}</h3>
                    <p className="text-gray-600 mt-2 line-clamp-2">{project.description}</p>

                    <div className="mt-4 flex flex-wrap gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Submitted by:</span>
                        <p className="font-medium text-gray-900">{project.user_name || 'Unknown'}</p>
                      </div>

                      {project.project_status && (
                        <div>
                          <span className="text-sm text-gray-500">Project Status:</span>
                          <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${projectStatusConfig[project.project_status]?.color || 'bg-gray-100 text-gray-800'}`}>
                            {projectStatusConfig[project.project_status]?.label || project.project_status}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="text-sm text-gray-500">Submitted:</span>
                        <p className="font-medium text-gray-900">{new Date(project.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusConfig[project.approval_status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {statusConfig[project.approval_status]?.label || project.approval_status}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {project.approval_status === 'pending' && (
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setShowApprovalModal(true);
                          setApprovalAction('view');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m6 4H9m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View
                      </button>
                    </div>
                  )}
                </div>

                {/* Approval/Rejection Info */}
                {project.approved_by_name && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      {project.approval_status === 'approved' ? 'Approved' : 'Rejected'} by: <span className="font-medium">{project.approved_by_name}</span>
                      {project.approved_at && ` on ${new Date(project.approved_at).toLocaleDateString()}`}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Approval/Rejection Modal */}
        {showApprovalModal && selectedProject && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 backdrop-blur-none bg-white/30 transition-all" onClick={() => {
                setShowApprovalModal(false);
                setSelectedProject(null);
                setComments('');
                setApprovalAction('view');
              }}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m6 4H9m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-2xl leading-6 font-bold text-gray-900 mb-4">Project Details</h3>

                      {/* Project Title */}
                      <div className="mb-6 p-4 bg-teal-50 border-l-4 border-teal-600 rounded">
                        <h4 className="text-xl font-bold text-gray-900">
                          {selectedProject.title || selectedProject.project_title}
                        </h4>
                      </div>

                      {/* Show full project details for admin review */}
                      <div className="space-y-4 mb-6">
                        <div className="border-b border-gray-200 pb-3">
                          <span className="text-xs font-semibold text-gray-500 uppercase">Description</span>
                          <p className="mt-1 text-gray-800">{selectedProject.description}</p>
                        </div>

                        {selectedProject.problem_statement && (
                          <div className="border-b border-gray-200 pb-3">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Problem Being Solved</span>
                            <p className="mt-1 text-gray-800">{selectedProject.problem_statement}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase">Category</span>
                            <p className="mt-1 text-gray-800">{selectedProject.category}</p>
                          </div>
                          {selectedProject.institution && (
                            <div>
                              <span className="text-xs font-semibold text-gray-500 uppercase">Institution</span>
                              <p className="mt-1 text-gray-800">{selectedProject.institution}</p>
                            </div>
                          )}
                        </div>

                        {selectedProject.funding_needed !== undefined && (
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase">Funding Needed</span>
                            <p className="mt-1 text-gray-800 font-semibold">{Number(selectedProject.funding_needed).toLocaleString()} TZS</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase">Submitted By</span>
                            <p className="mt-1 text-gray-800">{selectedProject.user_name || 'Unknown'}</p>
                            <p className="text-sm text-gray-600">{selectedProject.user_email}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase">Submitted On</span>
                            <p className="mt-1 text-gray-800">{new Date(selectedProject.created_at).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-600">{new Date(selectedProject.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Approval/Reject form if action selected */}
                      {(approvalAction === 'approve' || approvalAction === 'reject') && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            {approvalAction === 'approve' ? '✓ Approval Comments (Optional)' : '✗ Reason for Rejection (Required)'}
                          </label>
                          <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows="4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                            placeholder={approvalAction === 'approve' ? 'Add any comments or feedback for the innovator...' : 'Explain why this project is being rejected...'}
                            required={approvalAction === 'reject'}
                          />
                          <div className="flex gap-3 mt-4">
                            <button
                              type="button"
                              onClick={handleApprovalSubmit}
                              disabled={approvalAction === 'reject' && !comments}
                              className={`flex-1 inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2.5 ${
                                approvalAction === 'approve'
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'bg-red-600 hover:bg-red-700'
                              } text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {approvalAction === 'approve' ? '✓ Confirm Approval' : '✗ Confirm Rejection'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setApprovalAction('view');
                                setComments('');
                              }}
                              className="flex-1 inline-flex justify-center rounded-md border-2 border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Approve/Reject buttons - only show when no action selected */}
                      {approvalAction === 'view' && (
                        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => setApprovalAction('approve')}
                            className="flex-1 inline-flex justify-center items-center gap-2 rounded-md border border-transparent shadow-sm px-6 py-3 bg-green-600 hover:bg-green-700 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Approve Project
                          </button>
                          <button
                            type="button"
                            onClick={() => setApprovalAction('reject')}
                            className="flex-1 inline-flex justify-center items-center gap-2 rounded-md border border-transparent shadow-sm px-6 py-3 bg-red-600 hover:bg-red-700 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject Project
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedProject(null);
                      setComments('');
                      setApprovalAction('view');
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

export default ProjectApprovals;
