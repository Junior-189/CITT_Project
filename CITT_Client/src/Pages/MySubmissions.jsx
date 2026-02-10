import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const MySubmissions = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events/submissions/my');
      setSubmissions(response.data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load your submissions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800',
      reviewing: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      submitted: '📤',
      reviewing: '👀',
      approved: '✅',
      rejected: '❌'
    };
    return icons[status] || '📌';
  };

  const filteredSubmissions = filterStatus === 'all' 
    ? submissions 
    : submissions.filter(sub => sub.status === filterStatus);

  if (loading) {
    return (
      <main className="flex-1 px-16 py-10 overflow-auto bg-white">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your submissions...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-16 py-10 overflow-auto bg-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">My Event Submissions</h1>
        <p className="text-slate-600">Track your event submissions and their approval status</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg mb-6">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            filterStatus === 'all'
              ? 'bg-teal-600 text-white'
              : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
          }`}
        >
          All ({submissions.length})
        </button>
        <button
          onClick={() => setFilterStatus('submitted')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            filterStatus === 'submitted'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
          }`}
        >
          📤 Submitted ({submissions.filter(s => s.status === 'submitted').length})
        </button>
        <button
          onClick={() => setFilterStatus('reviewing')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            filterStatus === 'reviewing'
              ? 'bg-yellow-600 text-white'
              : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
          }`}
        >
          👀 Reviewing ({submissions.filter(s => s.status === 'reviewing').length})
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            filterStatus === 'approved'
              ? 'bg-green-600 text-white'
              : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
          }`}
        >
          ✅ Approved ({submissions.filter(s => s.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilterStatus('rejected')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            filterStatus === 'rejected'
              ? 'bg-red-600 text-white'
              : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
          }`}
        >
          ❌ Rejected ({submissions.filter(s => s.status === 'rejected').length})
        </button>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-12 text-center border-2 border-dashed border-slate-300">
            <p className="text-slate-600 text-lg mb-4">No submissions found</p>
            <button
              onClick={() => navigate('/events')}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition"
            >
              Browse Events
            </button>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-xl font-bold text-slate-800">{submission.title}</h3>
                    <span className={`px-4 py-1 rounded-full font-semibold text-sm ${getStatusColor(submission.status)}`}>
                      {getStatusIcon(submission.status)} {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-slate-600 mb-2">
                    <strong>Event:</strong> {submission.event_title || 'Event details unavailable'}
                  </p>
                  <p className="text-slate-600">
                    <strong>Team:</strong> {submission.team_name || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Submission Details Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-slate-200">
                <div>
                  <p className="text-sm text-slate-600">Team Members</p>
                  <p className="font-semibold text-slate-800">{submission.members || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Submitted On</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Last Updated</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(submission.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Expandable Details */}
              {expandedId === submission.id && (
                <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Problem Statement</h4>
                    <p className="text-slate-600 bg-slate-50 p-4 rounded-lg">
                      {submission.problem_statement || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Solution Proposal</h4>
                    <p className="text-slate-600 bg-slate-50 p-4 rounded-lg">
                      {submission.solution || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Description</h4>
                    <p className="text-slate-600 bg-slate-50 p-4 rounded-lg">
                      {submission.description || 'Not provided'}
                    </p>
                  </div>
                  {submission.pitch_url && (
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Pitch URL</h4>
                      <a
                        href={submission.pitch_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:text-teal-700 font-semibold underline"
                      >
                        {submission.pitch_url}
                      </a>
                    </div>
                  )}

                  {/* Feedback Section */}
                  {submission.feedback && submission.feedback.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">💬 Admin Feedback</h4>
                      <div className="space-y-3">
                        {submission.feedback.map((fb, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border-l-4 border-blue-600">
                            <p className="text-slate-600">{fb.feedback}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              {new Date(fb.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {submission.status === 'rejected' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-orange-800">You can re-submit your application to this event if needed.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Expand/Collapse Button */}
              <button
                onClick={() => setExpandedId(expandedId === submission.id ? null : submission.id)}
                className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition"
              >
                {expandedId === submission.id ? 'Hide Details ▲' : 'View Details ▼'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Stats Section */}
      {submissions.length > 0 && (
        <div className="mt-12 grid grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <p className="text-blue-600 font-semibold text-sm">Total Submissions</p>
            <p className="text-3xl font-bold text-blue-800">{submissions.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <p className="text-yellow-600 font-semibold text-sm">Under Review</p>
            <p className="text-3xl font-bold text-yellow-800">
              {submissions.filter(s => s.status === 'reviewing').length}
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <p className="text-green-600 font-semibold text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-800">
              {submissions.filter(s => s.status === 'approved').length}
            </p>
          </div>
          <div className="bg-red-50 rounded-xl p-6 border border-red-200">
            <p className="text-red-600 font-semibold text-sm">Rejected</p>
            <p className="text-3xl font-bold text-red-800">
              {submissions.filter(s => s.status === 'rejected').length}
            </p>
          </div>
        </div>
      )}
    </main>
  );
};

export default MySubmissions;
