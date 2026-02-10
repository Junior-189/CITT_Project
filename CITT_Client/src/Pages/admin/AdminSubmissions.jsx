import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      // Get all events first
      const eventsRes = await api.get('/events/public');
      const events = eventsRes.data;

      // Fetch submissions for each event
      const allSubmissions = [];
      for (const event of events) {
        try {
          const subRes = await api.get(`/events/${event.id}/submissions`);
          allSubmissions.push(...subRes.data.map(sub => ({
            ...sub,
            event_title: event.title
          })));
        } catch (err) {
          // Skip if error fetching submissions for this event
          console.error(`Error fetching submissions for event ${event.id}:`, err);
        }
      }

      setSubmissions(allSubmissions);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (submissionId, newStatus) => {
    try {
      await api.put(`/events/submissions/${submissionId}/status`, {
        status: newStatus
      });
      setStatusUpdate('');
      
      // Update local state
      setSubmissions(submissions.map(sub =>
        sub.id === submissionId ? { ...sub, status: newStatus } : sub
      ));

      // Reset selected submission
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission({ ...selectedSubmission, status: newStatus });
      }

      alert('Submission status updated successfully');
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update submission status');
    }
  };

  const handleAddFeedback = async (submissionId) => {
    if (!feedbackText.trim()) {
      alert('Please enter feedback');
      return;
    }

    try {
      setSubmittingFeedback(true);
      await api.post(`/events/submissions/${submissionId}/feedback`, {
        feedback: feedbackText
      });

      setFeedbackText('');
      
      // Refresh data
      await fetchSubmissions();
      
      alert('Feedback added successfully');
    } catch (err) {
      console.error('Error adding feedback:', err);
      setError('Failed to add feedback');
    } finally {
      setSubmittingFeedback(false);
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
            <p className="text-slate-600">Loading submissions...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-16 py-10 overflow-auto bg-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">Event Submissions Management</h1>
        <p className="text-slate-600">Review and approve/reject user event submissions</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg mb-6">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
        {['all', 'submitted', 'reviewing', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
              filterStatus === status
                ? 'bg-teal-600 text-white'
                : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
            }`}
          >
            {status === 'all' ? '📋 All' : getStatusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1)} ({filteredSubmissions.filter(s => status === 'all' || s.status === status).length})
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-3 gap-8">
        {/* Submissions List */}
        <div className="col-span-2">
          <div className="space-y-4">
            {filteredSubmissions.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-12 text-center border-2 border-dashed border-slate-300">
                <p className="text-slate-600 text-lg">No submissions to review</p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => setSelectedSubmission(submission)}
                  className={`bg-white border-2 rounded-xl p-6 cursor-pointer transition ${
                    selectedSubmission?.id === submission.id
                      ? 'border-teal-600 shadow-lg bg-teal-50'
                      : 'border-slate-200 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800">{submission.title}</h3>
                      <p className="text-slate-600 text-sm mb-2">
                        Event: <strong>{submission.event_title || 'Unknown Event'}</strong>
                      </p>
                      <p className="text-slate-600 text-sm">
                        Team: <strong>{submission.team_name || 'Not specified'}</strong>
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${getStatusColor(submission.status)}`}>
                      {getStatusIcon(submission.status)} {submission.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Submitted By</p>
                      <p>User #{submission.user_id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Submitted On</p>
                      <p>{new Date(submission.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="col-span-1">
          {selectedSubmission ? (
            <div className="bg-white border-2 border-teal-600 rounded-xl p-6 sticky top-10 max-h-[85vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                {getStatusIcon(selectedSubmission.status)} {selectedSubmission.title}
              </h2>

              {/* Submission Info */}
              <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase">Event</p>
                  <p className="text-slate-800">{selectedSubmission.event_title || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase">Team Name</p>
                  <p className="text-slate-800">{selectedSubmission.team_name || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase">Team Members</p>
                  <p className="text-slate-800">{selectedSubmission.members || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase">Submitted</p>
                  <p className="text-slate-800">
                    {new Date(selectedSubmission.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6 pb-6 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-700 uppercase mb-2">Description</p>
                <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg">
                  {selectedSubmission.description || 'No description provided'}
                </p>
              </div>

              {/* Problem Statement */}
              <div className="mb-6 pb-6 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-700 uppercase mb-2">Problem Statement</p>
                <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg">
                  {selectedSubmission.problem_statement || 'Not provided'}
                </p>
              </div>

              {/* Solution */}
              <div className="mb-6 pb-6 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-700 uppercase mb-2">Proposed Solution</p>
                <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg">
                  {selectedSubmission.solution || 'Not provided'}
                </p>
              </div>

              {/* Pitch URL */}
              {selectedSubmission.pitch_url && (
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 uppercase mb-2">Pitch URL</p>
                  <a
                    href={selectedSubmission.pitch_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-700 font-semibold text-sm break-all"
                  >
                    {selectedSubmission.pitch_url}
                  </a>
                </div>
              )}

              {/* Status Update */}
              <div className="mb-6 pb-6 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-700 uppercase mb-3">Update Status</p>
                <div className="space-y-2">
                  {['submitted', 'reviewing', 'approved', 'rejected'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedSubmission.id, status)}
                      disabled={selectedSubmission.status === status}
                      className={`w-full px-3 py-2 rounded-lg font-semibold text-sm transition ${
                        selectedSubmission.status === status
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      }`}
                    >
                      {getStatusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Feedback */}
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase mb-3">Add Feedback</p>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter feedback for the applicant..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm mb-3 resize-none h-24"
                />
                <button
                  onClick={() => handleAddFeedback(selectedSubmission.id)}
                  disabled={submittingFeedback || !feedbackText.trim()}
                  className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {submittingFeedback ? '⏳ Sending...' : '📤 Send Feedback'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 sticky top-10 text-center">
              <p className="text-slate-600">Select a submission to view details and manage</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default AdminSubmissions;
