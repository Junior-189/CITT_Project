import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Clock, Send, Circle, ChevronDown, ChevronUp, X, Eye } from 'lucide-react';

const STAGE_NAMES = {
  1:'Idea Generation',2:'Concept Development',3:'Prototype Development',
  4:'Testing & Validation',5:'IP & Documentation',6:'Funding & Investment',
  7:'Deployment / Implementation',8:'Monitoring & Evaluation',9:'Scaling & Commercialization',
};

const STATUS_CFG = {
  pending:     { icon: Circle,      color: 'text-gray-400',   bg: 'bg-gray-100',   label: 'Pending' },
  in_progress: { icon: Clock,       color: 'text-yellow-500', bg: 'bg-yellow-50',  label: 'In Progress' },
  submitted:   { icon: Send,        color: 'text-blue-500',   bg: 'bg-blue-50',    label: 'Submitted' },
  completed:   { icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50',   label: 'Completed' },
  rejected:    { icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-50',     label: 'Needs Revision' },
};

const ReviewMilestoneModal = ({ project, onClose, getAuthenticatedAxios }) => {
  const [milestones, setMilestones] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const [acting, setActing] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchMilestones(); }, [project.id]);

  const fetchMilestones = async () => {
    try {
      const api = getAuthenticatedAxios();
      const res = await api.get(`/api/projects/${project.id}/milestones`);
      setMilestones(res.data.milestones || []);
    } catch (e) { console.error(e); }
  };

  const completedCount = milestones.filter(m => m.status === 'completed').length;

  const handleAction = async (stageNum, action) => {
    const notes = reviewNotes[stageNum] || '';
    if (action === 'reject' && !notes.trim()) { setMsg('Rejection notes are required.'); return; }
    setActing(`${stageNum}-${action}`);
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/projects/${project.id}/milestones/${stageNum}/${action}`, { notes: notes || 'Approved by reviewer' });
      setMsg(action === 'approve' ? `Stage ${stageNum} approved.` : `Stage ${stageNum} sent back for revision.`);
      await fetchMilestones();
    } catch (e) { setMsg(e.response?.data?.error || 'Action failed.'); }
    finally { setActing(null); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-auto p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-bold text-lg text-slate-800">{project.title}</h2>
            <p className="text-xs text-gray-500">Milestone Review — {completedCount}/9 stages completed</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        {/* Progress bar */}
        <div className="px-6 py-3 border-b">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Overall Progress</span><span>{Math.round(completedCount/9*100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${Math.round(completedCount/9*100)}%` }} />
          </div>
        </div>
        {msg && <div className="mx-6 mt-3 p-2 bg-blue-50 text-blue-700 text-sm rounded">{msg} <button className="ml-2 underline text-xs" onClick={() => setMsg('')}>Dismiss</button></div>}
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {Object.entries(STAGE_NAMES).map(([num, name]) => {
            const stageNum = parseInt(num);
            const record = milestones.find(m => m.stage_number === stageNum);
            const status = record?.status || 'pending';
            const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
            const Icon = cfg.icon;
            const isOpen = expanded === stageNum;
            return (
              <div key={stageNum}>
                <button className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-50"
                  onClick={() => setExpanded(isOpen ? null : stageNum)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-400">Stage {stageNum}</span>
                    <p className="text-sm font-semibold text-slate-800">{name}</p>
                  </div>
                  <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 bg-gray-50">
                    {record?.submission_notes && (
                      <div className="p-3 bg-white border rounded-lg text-sm mb-3">
                        <p className="font-semibold text-gray-700 mb-1">Innovator's submission:</p>
                        <p className="text-gray-600">{record.submission_notes}</p>
                      </div>
                    )}
                    {record?.rejection_reason && (
                      <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700 mb-3">
                        <p className="font-semibold mb-1">Previous feedback:</p>
                        <p>{record.rejection_reason}</p>
                      </div>
                    )}
                    {status === 'submitted' && (
                      <div className="space-y-2 mt-2">
                        <textarea rows={2} value={reviewNotes[stageNum] || ''} placeholder="Review notes (required for rejection)..."
                          onChange={e => setReviewNotes(n => ({ ...n, [stageNum]: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none" />
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(stageNum, 'approve')} disabled={!!acting}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {acting === `${stageNum}-approve` ? 'Approving…' : 'Approve'}
                          </button>
                          <button onClick={() => handleAction(stageNum, 'reject')} disabled={!!acting}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                            <XCircle className="w-3.5 h-3.5" />
                            {acting === `${stageNum}-reject` ? 'Sending…' : 'Request Revision'}
                          </button>
                        </div>
                      </div>
                    )}
                    {status === 'completed' && record?.approval_notes && (
                      <p className="text-xs text-green-700 bg-green-50 p-2 rounded mt-2">✓ {record.approval_notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DIIDashboard = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [tab, setTab] = useState('review');
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [milestoneProject, setMilestoneProject] = useState(null);
  const [viewProject, setViewProject] = useState(null);
  const [assign, setAssign] = useState({});
  const [rejectReason, setRejectReason] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const api = getAuthenticatedAxios();
      const [pRes, uRes] = await Promise.all([
        api.get('/api/admin/projects', { params: { limit: 500 } }),
        api.get('/api/admin/users', { params: { limit: 500 } }),
      ]);
      setProjects(pRes.data.projects || []);
      setUsers(uRes.data.users || uRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const pending = projects.filter(p => p.approval_status === 'pending');
  const approved = projects.filter(p => p.approval_status === 'approved');
  const completed = projects.filter(p => p.project_status === 'completed');

  const handleApprove = async (id) => {
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/admin/projects/${id}/approve`, { comments: 'Approved by DII Director' });
      await fetchAll();
    } catch (e) { alert(e.response?.data?.error || 'Failed to approve'); }
  };

  const handleReject = async (id) => {
    const reason = rejectReason[id];
    if (!reason?.trim()) { alert('Please enter a rejection reason'); return; }
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/admin/projects/${id}/reject`, { reason });
      setRejectReason(r => ({ ...r, [id]: '' }));
      await fetchAll();
    } catch (e) { alert(e.response?.data?.error || 'Failed to reject'); }
  };

  const handleAssign = async (projectId) => {
    const { type, userId } = assign[projectId] || {};
    if (!type || !userId) { alert('Select assignment type and user'); return; }
    try {
      const api = getAuthenticatedAxios();
      await api.post(`/api/projects/${projectId}/assign`, { assigned_user_id: userId, assignment_type: type });
      setAssign(a => ({ ...a, [projectId]: {} }));
      alert('Assigned successfully');
    } catch (e) { alert(e.response?.data?.error || 'Assignment failed'); }
  };

  const mentors = users.filter(u => u.role === 'mentor');
  const tcMembers = users.filter(u => u.role === 'technicalCommittee');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {milestoneProject && (
        <ReviewMilestoneModal project={milestoneProject} onClose={() => setMilestoneProject(null)} getAuthenticatedAxios={getAuthenticatedAxios} />
      )}
      {viewProject && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg">{viewProject.title}</h3>
              <button onClick={() => setViewProject(null)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-1"><strong>Category:</strong> {viewProject.category}</p>
            <p className="text-sm text-gray-500 mb-1"><strong>Institution:</strong> {viewProject.institution}</p>
            <p className="text-sm text-gray-700 mt-3">{viewProject.description}</p>
            {viewProject.problem_statement && <p className="text-sm text-gray-600 mt-2"><strong>Problem:</strong> {viewProject.problem_statement}</p>}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">DII Director Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Projects', count: projects.length, color: 'border-gray-400' },
            { label: 'Awaiting Review', count: pending.length, color: 'border-yellow-400' },
            { label: 'Approved', count: approved.length, color: 'border-green-500' },
            { label: 'Completed', count: completed.length, color: 'border-purple-500' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl p-4 border-l-4 ${s.color} shadow-sm text-center`}>
              <p className="text-2xl font-bold text-slate-800">{s.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm w-fit border border-gray-100">
          {[['review', 'Ideation Review'], ['progress', 'Progress Tracking']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {label} {key === 'review' ? `(${pending.length})` : `(${approved.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : tab === 'review' ? (
          <div className="space-y-4">
            {pending.length === 0 && <div className="text-center py-12 bg-white rounded-xl border text-gray-400">No pending projects</div>}
            {pending.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800">{p.title}</h3>
                    <p className="text-xs text-gray-500">{p.innovator_name || p.user_name || 'Unknown'} · {p.category}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Pending</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{p.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={() => setViewProject(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => handleApprove(p.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => setRejectReason(r => ({ ...r, [p.id]: r[p.id] === undefined ? '' : undefined }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button onClick={() => setAssign(a => ({ ...a, [p.id]: a[p.id] ? null : { type: '', userId: '' } }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold">
                    Assign
                  </button>
                </div>
                {rejectReason[p.id] !== undefined && (
                  <div className="flex gap-2 mb-3">
                    <input value={rejectReason[p.id]} onChange={e => setRejectReason(r => ({ ...r, [p.id]: e.target.value }))}
                      placeholder="Rejection reason..." className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                    <button onClick={() => handleReject(p.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600">Submit</button>
                  </div>
                )}
                {assign[p.id] && (
                  <div className="flex flex-wrap gap-2 p-3 bg-teal-50 rounded-lg">
                    <select value={assign[p.id]?.type || ''} onChange={e => setAssign(a => ({ ...a, [p.id]: { ...a[p.id], type: e.target.value, userId: '' } }))}
                      className="border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                      <option value="">Type…</option>
                      <option value="mentor">Mentor</option>
                      <option value="technical_committee">Technical Committee</option>
                    </select>
                    <select value={assign[p.id]?.userId || ''} onChange={e => setAssign(a => ({ ...a, [p.id]: { ...a[p.id], userId: e.target.value } }))}
                      className="flex-1 border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                      <option value="">Select user…</option>
                      {(assign[p.id]?.type === 'mentor' ? mentors : tcMembers).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <button onClick={() => handleAssign(p.id)} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700">Confirm</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {approved.length === 0 && <div className="text-center py-12 bg-white rounded-xl border text-gray-400">No approved projects yet</div>}
            {approved.map(p => {
              const pct = Math.round(((p.completed_milestones || 0) / 9) * 100);
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{p.title}</h3>
                    <p className="text-xs text-gray-500">{p.innovator_name || p.user_name || 'Unknown'} · {p.category}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                  <button onClick={() => setMilestoneProject(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold">
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DIIDashboard;
