import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const SubmittedProjects = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [page, statusFilter]);

  useEffect(() => {
    filterProjects();
  }, [search, projects]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const api = getAuthenticatedAxios();
      const params = new URLSearchParams();
      if (statusFilter) params.append('approval_status', statusFilter);
      params.append('page', page);
      params.append('limit', 20);

      const res = await api.get(`/api/admin/projects?${params.toString()}`);
      setProjects(res.data.projects || []);
      setPagination(res.data.pagination || { total: 0, pages: 0 });
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to fetch projects. Please try again.');
      setProjects([]);
    }
    setLoading(false);
  };

  const filterProjects = () => {
    const filtered = projects.filter((p) =>
      (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.institution || '').toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProjects(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'on_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-slate-800 to-teal-700 rounded-lg shadow-md p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold">Submitted Projects</h1>
          <p className="mt-2 opacity-90">Review all innovation and research projects submitted by innovators</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={fetchProjects} className="text-sm text-red-600 hover:text-red-800 underline">Retry</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by title, innovator, or institution..."
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
          ) : filteredProjects.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No projects found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Innovator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{proj.title || 'Untitled'}</div>
                        <div className="text-xs text-gray-500">{(proj.description || '').substring(0, 50)}{(proj.description || '').length > 50 ? '...' : ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{proj.user_name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{proj.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{proj.institution || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(proj.approval_status)}`}>
                          {proj.approval_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getProjectStatusColor(proj.project_status)}`}>
                          {proj.project_status || 'submitted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {proj.created_at ? new Date(proj.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => { setSelectedProject(proj); setShowModal(true); }}
                          className="px-3 py-1 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
                        >
                          View
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

        {/* Project Details Modal */}
        {showModal && selectedProject && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => { setShowModal(false); setSelectedProject(null); }}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-700 text-sm">Title</p>
                      <p className="text-gray-900">{selectedProject.title || 'Untitled'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-gray-700 text-sm">Innovator</p>
                        <p className="text-gray-900">{selectedProject.user_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{selectedProject.user_email}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 text-sm">Institution</p>
                        <p className="text-gray-900">{selectedProject.institution || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-gray-700 text-sm">Category</p>
                        <p className="text-gray-900">{selectedProject.category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 text-sm">Submitted</p>
                        <p className="text-gray-900">{selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 text-sm">Description</p>
                      <p className="text-gray-600 text-sm mt-1">{selectedProject.description || 'No description available'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-gray-700 text-sm">Approval Status</p>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedProject.approval_status)}`}>
                          {selectedProject.approval_status || 'pending'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 text-sm">Project Status</p>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getProjectStatusColor(selectedProject.project_status)}`}>
                          {selectedProject.project_status || 'submitted'}
                        </span>
                      </div>
                    </div>
                    {selectedProject.approved_by_name && (
                      <div>
                        <p className="font-semibold text-gray-700 text-sm">Reviewed By</p>
                        <p className="text-gray-900">{selectedProject.approved_by_name}</p>
                      </div>
                    )}
                    {selectedProject.rejection_reason && (
                      <div className="bg-red-50 p-3 rounded">
                        <p className="font-semibold text-red-700 text-sm">Rejection Reason</p>
                        <p className="text-red-600 text-sm">{selectedProject.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => { setShowModal(false); setSelectedProject(null); }}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-700 font-medium hover:bg-gray-50 sm:w-auto sm:text-sm"
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

export default SubmittedProjects;
