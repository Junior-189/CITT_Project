import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Projects = () => {
  const { profile, getAuthenticatedAxios } = useAuth();
  const navigate = useNavigate();
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problem: "",
    category: "",
    otherCategory: "",
    stage: "submitted",
    institution: "",
    funding: "",
    file: null,
    termsAgreed: false,
  });

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dashboard stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    in_progress: 0,
    completed: 0,
  });

  useEffect(() => {
    if (!profile?.id) return;
    fetchProjectStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const fetchProjectStats = async () => {
    try {
      if (!profile?.id) return;
      setLoading(true);
      const api = getAuthenticatedAxios();

      // Fetch user's projects (backend filters by user automatically for non-admins)
      const response = await api.get('/api/admin/projects', {
        params: { limit: 1000 } // Get all to count
      });

      const projects = response.data.projects || [];
      const currentUserId = Number(profile.id);
      const userProjects = projects.filter(p => Number(p.user_id) === currentUserId);

      setStats({
        total: userProjects.length,
        pending: userProjects.filter(p => p.approval_status === 'pending').length,
        approved: userProjects.filter(p => p.approval_status === 'approved').length,
        rejected: userProjects.filter(p => p.approval_status === 'rejected').length,
        in_progress: userProjects.filter(p => p.project_status === 'on_progress').length,
        completed: userProjects.filter(p => p.project_status === 'completed').length,
      });
    } catch (err) {
      console.error('Error fetching project stats:', err);
      setError('Failed to load project statistics. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.termsAgreed) {
      setError("Please agree to the terms and conditions before submitting.");
      return;
    }

    if (!profile) {
      setError("You must be logged in to submit a project.");
      return;
    }

    try {
      setSubmitting(true);
      const api = getAuthenticatedAxios();

      const payload = {
        title: formData.title,
        description: formData.description,
        problem_statement: formData.problem,
        category: formData.category === "Other (Specify)" ? formData.otherCategory : formData.category,
        institution: formData.institution,
        funding_needed: parseInt(formData.funding) || 0,
        project_status: formData.stage,
      };

      await api.post('/api/admin/projects', payload);

      setSuccess(`Project "${formData.title}" submitted successfully! Awaiting admin approval.`);
      setFormData({
        title: "",
        description: "",
        problem: "",
        category: "",
        otherCategory: "",
        stage: "submitted",
        institution: "",
        funding: "",
        file: null,
        termsAgreed: false,
      });
      setShowForm(false);
      setError(null);
      
      // Refresh stats
      fetchProjectStats();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to submit project";
      setError(errorMsg);
      console.error("Error submitting project:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 px-8 md:px-16 py-10 overflow-auto bg-gray-50 text-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-slate-800">
          Innovation & Research Projects
        </h1>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-teal-600 hover:bg-teal-700 transition-colors text-white font-semibold px-6 py-3 rounded-lg"
          >
            {showForm ? "Close Form" : "Register New Project"}
          </button>
          <button
            onClick={() => navigate('/my-projects')}
            className="bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold px-6 py-3 rounded-lg"
          >
            My Projects
          </button>
        </div>

        {/* Dashboard Section */}
        <section className="mb-10">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 shadow-lg mb-6 text-white text-center">
            <h2 className="text-4xl font-bold mb-2">{stats.total}</h2>
            <p className="text-lg font-medium">Total Projects Submitted</p>
            <p className="text-sm opacity-90 mt-1">Track your innovation journey</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-yellow-500 text-center hover:shadow-lg transition">
              <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.pending}</h3>
              <p className="text-slate-600 font-medium text-sm">Pending Review</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-green-600 text-center hover:shadow-lg transition">
              <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.approved}</h3>
              <p className="text-slate-600 font-medium text-sm">Approved</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-red-500 text-center hover:shadow-lg transition">
              <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.rejected}</h3>
              <p className="text-slate-600 font-medium text-sm">Rejected</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-blue-600 text-center hover:shadow-lg transition">
              <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.in_progress}</h3>
              <p className="text-slate-600 font-medium text-sm">In Progress</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-purple-600 text-center hover:shadow-lg transition">
              <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.completed}</h3>
              <p className="text-slate-600 font-medium text-sm">Completed</p>
            </div>
          </div>
        </section>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 mt-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Registration Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-8 shadow-md mb-10"
          >
            <h2 className="text-2xl font-bold mb-6 text-teal-700">
              Project Registration Form
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-1">Project Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Institution / Organization *</label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category / Field *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-teal-500 outline-none"
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

                {formData.category === "Other (Specify)" && (
                  <input
                    type="text"
                    name="otherCategory"
                    value={formData.otherCategory}
                    onChange={handleChange}
                    placeholder="Please specify your category"
                    className="w-full border border-slate-300 rounded-md p-2 mt-3 focus:ring-2 focus:ring-teal-500 outline-none"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1">Stage of Development *</label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="submitted">Idea Stage</option>
                  <option value="on_progress">Concept Development</option>
                  <option value="on_progress">Minimum Functional Prototype (MFP)</option>
                  <option value="completed">Minimum Viable Product (MVP)</option>
                  <option value="completed">Market Fit Product (Validated Product)</option>
                  <option value="completed">Pilot / Testing / Early Deployment</option>
                  <option value="completed">Market-Ready / Commercialization Stage</option>
                  <option value="completed">Spin-off / Startup Stage</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Innovation Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-md p-2 h-24 focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Problem Being Solved *</label>
                <textarea
                  name="problem"
                  value={formData.problem}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-md p-2 h-20 focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Estimated Funding Needed (TZS) *</label>
                <input
                  type="number"
                  name="funding"
                  value={formData.funding}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Upload Supporting Files (Optional)</label>
                <input
                  type="file"
                  name="file"
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-md p-2"
                />
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="mt-6">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="termsAgreed"
                  checked={formData.termsAgreed}
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
                <span className="text-slate-600 text-sm">
                  I agree that all <strong>Project information, Problem statement, Funding details, and other details</strong> provided are accurate and truthful.
                </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`${submitting ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'} text-white font-semibold px-6 py-2 rounded-md transition-colors`}
              >
                {submitting ? 'Submitting...' : 'Submit Project'}
              </button>
            </div>
          </form>
        )}

        {/* Info Box */}
        <div className="mt-10 bg-teal-50 border-l-4 border-teal-600 p-4 rounded">
          <p className="text-sm text-teal-700">
            <strong>How it works:</strong> Submit your project using the form above. Your submission will be reviewed by our admin team and displayed in your "My Projects" page. After approval, your project will be visible to all users.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Projects;
