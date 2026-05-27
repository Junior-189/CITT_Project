import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LayoutDashboard, FolderKanban, MessageSquare, CheckCircle, XCircle, ChevronDown, ChevronUp, Download } from 'lucide-react';

const STAGE_NAMES = {
  1: 'Idea Generation', 2: 'Concept Development', 3: 'Prototype Development',
  4: 'Testing & Validation', 5: 'IP & Documentation', 6: 'Funding & Investment',
  7: 'Deployment / Implementation', 8: 'Monitoring & Evaluation', 9: 'Scaling & Commercialization',
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const ProjectDetailModal = ({ projectId, onClose }) => {
  const { getAuthenticatedAxios } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [approveNotes, setApproveNotes] = useState({});
  const [rejectNotes, setRejectNotes] = useState({});
  const [processing, setProcessing] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => { fetchDetail(); }, [projectId]);

  const fetchDetail = async () => {
    try {
      const api = getAuthenticatedAxios();
      const res = await api.get(`/api/workspace/project/${projectId}/detail`);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getMilestone = (n) => data?.milestones?.find(m => m.stage_number === n);
  const getStageComments = (n) => data?.comments?.filter(c => c.stage_number === n) || [];

  const handleApprove = async (stageNum) => {
    const notes = approveNotes[stageNum]?.trim();
    if (!notes) return setMessage('Approval notes are required.');
    setProcessing(p => ({ ...p, [`approve_${stageNum}`]: true }));
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/workspace/project/${projectId}/milestone/${stageNum}/approve`, { notes });
      setMessage(`Stage ${stageNum} approved.`);
      setApproveNotes(n => ({ ...n, [stageNum]: '' }));
      await fetchDetail();
    } catch (e) { setMessage(e.response?.data?.error || 'Failed.'); }
    finally { setProcessing(p => ({ ...p, [`approve_${stageNum}`]: false })); }
  };

  const handleReject = async (stageNum) => {
    const notes = rejectNotes[stageNum]?.trim();
    if (!notes) return setMessage('Rejection reason is required.');
    setProcessing(p => ({ ...p, [`reject_${stageNum}`]: true }));
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/workspace/project/${projectId}/milestone/${stageNum}/reject`, { notes });
      setMessage(`Stage ${stageNum} sent for revision.`);
      setRejectNotes(n => ({ ...n, [stageNum]: '' }));
      await fetchDetail();
    } catch (e) { setMessage(e.response?.data?.error || 'Failed.'); }
    finally { setProcessing(p => ({ ...p, [`reject_${stageNum}`]: false })); }
  };

  const handleComment = async (stageNum) => {
    const comment = commentText[stageNum]?.trim();
    if (!comment) return;
    setProcessing(p => ({ ...p, [`comment_${stageNum}`]: true }));
    try {
      const api = getAuthenticatedAxios();
      await api.post(`/api/workspace/project/${projectId}/comment`, {
        stage_number: stageNum, comment, comment_type: 'guidance',
      });
      setCommentText(t => ({ ...t, [stageNum]: '' }));
      await fetchDetail();
    } catch (e) { setMessage(e.response?.data?.error || 'Comment failed.'); }
    finally { setProcessing(p => ({ ...p, [`comment_${stageNum}`]: false })); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{data?.project?.title || 'Loading...'}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{data?.project?.innovator_name} · {data?.project?.category}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          </div>
        ) : (
          <div className="p-6 space-y-3">
            {message && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700 mb-4">
                {message} <button onClick={() => setMessage('')} className="ml-2 text-xs underline">Dismiss</button>
              </div>
            )}

            {/* Project overview stats */}
            <div className="grid grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">
                  {data?.milestones?.filter(m => m.status === 'completed').length || 0}
                </p>
                <p className="text-xs text-gray-400">Completed Stages</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">
                  {data?.milestones?.filter(m => m.status === 'submitted').length || 0}
                </p>
                <p className="text-xs text-gray-400">Pending Review</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-600">
                  {data?.milestones?.filter(m => m.status === 'in_progress').length || 0}
                </p>
                <p className="text-xs text-gray-400">In Progress</p>
              </div>
            </div>

            {Array.from({ length: 9 }, (_, i) => i + 1).map(stageNum => {
              const milestone = getMilestone(stageNum);
              const status = milestone?.status || 'pending';
              const stageComments = getStageComments(stageNum);
              const isExpanded = expandedStage === stageNum;
              const isSubmitted = status === 'submitted';

              return (
                <div key={stageNum} className={`border rounded-xl overflow-hidden ${isSubmitted ? 'border-purple-300 shadow-sm' : 'border-gray-200'}`}>
                  <button
                    onClick={() => setExpandedStage(isExpanded ? null : stageNum)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                        {stageNum}
                      </span>
                      <span className="font-semibold text-sm text-slate-800">{STAGE_NAMES[stageNum]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
                        {status}
                      </span>
                      {stageComments.length > 0 && (
                        <span className="text-xs text-gray-400">{stageComments.length} notes</span>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                      {milestone?.submission_notes && (
                        <div className="p-4 bg-purple-50 rounded-xl">
                          <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Submission</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{milestone.submission_notes}</p>
                        </div>
                      )}
                      {milestone?.file_url && (
                        <a
                          href={`${import.meta.env.VITE_API_URL}${milestone.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-100 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> View Submitted Document
                        </a>
                      )}

                      {isSubmitted && (
                        <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm font-bold text-slate-700">Coordinate Review:</p>
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Approval Notes *</label>
                            <textarea
                              rows={2}
                              value={approveNotes[stageNum] || ''}
                              onChange={e => setApproveNotes(n => ({ ...n, [stageNum]: e.target.value }))}
                              placeholder="Approval coordination notes..."
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-purple-300 focus:outline-none"
                            />
                            <button
                              onClick={() => handleApprove(stageNum)}
                              disabled={processing[`approve_${stageNum}`]}
                              className="mt-2 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {processing[`approve_${stageNum}`] ? 'Approving...' : 'Approve Stage'}
                            </button>
                          </div>
                          <div className="border-t border-gray-200 pt-3">
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Revision Reason *</label>
                            <textarea
                              rows={2}
                              value={rejectNotes[stageNum] || ''}
                              onChange={e => setRejectNotes(n => ({ ...n, [stageNum]: e.target.value }))}
                              placeholder="Why revision is needed..."
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-200 focus:outline-none"
                            />
                            <button
                              onClick={() => handleReject(stageNum)}
                              disabled={processing[`reject_${stageNum}`]}
                              className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              {processing[`reject_${stageNum}`] ? 'Sending...' : 'Request Revision'}
                            </button>
                          </div>
                        </div>
                      )}

                      {stageComments.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Coordination Notes</p>
                          {stageComments.map(c => (
                            <div key={c.id} className="p-3 bg-white border border-gray-100 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-slate-700">{c.commenter_name}</span>
                                <span className="text-xs text-gray-400 ml-auto">{new Date(c.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-slate-600">{c.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs font-bold text-slate-500 mb-2">Add Coordination Note</p>
                        <textarea
                          rows={2}
                          value={commentText[stageNum] || ''}
                          onChange={e => setCommentText(t => ({ ...t, [stageNum]: e.target.value }))}
                          placeholder="Add coordination guidance..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-purple-300 focus:outline-none"
                        />
                        <button
                          onClick={() => handleComment(stageNum)}
                          disabled={processing[`comment_${stageNum}`]}
                          className="mt-2 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {processing[`comment_${stageNum}`] ? 'Posting...' : 'Post Note'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const CoordinatorWorkspace = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [tab, setTab] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const api = getAuthenticatedAxios();
      const [projRes, statsRes] = await Promise.all([
        api.get('/api/workspace/my-projects'),
        api.get('/api/workspace/stats'),
      ]);
      setProjects(projRes.data.projects || []);
      setStats(statsRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchNotifications = async () => {
    try {
      const api = getAuthenticatedAxios();
      const res = await api.get('/api/notifications');
      setNotifications(res.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (tab === 'notifications') fetchNotifications(); }, [tab]);

  const markRead = async (id) => {
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    } catch (e) { console.error(e); }
  };

  // Coordination status summary
  const onTrack = projects.filter(p => Number(p.pending_review) === 0 && p.project_status !== 'completed').length;
  const pendingReviewCount = projects.filter(p => Number(p.pending_review) > 0).length;
  const completedCount = projects.filter(p => p.project_status === 'completed').length;

  const TABS = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'projects', label: 'All Projects', icon: FolderKanban },
    { key: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <main className="flex-1 bg-gray-50 overflow-auto">
      <div className="bg-gradient-to-r from-purple-800 to-purple-600 text-white px-6 py-8">
        <h1 className="text-2xl font-bold mb-1">Coordinator Workspace</h1>
        <p className="text-purple-100 text-sm">Coordinate project activities and ensure smooth milestone progression.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-5 bg-white border-b border-gray-100">
          {[
            { label: 'Total Projects', value: stats.totalProjects, color: 'text-purple-600' },
            { label: 'Pending Reviews', value: stats.pendingReviews, color: 'text-yellow-600' },
            { label: 'Completed', value: stats.completedProjects, color: 'text-green-600' },
            { label: 'Unread Notifs', value: stats.unreadNotifications, color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex border-b border-gray-200 bg-white px-6">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors
                ${tab === t.key ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-slate-700'}`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          </div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="space-y-6">
                {/* Coordination Status Summary */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'On Track', value: onTrack, color: 'border-green-400 text-green-600' },
                    { label: 'Needs Review', value: pendingReviewCount, color: 'border-yellow-400 text-yellow-600' },
                    { label: 'Completed', value: completedCount, color: 'border-purple-400 text-purple-600' },
                  ].map(s => (
                    <div key={s.label} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${s.color.split(' ')[0]} text-center`}>
                      <p className={`text-3xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
                      <p className="text-xs text-gray-400 font-medium mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-700 mb-3">Projects Needing Attention</h2>
                  {projects.filter(p => Number(p.pending_review) > 0).length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                      <CheckCircle className="w-10 h-10 text-purple-100 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">All projects are on track.</p>
                    </div>
                  ) : (
                    projects.filter(p => Number(p.pending_review) > 0).map(p => (
                      <CoordProjectCard key={p.id} project={p} onView={() => setSelectedProject(p.id)} />
                    ))
                  )}
                </div>
              </div>
            )}

            {tab === 'projects' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-700">All Projects ({projects.length})</h2>
                {projects.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                    <p className="text-gray-400">No projects found.</p>
                  </div>
                ) : (
                  projects.map(p => (
                    <CoordProjectCard key={p.id} project={p} onView={() => setSelectedProject(p.id)} />
                  ))
                )}
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-lg font-bold text-slate-700 mb-4">Notifications</h2>
                {notifications.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                    <p className="text-gray-400">No notifications.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markRead(n.id)}
                      className={`p-4 rounded-xl border cursor-pointer ${n.read ? 'bg-white border-gray-100' : 'bg-purple-50 border-purple-200'}`}
                    >
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {selectedProject && (
        <ProjectDetailModal projectId={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </main>
  );
};

const CoordProjectCard = ({ project, onView }) => {
  const completed = Number(project.completed_milestones) || 0;
  const pending = Number(project.pending_review) || 0;
  const pct = Math.round((completed / 9) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-800 truncate">{project.title}</h3>
            {project.project_status === 'completed' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Completed</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{project.innovator_name} · {project.category}</p>
        </div>
        <div className="flex items-center gap-2">
          {pending > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-bold">{pending} pending</span>
          )}
          <button onClick={onView} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold">
            View Project
          </button>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs font-semibold text-purple-600">{pct}% ({completed}/9)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="h-2 rounded-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
};

export default CoordinatorWorkspace;
