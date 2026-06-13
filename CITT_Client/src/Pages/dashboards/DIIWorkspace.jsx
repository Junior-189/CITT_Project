import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FolderKanban, Users, BookOpen, MessageSquare, BarChart3,
  Eye, ThumbsUp, ThumbsDown, X, Plus, CheckCircle, Clock,
  AlertCircle, ChevronDown, ChevronUp, UserCheck, Camera,
} from 'lucide-react';

const STAGE_NAMES = ['','Idea Generation','Concept Development','Prototype Development',
  'Testing & Validation','IP & Documentation','Funding & Investment',
  'Deployment','Monitoring & Evaluation','Scaling & Commercialization'];

const STATUS_COLORS = {
  pending:     'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted:   'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-700',
};

// ── Milestone Modal ───────────────────────────────────────────────────────────
const MilestoneModal = ({ project, onClose, api, onRefresh }) => {
  const [milestones, setMilestones] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes] = useState({});
  const [acting, setActing] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api().get(`/api/projects/${project.id}/milestones`)
      .then(r => setMilestones(r.data.milestones || []))
      .catch(() => {});
  }, [project.id]);

  const handleAction = async (stageNum, action) => {
    const n = notes[stageNum] || '';
    if (action === 'reject' && !n.trim()) { setMsg('Notes required for rejection.'); return; }
    setActing(`${stageNum}-${action}`);
    try {
      await api().put(`/api/projects/${project.id}/milestones/${stageNum}/${action}`, { notes: n || 'Approved by DII Director' });
      setMsg(action === 'approve' ? `Stage ${stageNum} approved!` : `Stage ${stageNum} sent back for revision.`);
      const r = await api().get(`/api/projects/${project.id}/milestones`);
      setMilestones(r.data.milestones || []);
      onRefresh();
    } catch (e) { setMsg(e.response?.data?.error || 'Action failed.'); }
    finally { setActing(null); }
  };

  const completedCount = milestones.filter(m => m.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-auto p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">{project.title}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">{project.innovator_name} · {completedCount}/9 completed</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-3 border-b">
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${Math.round(completedCount / 9 * 100)}%` }} />
          </div>
        </div>
        {msg && (
          <div className="mx-6 mt-3 p-2 bg-blue-50 text-blue-700 text-sm rounded flex justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg('')}><X className="w-3 h-3" /></button>
          </div>
        )}
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {Array.from({ length: 9 }, (_, i) => i + 1).map(stageNum => {
            const record = milestones.find(m => m.stage_number === stageNum);
            const status = record?.status || 'pending';
            const isOpen = expanded === stageNum;
            return (
              <div key={stageNum}>
                <button className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-700"
                  onClick={() => setExpanded(isOpen ? null : stageNum)}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
                    {stageNum}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-400 dark:text-slate-400">Stage {stageNum}</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{STAGE_NAMES[stageNum]}</p>
                  </div>
                  <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>
                    {status.replace('_', ' ')}
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 bg-gray-50 dark:bg-slate-900 border-t">
                    {record?.submission_notes && (
                      <div className="mt-3 p-3 bg-white dark:bg-slate-800 border rounded-lg text-sm">
                        <p className="font-semibold text-gray-700 dark:text-slate-300 mb-1">Innovator's notes:</p>
                        <p className="text-gray-600 dark:text-slate-400">{record.submission_notes}</p>
                      </div>
                    )}
                    {record?.rejection_reason && (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg text-sm text-red-700 dark:text-red-300">
                        <p className="font-semibold mb-1">Previous feedback:</p>
                        <p>{record.rejection_reason}</p>
                      </div>
                    )}
                    {status === 'submitted' && (
                      <div className="mt-3 space-y-2">
                        <textarea rows={2} value={notes[stageNum] || ''} placeholder="Review notes (required for revision)..."
                          onChange={e => setNotes(n => ({ ...n, [stageNum]: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus:ring-teal-400 outline-none resize-none" />
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(stageNum, 'approve')} disabled={!!acting}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {acting === `${stageNum}-approve` ? 'Approving…' : 'Approve'}
                          </button>
                          <button onClick={() => handleAction(stageNum, 'reject')} disabled={!!acting}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                            <ThumbsDown className="w-3.5 h-3.5" />
                            {acting === `${stageNum}-reject` ? 'Sending…' : 'Request Revision'}
                          </button>
                        </div>
                      </div>
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

// ── Main Workspace ─────────────────────────────────────────────────────────────
const DIIWorkspace = () => {
  const { profile, getAuthenticatedAxios } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashData, setDashData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [innovators, setInnovators] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingProject, setViewingProject] = useState(null);
  const [assigningProject, setAssigningProject] = useState(null);
  const [assignData, setAssignData] = useState({ userId: '', type: 'mentor' });
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ subject: '', description: '' });
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [trainingForm, setTrainingForm] = useState({ title: '', description: '', target_audience: '', status: 'planned', start_date: '', end_date: '' });
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myPhotoUrl, setMyPhotoUrl] = useState(profile?.profile_photo_url || null);

  const api = () => getAuthenticatedAxios();

  const handleMyPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await api().post('/api/workspace/my-director-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMyPhotoUrl(res.data.photo_url);
    } catch (err) { console.error('Photo upload failed:', err); }
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dash, proj, innov, comp, train, users] = await Promise.all([
        api().get('/api/departments/DII/dashboard'),
        api().get('/api/departments/DII/projects?limit=200'),
        api().get('/api/departments/DII/innovators'),
        api().get('/api/departments/DII/complaints'),
        api().get('/api/departments/DII/trainings'),
        api().get('/api/admin/users?limit=500'),
      ]);
      setDashData(dash.data);
      setProjects(proj.data.projects || []);
      setInnovators(innov.data.innovators || []);
      setComplaints(comp.data.complaints || []);
      setTrainings(train.data.trainings || []);
      setAssignableUsers((users.data.users || []).filter(u => ['mentor', 'technicalCommittee', 'coordinator'].includes(u.role)));
    } catch (e) { setError('Failed to load workspace data'); }
    finally { setLoading(false); }
  };

  const flash = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 4000); }
  };

  const handleApprove = async (projectId) => {
    try {
      await api().put(`/api/admin/projects/${projectId}/approve`, { comments: 'Approved by DII Director' });
      flash('success', 'Project approved');
      fetchAll();
    } catch (e) { flash('error', e.response?.data?.error || 'Failed to approve'); }
  };

  const handleReject = async (projectId, reason) => {
    if (!reason?.trim()) return;
    try {
      await api().put(`/api/admin/projects/${projectId}/reject`, { reason: reason.trim() });
      flash('success', 'Project rejected');
      fetchAll();
    } catch (e) { flash('error', e.response?.data?.error || 'Failed to reject'); }
  };

  const handleAssign = async () => {
    if (!assignData.userId) { flash('error', 'Please select a user'); return; }
    try {
      await api().post(`/api/projects/${assigningProject.id}/assign`, {
        assigned_user_id: parseInt(assignData.userId),
        assignment_type: assignData.type,
      });
      flash('success', 'Project assigned successfully');
      setAssigningProject(null);
      fetchAll();
    } catch (e) { flash('error', e.response?.data?.error || 'Assignment failed'); }
  };

  const handleComplaintUpdate = async (complaintId, updates) => {
    try {
      await api().put(`/api/departments/DII/complaints/${complaintId}`, updates);
      flash('success', 'Complaint updated');
      const r = await api().get('/api/departments/DII/complaints');
      setComplaints(r.data.complaints || []);
    } catch { flash('error', 'Failed to update complaint'); }
  };

  const submitComplaint = async () => {
    if (!complaintForm.subject.trim() || !complaintForm.description.trim()) {
      flash('error', 'Subject and description are required'); return;
    }
    try {
      await api().post('/api/departments/DII/complaints', complaintForm);
      flash('success', 'Complaint submitted');
      setShowComplaintForm(false);
      setComplaintForm({ subject: '', description: '' });
      const r = await api().get('/api/departments/DII/complaints');
      setComplaints(r.data.complaints || []);
    } catch { flash('error', 'Failed to submit complaint'); }
  };

  const submitTraining = async () => {
    if (!trainingForm.title.trim()) { flash('error', 'Training title is required'); return; }
    try {
      await api().post('/api/departments/DII/trainings', trainingForm);
      flash('success', 'Training programme created');
      setShowTrainingForm(false);
      setTrainingForm({ title: '', description: '', target_audience: '', status: 'planned', start_date: '', end_date: '' });
      const r = await api().get('/api/departments/DII/trainings');
      setTrainings(r.data.trainings || []);
    } catch { flash('error', 'Failed to create training'); }
  };

  const filteredProjects = projects.filter(p => {
    const q = projectSearch.toLowerCase();
    const matchSearch = !q || p.title?.toLowerCase().includes(q) || p.innovator_name?.toLowerCase().includes(q);
    const matchStatus = !projectStatusFilter || p.approval_status === projectStatusFilter;
    return matchSearch && matchStatus;
  });

  const tabs = [
    { id: 'overview',    label: 'Overview',           icon: BarChart3 },
    { id: 'projects',    label: 'Projects',            icon: FolderKanban },
    { id: 'innovators',  label: 'Innovator Database',  icon: Users },
    { id: 'trainings',   label: 'Training & Mentoring', icon: BookOpen },
    { id: 'complaints',  label: 'Complaints',          icon: MessageSquare },
  ];

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
    </div>
  );

  return (
    <main className="flex-1 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Modals */}
      {viewingProject && (
        <MilestoneModal
          project={viewingProject}
          onClose={() => setViewingProject(null)}
          api={api}
          onRefresh={fetchAll}
        />
      )}

      {assigningProject && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">Assign Project</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 truncate">{assigningProject.title}</p>
            <div className="space-y-3">
              <select value={assignData.type} onChange={e => setAssignData(d => ({ ...d, type: e.target.value, userId: '' }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus:ring-teal-400 outline-none">
                <option value="mentor">Mentor</option>
                <option value="technical_committee">Technical Committee</option>
                <option value="coordinator">Coordinator</option>
              </select>
              <select value={assignData.userId} onChange={e => setAssignData(d => ({ ...d, userId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus:ring-teal-400 outline-none">
                <option value="">Select user…</option>
                {assignableUsers
                  .filter(u => assignData.type === 'mentor' ? u.role === 'mentor' : assignData.type === 'technical_committee' ? u.role === 'technicalCommittee' : u.role === 'coordinator')
                  .map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)
                }
              </select>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAssign} className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold">
                <UserCheck className="w-4 h-4 inline mr-1" /> Confirm
              </button>
              <button onClick={() => setAssigningProject(null)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white px-6 md:px-10 py-6 flex items-center gap-6">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/30 bg-teal-500 flex items-center justify-center">
            {myPhotoUrl
              ? <img src={myPhotoUrl} alt="Director" className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-white">{profile?.name?.[0]?.toUpperCase() || 'D'}</span>
            }
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <Camera className="w-6 h-6 text-white" />
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleMyPhotoUpload} />
          </label>
        </div>
        <div>
          <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Department Workspace</p>
          <h1 className="text-2xl md:text-3xl font-bold">Department of Innovations & Incubation</h1>
          <p className="text-teal-100 text-sm mt-1">Welcome, {profile?.name} — DII Director</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 md:px-10 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === tab.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && dashData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Projects', value: dashData.stats.totalProjects, color: 'border-teal-500' },
                { label: 'Awaiting Review', value: dashData.stats.pendingProjects, color: 'border-yellow-400' },
                { label: 'Approved', value: dashData.stats.approvedProjects, color: 'border-green-500' },
                { label: 'Open Complaints', value: dashData.stats.openComplaints, color: 'border-red-400' },
              ].map(s => (
                <div key={s.label} className={`bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border-l-4 ${s.color} text-center`}>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">DII Department Functions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(dashData?.department?.functions || []).map((fn, i) => (
                  <div key={fn.id || i} className="flex items-start gap-3 p-3 bg-teal-50 dark:bg-teal-500/10 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{fn.order_num || i + 1}</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{fn.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PROJECTS ── */}
        {activeTab === 'projects' && (
          <div>
            <div className="flex flex-wrap gap-3 mb-5">
              <input value={projectSearch} onChange={e => setProjectSearch(e.target.value)}
                placeholder="Search by title or innovator…"
                className="flex-1 min-w-[200px] border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400 outline-none" />
              <select value={projectStatusFilter} onChange={e => setProjectStatusFilter(e.target.value)}
                className="border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-3">
              {filteredProjects.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border text-gray-400 dark:text-slate-400">No projects found</div>
              )}
              {filteredProjects.map(p => {
                const pct = Math.round(((p.completed_milestones || 0) / 9) * 100);
                const badgeClass = p.approval_status === 'approved' ? 'bg-green-100 text-green-700'
                  : p.approval_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
                return (
                  <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{p.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>{p.approval_status}</span>
                          {(p.submitted_milestones > 0) && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                              {p.submitted_milestones} milestone{p.submitted_milestones > 1 ? 's' : ''} awaiting
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{p.innovator_name} · {p.category}</p>
                        {p.assigned_mentor && <p className="text-xs text-teal-600 mt-0.5">Mentor: {p.assigned_mentor}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setViewingProject(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold">
                          <Eye className="w-3.5 h-3.5" /> Milestones
                        </button>
                        {p.approval_status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(p.id)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold">
                              Approve
                            </button>
                            <button onClick={() => { const r = window.prompt('Rejection reason:'); handleReject(p.id, r); }}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold">
                              Reject
                            </button>
                          </>
                        )}
                        {p.approval_status === 'approved' && (
                          <button onClick={() => { setAssigningProject(p); setAssignData({ userId: '', type: 'mentor' }); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold">
                            <UserCheck className="w-3.5 h-3.5" /> Assign
                          </button>
                        )}
                      </div>
                    </div>
                    {p.approval_status === 'approved' && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 dark:text-slate-400">{p.completed_milestones || 0}/9</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── INNOVATOR DATABASE ── */}
        {activeTab === 'innovators' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-700 dark:text-slate-200">Innovator Database <span className="text-gray-400 dark:text-slate-400 font-normal text-sm">({innovators.length})</span></h2>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
              {innovators.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-slate-400">No innovators registered yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-900 text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide text-left">
                        <th className="px-5 py-3 font-semibold">Name</th>
                        <th className="px-5 py-3 font-semibold">Email</th>
                        <th className="px-5 py-3 font-semibold">University</th>
                        <th className="px-5 py-3 font-semibold">Projects</th>
                        <th className="px-5 py-3 font-semibold">Approved</th>
                        <th className="px-5 py-3 font-semibold">Max Stage</th>
                        <th className="px-5 py-3 font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {innovators.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-700">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-teal-700">{u.name?.charAt(0).toUpperCase()}</span>
                              </div>
                              <span className="font-medium text-slate-800 dark:text-slate-100">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{u.email}</td>
                          <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{u.university || '—'}</td>
                          <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">{u.total_projects}</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{u.approved_projects}</span>
                          </td>
                          <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{u.max_milestone_reached ? `Stage ${u.max_milestone_reached}` : '—'}</td>
                          <td className="px-5 py-3 text-gray-400 dark:text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TRAININGS ── */}
        {activeTab === 'trainings' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-700 dark:text-slate-200">Training Programmes <span className="text-gray-400 dark:text-slate-400 font-normal text-sm">({trainings.length})</span></h2>
              <button onClick={() => setShowTrainingForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold">
                <Plus className="w-4 h-4" /> Add Programme
              </button>
            </div>

            {showTrainingForm && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-teal-200 p-6 mb-5">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">New Training Programme</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Title *</label>
                    <input value={trainingForm.title} onChange={e => setTrainingForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus:ring-teal-400 outline-none"
                      placeholder="Training programme title" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Target Audience</label>
                    <input value={trainingForm.target_audience} onChange={e => setTrainingForm(f => ({ ...f, target_audience: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus:ring-teal-400 outline-none"
                      placeholder="e.g. Innovators, Students" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Status</label>
                    <select value={trainingForm.status} onChange={e => setTrainingForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus:ring-teal-400 outline-none">
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Start Date</label>
                    <input type="date" value={trainingForm.start_date} onChange={e => setTrainingForm(f => ({ ...f, start_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus:ring-teal-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">End Date</label>
                    <input type="date" value={trainingForm.end_date} onChange={e => setTrainingForm(f => ({ ...f, end_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus:ring-teal-400 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Description</label>
                    <textarea rows={3} value={trainingForm.description} onChange={e => setTrainingForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus:ring-teal-400 outline-none resize-none"
                      placeholder="Programme description…" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={submitTraining} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold">Save</button>
                  <button onClick={() => setShowTrainingForm(false)} className="px-5 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-semibold">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {trainings.length === 0 && <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border text-gray-400 dark:text-slate-400">No training programmes yet</div>}
              {trainings.map(t => {
                const statusColor = { planned: 'bg-gray-100 text-gray-700', active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700', cancelled: 'bg-red-100 text-red-700' };
                return (
                  <div key={t.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{t.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor[t.status] || 'bg-gray-100 text-gray-700'}`}>{t.status}</span>
                        </div>
                        {t.description && <p className="text-sm text-gray-500 dark:text-slate-400">{t.description}</p>}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400 dark:text-slate-400">
                          {t.target_audience && <span>Audience: {t.target_audience}</span>}
                          {t.start_date && <span>Start: {new Date(t.start_date).toLocaleDateString()}</span>}
                          {t.end_date && <span>End: {new Date(t.end_date).toLocaleDateString()}</span>}
                          {t.created_by_name && <span>By: {t.created_by_name}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COMPLAINTS ── */}
        {activeTab === 'complaints' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-700 dark:text-slate-200">Complaints <span className="text-gray-400 dark:text-slate-400 font-normal text-sm">({complaints.length})</span></h2>
              <button onClick={() => setShowComplaintForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold">
                <Plus className="w-4 h-4" /> Submit Complaint
              </button>
            </div>

            {showComplaintForm && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-teal-200 p-6 mb-5">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">New Complaint</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Subject *</label>
                    <input value={complaintForm.subject} onChange={e => setComplaintForm(f => ({ ...f, subject: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus:ring-teal-400 outline-none" placeholder="Complaint subject" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Description *</label>
                    <textarea rows={4} value={complaintForm.description} onChange={e => setComplaintForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 focus:ring-teal-400 outline-none resize-none" placeholder="Describe the issue…" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={submitComplaint} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold">Submit</button>
                  <button onClick={() => setShowComplaintForm(false)} className="px-5 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-semibold">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {complaints.length === 0 && <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border text-gray-400 dark:text-slate-400">No complaints filed</div>}
              {complaints.map(c => {
                const statusColor = { open: 'bg-red-100 text-red-700', in_review: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{c.subject}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor[c.status] || 'bg-gray-100 text-gray-700'}`}>{c.status.replace('_', ' ')}</span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-400">By: {c.submitted_by_name} · {new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                      {(c.status === 'open' || c.status === 'in_review') && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => handleComplaintUpdate(c.id, { status: 'in_review' })}
                            className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-xs font-semibold">
                            <Clock className="w-3 h-3 inline mr-1" />In Review
                          </button>
                          <button onClick={() => { const r = window.prompt('Resolution notes:'); if (r) handleComplaintUpdate(c.id, { status: 'resolved', resolution: r }); }}
                            className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-semibold">
                            <CheckCircle className="w-3 h-3 inline mr-1" />Resolve
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{c.description}</p>
                    {c.resolution && (
                      <div className="mt-2 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg text-sm text-green-700 dark:text-green-300">
                        <span className="font-semibold">Resolution: </span>{c.resolution}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default DIIWorkspace;
