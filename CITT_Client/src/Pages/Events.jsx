// src/Pages/Events.jsx
import { useEffect, useState, useContext } from "react";
import { AuthContext } from '../context/AuthContext';

const Events = () => {
  const { user, profile, role, getAuthenticatedAxios } = useContext(AuthContext);

  // Check if user has admin access
  const isAdmin = role === "admin" || role === "superAdmin";
  const [activeTab, setActiveTab] = useState("overview");

  // Events & submissions state
  const [events, setEvents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Track expanded submission for detail view
  const [expandedSubmission, setExpandedSubmission] = useState(null);

  // Event form
  const [eventForm, setEventForm] = useState({
    title: "",
    type: "hackathon",
    description: "",
    start_date: "",
    end_date: "",
    submission_deadline: "",
    location: "",
    capacity: "",
    requirements: "",
    prize: "",
    tags: "",
    published: false,
    banner_image: "",
  });

  // Submission form
  const [submissionForm, setSubmissionForm] = useState({
    eventId: "",
    title: "",
    team_name: "",
    members: "",
    description: "",
    problem_statement: "",
    solution: "",
    pitch_url: "",
  });

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
    if (user || profile) {
      fetchMySubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  // Fetch events
  async function fetchEvents() {
    setLoading(true);
    setError("");
    try {
      const api = getAuthenticatedAxios();
      const endpoint = (user || profile) ? '/api/events?limit=500' : '/api/events/public';
      console.log('Fetching events from:', endpoint);
      const response = await api.get(endpoint);
      console.log('Events response:', response.data);
      setEvents(response.data.events || []);
    } catch (e) {
      console.error("fetchEvents error:", e);
      console.error("Error response:", e.response?.data);
      setError(e.response?.data?.error || e.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  // Fetch my submissions (or all submissions for admin)
  async function fetchMySubmissions() {
    try {
      const api = getAuthenticatedAxios();
      // Admin fetches all submissions, others fetch only their own
      const endpoint = isAdmin ? '/api/events/submissions/all' : '/api/events/submissions/my';
      const response = await api.get(endpoint);
      setSubmissions(response.data.submissions || []);
    } catch (e) {
      console.error("fetchMySubmissions:", e);
    }
  }

  // Create event (admin only)
  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!isAdmin) {
      setError("Only admins can create events.");
      return;
    }

    // Basic validation
    if (!eventForm.title || !eventForm.type) {
      setError("Title and type are required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const api = getAuthenticatedAxios();
      await api.post('/api/events', eventForm);

      setSuccess("Event created successfully!");
      setEventForm({
        title: "",
        type: "hackathon",
        description: "",
        start_date: "",
        end_date: "",
        submission_deadline: "",
        location: "",
        capacity: "",
        requirements: "",
        prize: "",
        tags: "",
        published: false,
        banner_image: "",
      });

      fetchEvents();
    } catch (err) {
      console.error("handleCreateEvent:", err);
      setError(err.response?.data?.error || "Failed to create event.");
    } finally {
      setLoading(false);
    }
  }

  // Update event
  async function handleUpdateEvent(eventId, updates) {
    if (!isAdmin) {
      setError("Only admins can update events.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/events/${eventId}`, updates);
      setSuccess("Event updated successfully!");
      fetchEvents();
    } catch (err) {
      console.error("handleUpdateEvent:", err);
      setError(err.response?.data?.error || "Failed to update event.");
    }
  }

  // Delete event
  async function handleDeleteEvent(eventId) {
    if (!isAdmin) {
      setError("Only admins can delete events.");
      return;
    }

    if (!window.confirm("Delete this event? This cannot be undone.")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const api = getAuthenticatedAxios();
      await api.delete(`/api/events/${eventId}`);
      setSuccess("Event deleted successfully!");
      fetchEvents();
    } catch (err) {
      console.error("handleDeleteEvent:", err);
      setError(err.response?.data?.error || "Failed to delete event.");
    }
  }

  // Toggle publish status
  async function handleTogglePublish(eventId, currentStatus) {
    if (!isAdmin) {
      setError("Only admins can publish/unpublish events.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/events/${eventId}/publish`, { published: !currentStatus });
      setSuccess(`Event ${!currentStatus ? 'published' : 'unpublished'} successfully!`);
      fetchEvents();
    } catch (err) {
      console.error("handleTogglePublish:", err);
      setError(err.response?.data?.error || "Failed to update event status.");
    }
  }

  // Submit entry
  async function handleSubmitEntry(e) {
    e.preventDefault();

    if (!user && !profile) {
      setError("Please log in to submit an entry.");
      return;
    }

    if (!submissionForm.eventId || !submissionForm.title || !submissionForm.description) {
      setError("Event, title, and description are required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const api = getAuthenticatedAxios();
      await api.post(`/api/events/${submissionForm.eventId}/submit`, submissionForm);

      setSuccess("Submission successful!");
      setSubmissionForm({
        eventId: "",
        title: "",
        team_name: "",
        members: "",
        description: "",
        problem_statement: "",
        solution: "",
        pitch_url: "",
      });

      fetchMySubmissions();
      setActiveTab("submissions");
    } catch (err) {
      console.error("handleSubmitEntry:", err);
      setError(err.response?.data?.error || "Failed to submit entry.");
    } finally {
      setLoading(false);
    }
  }

  // Dismiss alerts
  const dismissAlert = () => {
    setError("");
    setSuccess("");
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading indicator on initial load
  if (loading && events.length === 0 && !error) {
    return (
      <main className="flex-1 px-16 py-10 overflow-auto bg-gray-50 text-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-slate-600 text-lg">Loading events...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-16 py-10 overflow-auto bg-gray-50 text-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-800">Events & Exhibitions</h1>
          <p className="text-slate-600">
            {isAdmin
              ? "Create, announce and manage innovation events — hackathons, workshops, challenges and exhibitions."
              : "Explore upcoming events and submit your innovative ideas."}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex justify-between items-start">
              <p className="text-red-700">{error}</p>
              <button onClick={dismissAlert} className="text-red-500 hover:text-red-700">&times;</button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex justify-between items-start">
              <p className="text-green-700">{success}</p>
              <button onClick={dismissAlert} className="text-green-500 hover:text-green-700">&times;</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-semibold whitespace-nowrap ${
              activeTab === "overview"
                ? "text-teal-600 border-b-2 border-teal-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Overview
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab("manage")}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeTab === "manage"
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Manage Events
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeTab === "history"
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Entry History
            </button>
          )}

          {!isAdmin && (
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeTab === "upcoming"
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Upcoming Events
            </button>
          )}

          {!isAdmin && (
            <button
              onClick={() => setActiveTab("submit")}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeTab === "submit"
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Submit Entry
            </button>
          )}

          {!isAdmin && (
            <button
              onClick={() => setActiveTab("submissions")}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeTab === "submissions"
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              My Submissions
            </button>
          )}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Admin Cards */}
            {isAdmin && (
              <>
                <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-teal-600">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="font-bold text-slate-800 text-lg">Manage Events</h3>
                  </div>
                  <p className="text-slate-600 mt-2">
                    Create and publish events, set deadlines and requirements.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => setActiveTab("manage")}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
                    >
                      Manage Events
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-600">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="font-bold text-slate-800 text-lg">Entry History</h3>
                  </div>
                  <p className="text-slate-600 mt-2">
                    View all event submissions from innovators.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => setActiveTab("history")}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      View Submissions
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Innovator Cards */}
            {!isAdmin && (
              <>
                <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-teal-600">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="font-bold text-slate-800 text-lg">Upcoming Events</h3>
                  </div>
                  <p className="text-slate-600 mt-2">
                    Browse upcoming events and competitions.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => setActiveTab("upcoming")}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
                    >
                      View Events
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-600">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-bold text-slate-800 text-lg">Submit Entry</h3>
                  </div>
                  <p className="text-slate-600 mt-2">
                    Submit your innovative ideas and compete for prizes.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => setActiveTab("submit")}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Submit Entry
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2 bg-white rounded-xl p-6 shadow-md border-l-4 border-green-600">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="font-bold text-slate-800 text-lg">My Submissions</h3>
                  </div>
                  <p className="text-slate-600 mt-2">
                    View your submissions and track their status.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => setActiveTab("submissions")}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      My Submissions
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Manage Events Tab (Admin Only) */}
        {activeTab === "manage" && isAdmin && (
          <div>
            {/* Create Event Form */}
            <div className="bg-white rounded-xl p-6 shadow-md mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Create New Event</h2>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Event Title *</label>
                    <input
                      type="text"
                      placeholder="e.g., Innovation Hackathon 2025"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Event Type *</label>
                    <select
                      value={eventForm.type}
                      onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="hackathon">Hackathon</option>
                      <option value="workshop">Workshop</option>
                      <option value="challenge">Challenge</option>
                      <option value="exhibition">Exhibition</option>
                      <option value="seminar">Seminar</option>
                      <option value="conference">Conference</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Description</label>
                  <textarea
                    placeholder="Brief description of the event"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Start Date</label>
                    <input
                      type="date"
                      value={eventForm.start_date}
                      onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">End Date</label>
                    <input
                      type="date"
                      value={eventForm.end_date}
                      onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Submission Deadline</label>
                    <input
                      type="date"
                      value={eventForm.submission_deadline}
                      onChange={(e) => setEventForm({ ...eventForm, submission_deadline: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g., CITT Innovation Hub"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Capacity</label>
                    <input
                      type="number"
                      placeholder="e.g., 100"
                      value={eventForm.capacity}
                      onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Prize</label>
                    <input
                      type="text"
                      placeholder="e.g., TZS 5,000,000"
                      value={eventForm.prize}
                      onChange={(e) => setEventForm({ ...eventForm, prize: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Requirements</label>
                  <textarea
                    placeholder="Entry requirements (one per line)"
                    value={eventForm.requirements}
                    onChange={(e) => setEventForm({ ...eventForm, requirements: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tags</label>
                  <input
                    type="text"
                    placeholder="e.g., hackathon, innovation, technology (comma separated)"
                    value={eventForm.tags}
                    onChange={(e) => setEventForm({ ...eventForm, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={eventForm.published}
                    onChange={(e) => setEventForm({ ...eventForm, published: e.target.checked })}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                  />
                  <label htmlFor="published" className="text-slate-700">
                    Publish event immediately
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 disabled:bg-slate-400"
                  >
                    {loading ? "Creating..." : "Create Event"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEventForm({
                        title: "",
                        type: "hackathon",
                        description: "",
                        start_date: "",
                        end_date: "",
                        submission_deadline: "",
                        location: "",
                        capacity: "",
                        requirements: "",
                        prize: "",
                        tags: "",
                        published: false,
                        banner_image: "",
                      })
                    }
                    className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            {/* List of All Events */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 mb-2">All Events</h3>

              {loading && <p className="text-slate-600">Loading events...</p>}

              {!loading && events.length === 0 && (
                <div className="bg-white rounded-xl p-8 shadow-md text-center">
                  <p className="text-slate-600">No events created yet. Create your first event above.</p>
                </div>
              )}

              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white p-6 rounded-xl shadow-md border-l-4 border-teal-600"
                >
                  <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-slate-100 px-3 py-1 rounded-full text-sm text-slate-800 font-medium">
                          {ev.type}
                        </span>
                        {ev.published ? (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            Published
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                            Draft
                          </span>
                        )}
                      </div>

                      <h4 className="text-xl font-bold text-slate-800 mb-2">{ev.title}</h4>
                      <p className="text-slate-600 mb-2">{ev.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-500">
                        <p><strong>Start:</strong> {formatDate(ev.start_date)}</p>
                        <p><strong>End:</strong> {formatDate(ev.end_date)}</p>
                        <p><strong>Deadline:</strong> {formatDate(ev.submission_deadline)}</p>
                        <p><strong>Location:</strong> {ev.location || "—"}</p>
                        <p><strong>Prize:</strong> {ev.prize || "—"}</p>
                        <p><strong>Submissions:</strong> {ev.submissions_count || 0}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[150px]">
                      <button
                        onClick={() => handleTogglePublish(ev.id, ev.published)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          ev.published
                            ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            : "bg-teal-600 text-white hover:bg-teal-700"
                        }`}
                      >
                        {ev.published ? "Unpublish" : "Publish"}
                      </button>

                      <button
                        onClick={() => {
                          const newTitle = prompt("Edit title:", ev.title);
                          if (newTitle && newTitle !== ev.title) {
                            handleUpdateEvent(ev.id, { title: newTitle });
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events Tab */}
        {activeTab === "upcoming" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Upcoming Events</h2>

            {loading && <p className="text-slate-600">Loading events...</p>}

            {!loading && events.filter(e => e.published).length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-md text-center">
                <p className="text-slate-600">No upcoming events at the moment.</p>
              </div>
            )}

            {events
              .filter((e) => e.published)
              .map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-xl p-6 shadow-md border-l-4 border-teal-600"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <span className="bg-slate-100 px-3 py-1 rounded-full text-sm text-slate-800 font-medium">
                        {ev.type}
                      </span>

                      <h3 className="text-2xl font-bold text-slate-800 mt-2">{ev.title}</h3>
                      <p className="text-slate-600 mt-2">{ev.description}</p>

                      <div className="mt-4 space-y-1 text-sm text-slate-600">
                        <p><strong>Start Date:</strong> {formatDate(ev.start_date)}</p>
                        <p><strong>End Date:</strong> {formatDate(ev.end_date)}</p>
                        <p><strong>Submission Deadline:</strong> {formatDate(ev.submission_deadline)}</p>
                        <p><strong>Location:</strong> {ev.location || "Online"}</p>
                        {ev.prize && <p><strong>Prize:</strong> {ev.prize}</p>}
                      </div>

                      {ev.requirements && (
                        <div className="mt-3">
                          <p className="text-slate-800 font-semibold">Requirements:</p>
                          <p className="text-sm text-slate-600 whitespace-pre-line mt-1">
                            {ev.requirements}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setActiveTab("submit");
                          setSubmissionForm((s) => ({ ...s, eventId: ev.id }));
                        }}
                        className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 font-medium"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Submit Entry Tab */}
        {activeTab === "submit" && (
          <div className="bg-white rounded-xl p-6 shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Submit Event Entry</h2>

            {!user && !profile && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-red-700">Please log in to submit an entry.</p>
              </div>
            )}

            <form onSubmit={handleSubmitEntry} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Select Event *</label>
                <select
                  value={submissionForm.eventId}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, eventId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose an event</option>
                  {events
                    .filter((e) => e.published)
                    .map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Project / Entry Title *</label>
                <input
                  type="text"
                  value={submissionForm.title}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter your project title"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Team Name</label>
                  <input
                    type="text"
                    value={submissionForm.team_name}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, team_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your team name"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Team Members</label>
                  <input
                    type="text"
                    value={submissionForm.members}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, members: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="List names, emails"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Project Description *</label>
                <textarea
                  value={submissionForm.description}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })}
                  rows="5"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Describe your project"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Problem Statement</label>
                <textarea
                  value={submissionForm.problem_statement}
                  onChange={(e) =>
                    setSubmissionForm({ ...submissionForm, problem_statement: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="What problem are you solving?"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Proposed Solution</label>
                <textarea
                  value={submissionForm.solution}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, solution: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="How does your solution work?"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Pitch Video URL (optional)</label>
                <input
                  type="url"
                  value={submissionForm.pitch_url}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, pitch_url: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="YouTube or Vimeo link"
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input type="checkbox" id="terms" required className="mt-1" />
                <label htmlFor="terms" className="text-sm text-slate-600">
                  I confirm this submission is original and I agree to the event rules and terms.
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || (!user && !profile)}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 disabled:bg-slate-400 font-medium"
                >
                  {loading ? "Submitting..." : "Submit Entry"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSubmissionForm({
                      eventId: "",
                      title: "",
                      team_name: "",
                      members: "",
                      description: "",
                      problem_statement: "",
                      solution: "",
                      pitch_url: "",
                    })
                  }
                  className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300 font-medium"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Submissions Tab */}
        {activeTab === "submissions" && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">My Submissions</h2>
            <p className="text-slate-600 mb-6">All your submitted entries across events. Click on any entry to view full details.</p>

            {!user && !profile && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                <p className="text-yellow-700">Please log in to view your submissions.</p>
              </div>
            )}

            {(user || profile) && submissions.length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-md text-center">
                <p className="text-slate-600">You haven't submitted to any events yet.</p>
                <button
                  onClick={() => setActiveTab("submit")}
                  className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
                >
                  Submit Entry
                </button>
              </div>
            )}

            {/* Summary bar */}
            {submissions.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-600">
                  <p className="text-sm text-slate-600">Total Submissions</p>
                  <p className="text-2xl font-bold text-slate-800">{submissions.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-600">
                  <p className="text-sm text-slate-600">Approved / Finalist</p>
                  <p className="text-2xl font-bold text-green-600">
                    {submissions.filter(s => s.status === "approved" || s.status === "finalist" || s.status === "winner").length}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-yellow-500">
                  <p className="text-sm text-slate-600">Pending / Reviewing</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {submissions.filter(s => s.status === "submitted" || s.status === "reviewing").length}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-red-500">
                  <p className="text-sm text-slate-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {submissions.filter(s => s.status === "rejected").length}
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {submissions.map((s) => {
                const isExpanded = expandedSubmission === s.id;
                return (
                <div key={s.id} className="bg-white rounded-xl shadow-md border-l-4 border-blue-600 overflow-hidden">
                  {/* Clickable header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedSubmission(isExpanded ? null : s.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{s.title}</h3>
                        <p className="text-slate-600">Event: <strong>{s.event_title}</strong></p>
                        <p className="text-sm text-slate-500 mt-1">
                          Team: {s.team_name || "Individual"}
                          {s.members && ` | Members: ${s.members}`}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            s.status === "winner"
                              ? "bg-yellow-100 text-yellow-800"
                              : s.status === "finalist"
                              ? "bg-green-100 text-green-800"
                              : s.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : s.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : s.status === "reviewing"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {s.status}
                        </span>
                        <p className="text-xs text-slate-500">
                          Submitted: {formatDate(s.created_at)}
                        </p>
                        <span className="text-xs text-teal-600 font-medium">
                          {isExpanded ? "Click to collapse" : "Click to view details"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable detail section */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-slate-100 pt-4 bg-slate-50">
                      {/* Description */}
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-slate-700 mb-1">Project Description</h4>
                        <p className="text-slate-700 whitespace-pre-line">{s.description || "—"}</p>
                      </div>

                      {/* Problem Statement */}
                      {s.problem_statement && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-slate-700 mb-1">Problem Statement</h4>
                          <p className="text-slate-600 whitespace-pre-line">{s.problem_statement}</p>
                        </div>
                      )}

                      {/* Proposed Solution */}
                      {s.solution && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-slate-700 mb-1">Proposed Solution</h4>
                          <p className="text-slate-600 whitespace-pre-line">{s.solution}</p>
                        </div>
                      )}

                      {/* Team details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Team Name</p>
                          <p className="text-slate-800 font-medium">{s.team_name || "Individual"}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Team Members</p>
                          <p className="text-slate-800 font-medium">{s.members || "—"}</p>
                        </div>
                      </div>

                      {/* Event info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Event</p>
                          <p className="text-slate-800 font-medium">{s.event_title || "—"}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Event Start Date</p>
                          <p className="text-slate-800 font-medium">{formatDate(s.start_date)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Submission Date</p>
                          <p className="text-slate-800 font-medium">{formatDate(s.created_at)}</p>
                        </div>
                      </div>

                      {/* Pitch URL */}
                      {s.pitch_url && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-slate-700 mb-1">Pitch Video</h4>
                          <a
                            href={s.pitch_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-600 hover:underline font-medium"
                          >
                            {s.pitch_url}
                          </a>
                        </div>
                      )}

                      {/* Submission ID */}
                      <div className="pt-3 border-t border-slate-200">
                        <span className="text-xs text-slate-400">Submission ID: {s.id}</span>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Entry History Tab - Admin Only */}
        {activeTab === "history" && isAdmin && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Entry History</h2>
            <p className="text-slate-600 mb-6">View all event submissions from innovators</p>

            {/* Fetch and display all submissions */}
            {(() => {
              // This will show all submissions - you'll need to fetch them from the API
              return (
                <>
                  {submissions.length === 0 && (
                    <div className="bg-white rounded-xl p-8 shadow-md text-center">
                      <p className="text-slate-600">No event submissions found.</p>
                      <p className="text-sm text-slate-500 mt-2">Submissions from innovators will appear here.</p>
                    </div>
                  )}

                  <div className="grid gap-4">
                    {submissions.map((s) => (
                      <div key={s.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-teal-600">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-800">{s.title}</h3>
                            <p className="text-slate-600 mt-1">Event: <strong>{s.event_title}</strong></p>
                            <p className="text-sm text-slate-500 mt-1">
                              Team: {s.team_name || "Individual"}
                            </p>
                            {s.members && (
                              <p className="text-sm text-slate-500">
                                Members: {s.members}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                s.status === "winner"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : s.status === "finalist"
                                  ? "bg-green-100 text-green-800"
                                  : s.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {s.status}
                            </span>
                            <p className="text-xs text-slate-500 mt-2">
                              Submitted: {formatDate(s.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="font-semibold text-slate-700 text-sm">Description</p>
                          <p className="text-slate-700 mt-1">{s.description}</p>
                        </div>

                        {s.problem_statement && (
                          <div className="mb-4">
                            <p className="font-semibold text-slate-700 text-sm">Problem Statement</p>
                            <p className="text-slate-600 text-sm mt-1">{s.problem_statement}</p>
                          </div>
                        )}

                        {s.solution && (
                          <div className="mb-4">
                            <p className="font-semibold text-slate-700 text-sm">Solution</p>
                            <p className="text-slate-600 text-sm mt-1">{s.solution}</p>
                          </div>
                        )}

                        {s.pitch_url && (
                          <div className="mb-4">
                            <a
                              href={s.pitch_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal-600 hover:underline text-sm font-medium"
                            >
                              View Pitch Video →
                            </a>
                          </div>
                        )}

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                          <span className="text-xs text-slate-500">
                            Submission ID: {s.id}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </main>
  );
};

export default Events;
