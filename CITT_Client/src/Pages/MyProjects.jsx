import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MyProjects = () => {
  const { profile, getAuthenticatedAxios } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resubmitting, setResubmitting] = useState(null);

  // Fetch user's projects from backend
  useEffect(() => {
    const fetchMyProjects = async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const axios = getAuthenticatedAxios();
        const response = await axios.get('/api/admin/projects', {
          params: {
            limit: 100
          }
        });

        const projects = response.data.projects || [];
        const currentUserId = Number(profile.id);

        // Filter projects to only show those belonging to current user
        const userProjects = projects.filter(
          project => Number(project.user_id) === currentUserId
        );

        setProjects(userProjects);
        setError('');
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load your projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyProjects();
  }, [profile?.id, getAuthenticatedAxios]);

  // Handle edit button click
  const handleEdit = (project) => {
    setEditingId(project.id);
    setEditData({
      title: project.title,
      description: project.description,
      problem_statement: project.problem_statement || '',
      category: project.category,
      institution: project.institution,
      funding_needed: project.funding_needed
    });
  };

  // Handle edit cancel
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Handle edit field change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit submission
  const handleEditSubmit = async (projectId) => {
    if (!editData.title || !editData.description || !editData.problem_statement || !editData.category || !editData.institution) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const axios = getAuthenticatedAxios();

      const response = await axios.put(`/api/admin/projects/${projectId}`, {
        title: editData.title,
        description: editData.description,
        problem_statement: editData.problem_statement,
        category: editData.category,
        institution: editData.institution,
        funding_needed: editData.funding_needed
      });

      // Update local state with the response data
      setProjects(prevProjects =>
        prevProjects.map(proj =>
          proj.id === projectId
            ? { ...proj, ...response.data.project }
            : proj
        )
      );

      setEditingId(null);
      setEditData({});
      setError('');

      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successMsg.textContent = 'Project updated successfully!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.response?.data?.error || 'Failed to update project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle project resubmission after rejection
  const handleResubmit = async (projectId) => {
    if (!window.confirm('Are you sure you want to resubmit this project for review? Make sure you have addressed the rejection reason.')) {
      return;
    }

    try {
      setResubmitting(projectId);
      const axios = getAuthenticatedAxios();

      const response = await axios.put(`/api/admin/projects/${projectId}/resubmit`);

      // Update local state
      setProjects(prevProjects =>
        prevProjects.map(proj =>
          proj.id === projectId
            ? { ...proj, approval_status: 'pending', rejection_reason: null }
            : proj
        )
      );

      setError('');
      alert(response.data.message || 'Project resubmitted successfully!');
    } catch (err) {
      console.error('Error resubmitting project:', err);
      setError(err.response?.data?.error || 'Failed to resubmit project. Please try again.');
    } finally {
      setResubmitting(null);
    }
  };

  // Get approval status color
  const getApprovalStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get project status color
  const getProjectStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'on_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!profile?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Please log in to view your projects</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-teal-700 mb-2">
              My Projects
            </h1>
            <p className="text-slate-600">
              View and manage all your submitted projects
            </p>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-md font-semibold transition-colors"
          >
            Add New Project
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <p className="mt-4 text-slate-600">Loading your projects...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-md text-center">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">
              No projects yet
            </h2>
            <p className="text-slate-600 mb-6">
              You haven't submitted any projects. Start by creating your first innovation project.
            </p>
            <button
              onClick={() => navigate('/projects')}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-md font-semibold transition-colors inline-block"
            >
              Create First Project
            </button>
          </div>
        )}

        {/* Projects List */}
        {!loading && projects.length > 0 && (
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {editingId === project.id ? (
                  // Edit Form
                  <div className="p-8 bg-white">
                    <h3 className="text-2xl font-bold mb-6 text-teal-700">
                      Edit Project
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block font-semibold mb-2">Project Title *</label>
                        <input
                          type="text"
                          name="title"
                          value={editData.title || ''}
                          onChange={handleEditChange}
                          className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-teal-500 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-2">Institution / Organization *</label>
                        <input
                          type="text"
                          name="institution"
                          value={editData.institution || ''}
                          onChange={handleEditChange}
                          className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-teal-500 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-2">Category / Field *</label>
                        <select
                          name="category"
                          value={editData.category || ''}
                          onChange={handleEditChange}
                          className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-teal-500 outline-none"
                          required
                        >
                          <option value="">Select Category</option>
                          <option>Agriculture & Food Security</option>
                          <option>Health & Biotechnology</option>
                          <option>Energy & Environment</option>
                          <option>Artificial Intelligence & Data Science</option>
                          <option>Information & Communication Technology (ICT)</option>
                          <option>Education & E-Learning Technologies</option>
                          <option>Manufacturing & Industrial Innovation</option>
                          <option>Transport & Infrastructure</option>
                          <option>Water, Sanitation & Hygiene (WASH)</option>
                          <option>FinTech (Financial Technology)</option>
                          <option>Business & Entrepreneurship Innovation</option>
                          <option>Tourism, Hospitality & Creative Industries</option>
                          <option>Social Innovation & Community Development</option>
                          <option>Security, Safety & Cybersecurity</option>
                          <option>Smart Cities & Housing</option>
                          <option>Climate Change & Sustainability</option>
                          <option>Policy, Governance & Public Service Innovation</option>
                          <option>Space Science, Aviation & Defense</option>
                          <option>Other (Specify)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-2">Description *</label>
                        <textarea
                          name="description"
                          value={editData.description || ''}
                          onChange={handleEditChange}
                          className="w-full border border-slate-300 rounded-md p-3 h-24 focus:ring-2 focus:ring-teal-500 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-2">Problem Being Solved *</label>
                        <textarea
                          name="problem_statement"
                          value={editData.problem_statement || ''}
                          onChange={handleEditChange}
                          className="w-full border border-slate-300 rounded-md p-3 h-20 focus:ring-2 focus:ring-teal-500 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-2">Funding Needed (TZS)</label>
                        <input
                          type="number"
                          name="funding_needed"
                          value={editData.funding_needed || ''}
                          onChange={handleEditChange}
                          className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-md font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditSubmit(project.id)}
                        disabled={submitting}
                        className={`${submitting ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'} text-white px-6 py-2 rounded-md font-semibold transition-colors`}
                      >
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Project Card Display
                  <>
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-teal-700 mb-2">
                            {project.title}
                          </h3>
                          <p className="text-slate-600 mb-3">
                            {project.description}
                          </p>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getApprovalStatusColor(project.approval_status)}`}>
                          {project.approval_status === 'pending' && 'Pending Review'}
                          {project.approval_status === 'approved' && 'Approved'}
                          {project.approval_status === 'rejected' && 'Rejected'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getProjectStatusColor(project.project_status)}`}>
                          {project.project_status === 'submitted' && 'Submitted'}
                          {project.project_status === 'on_progress' && 'In Progress'}
                          {project.project_status === 'completed' && 'Completed'}
                        </span>
                      </div>

                      {/* Project Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
                        <div>
                          <p className="text-sm text-slate-600 font-semibold">Institution</p>
                          <p className="text-slate-800">{project.institution}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 font-semibold">Category</p>
                          <p className="text-slate-800">{project.category}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 font-semibold">Funding Needed</p>
                          <p className="text-slate-800 font-semibold">
                            {project.funding_needed ? project.funding_needed.toLocaleString() : '0'} TZS
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 font-semibold">Submitted</p>
                          <p className="text-slate-800">
                            {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Admin Comments (if rejected) */}
                      {project.approval_status === 'rejected' && project.rejection_reason && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700 font-semibold mb-2">Rejection Reason:</p>
                          <p className="text-red-600">{project.rejection_reason}</p>
                        </div>
                      )}

                      {/* Admin Comments (if approved) */}
                      {project.approval_status === 'approved' && project.approval_comments && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-700 font-semibold mb-2">Admin Comments:</p>
                          <p className="text-green-600">{project.approval_comments}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {(project.approval_status === 'pending' || project.approval_status === 'rejected') && (
                      <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        {project.approval_status === 'pending' && (
                          <button
                            onClick={() => handleEdit(project)}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-md font-semibold transition-colors"
                          >
                            Edit Project
                          </button>
                        )}
                        {project.approval_status === 'rejected' && (
                          <>
                            <button
                              onClick={() => handleEdit(project)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold transition-colors"
                            >
                              Edit & Fix Issues
                            </button>
                            <button
                              onClick={() => handleResubmit(project.id)}
                              disabled={resubmitting === project.id}
                              className={`${resubmitting === project.id ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white px-6 py-2 rounded-md font-semibold transition-colors`}
                            >
                              {resubmitting === project.id ? 'Resubmitting...' : 'Resubmit for Review'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProjects;
