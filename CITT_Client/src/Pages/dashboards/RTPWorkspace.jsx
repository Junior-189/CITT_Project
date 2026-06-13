import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FolderKanban, BookOpen, MessageSquare, BarChart3,
  Eye, X, Plus, CheckCircle, Clock, ChevronDown, ChevronUp, Camera,
} from 'lucide-react';

const STATUS_COLORS = {
  pending:     'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted:   'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-700',
};

const STAGE_NAMES = ['','Idea Generation','Concept Development','Prototype Development',
  'Testing & Validation','IP & Documentation','Funding & Investment',
  'Deployment','Monitoring & Evaluation','Scaling & Commercialization'];

// ── Milestone View Modal (read-only for RTP) ──────────────────────────────────
const MilestoneViewModal = ({ project, onClose, api }) => {
  const [milestones, setMilestones] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api().get(`/api/projects/${project.id}/milestones`)
      .then(r => setMilestones(r.data.milestones || []))
      .catch(() => {});
  }, [project.id]);

  const completedCount = milestones.filter(m => m.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-auto p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">{project.title}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">{project.innovator_name} · {completedCount}/9 completed</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-3 border-b">
          <div className="flex justify-between text-xs text-gray-400 dark:text-slate-400 mb-1">
            <span>Innovation Progress</span><span>{Math.round(completedCount / 9 * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.round(completedCount / 9 * 100)}%` }} />
          </div>
        </div>
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {Array.from({ length: 9 }, (_, i) => i + 1).map(stageNum => {
            const record = milestones.find(m => m.stage_number === stageNum);
            const status = record?.status || 'pending';
            const isOpen = expanded === stageNum;
            return (
              <div key={stageNum}>
                <button className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-700"
                  onClick={() => setExpanded(isOpen ? null : stageNum)}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${STATUS_COLORS[status]}`}>
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
                {isOpen && record?.submission_notes && (
                  <div className="px-6 pb-4 bg-gray-50 dark:bg-slate-900 border-t text-sm text-gray-600 dark:text-slate-400">
                    <p className="mt-3"><strong>Notes:</strong> {record.submission_notes}</p>
                    {record.rejection_reason && <p className="mt-1 text-red-600"><strong>Feedback:</strong> {record.rejection_reason}</p>}
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
const RTPWorkspace = () => {
  const { profile, getAuthenticatedAxios } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashData, setDashData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingProject, setViewingProject] = useState(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ subject: '', description: '' });
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [trainingForm, setTrainingForm] = useState({ title: '', description: '', target_audience: '', status: 'planned', start_date: '', end_date: '' });
  const [projectSearch, setProjectSearch] = useState('');
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
      const [dash, proj, comp, train] = await Promise.all([
        api().get('/api/departments/RTP/dashboard'),
        api().get('/api/departments/RTP/projects?limit=200'),
        api().get('/api/departments/RTP/complaints'),
        api().get('/api/departments/RTP/trainings'),
      ]);
      setDashData(dash.data);
      setProjects(proj.data.projects || []);
      setComplaints(comp.data.complaints || []);
      setTrainings(train.data.trainings || []);
    } catch (e) { setError('Failed to load workspace data'); }
    finally { setLoading(false); }
  };

  const flash = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 4000); }
  };

  const handleComplaintUpdate = async (id, updates) => {
    try {
      await api().put(`/api/departments/RTP/complaints/${id}`, updates);
      flash('success', 'Complaint updated');
      const r = await api().get('/api/departments/RTP/complaints');
      setComplaints(r.data.complaints || []);
    } catch { flash('error', 'Failed to update'); }
  };

  const submitComplaint = async () => {
    if (!complaintForm.subject.trim() || !complaintForm.description.trim()) { flash('error', 'Subject and description required'); return; }
    try {
      await api().post('/api/departments/RTP/complaints', complaintForm);
      flash('success', 'Complaint submitted');
      setShowComplaintForm(false);
      setComplaintForm({ subject: '', description: '' });
      const r = await api().get('/api/departments/RTP/complaints');
      setComplaints(r.data.complaints || []);
    } catch { flash('error', 'Failed to submit complaint'); }
  };

  const submitTraining = async () => {
    if (!trainingForm.title.trim()) { flash('error', 'Title is required'); return; }
    try {
      await api().post('/api/departments/RTP/trainings', trainingForm);
      flash('success', 'Training programme created');
      setShowTrainingForm(false);
      setTrainingForm({ title: '', description: '', target_audience: '', status: 'planned', start_date: '', end_date: '' });
      const r = await api().get('/api/departments/RTP/trainings');
      setTrainings(r.data.trainings || []);
    } catch { flash('error', 'Failed to create training'); }
  };

  const filteredProjects = projects.filter(p =>
    !projectSearch || p.title?.toLowerCase().includes(projectSearch.toLowerCase()) || p.innovator_name?.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const tabs = [
    { id: 'overview',   label: 'Overview',  icon: BarChart3 },
    { id: 'projects',   label: 'Projects',  icon: FolderKanban },
    { id: 'trainings',  label: 'Training',  icon: BookOpen },
    { id: 'complaints', label: 'Complaints',icon: MessageSquare },
  ];

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
    </div>
  );

  return (
    <main className="flex-1 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {viewingProject && (
        <MilestoneViewModal project={viewingProject} onClose={() => setViewingProject(null)} api={api} />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-6 md:px-10 py-6 flex items-center gap-6">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/30 bg-green-500 flex items-center justify-center">
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
          <p className="text-green-200 text-xs font-semibold uppercase tracking-widest mb-1">Department Workspace</p>
          <h1 className="text-2xl md:text-3xl font-bold">Department of Rural Technology Promotion</h1>
          <p className="text-green-100 text-sm mt-1">Welcome, {profile?.name} — RTP Director</p>
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
                  ${activeTab === tab.id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex justify-between">
            <span>{error}</span><button onClick={() => setError('')}><X className="w-4 h-4" /></button>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Projects', value: dashData.stats.totalProjects, color: 'border-green-500' },
                { label: 'Approved', value: dashData.stats.approvedProjects, color: 'border-teal-500' },
                { label: 'Open Complaints', value: dashData.stats.openComplaints, color: 'border-red-400' },
              ].map(s => (
                <div key={s.label} className={`bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border-l-4 ${s.color} text-center`}>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">RTP Department Functions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(dashData?.department?.functions || []).map((fn, i) => (
                  <div key={fn.id || i} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{fn.order_num || i + 1}</span>
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
            <input value={projectSearch} onChange={e => setProjectSearch(e.target.value)}
              placeholder="Search by title or innovator…"
              className="w-full mb-5 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-green-400 outline-none" />
            <div className="space-y-3">
              {filteredProjects.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border text-gray-400 dark:text-slate-400">No projects found</div>
              )}
              {filteredProjects.map(p => {
                const pct = Math.round(((p.completed_milestones || 0) / 9) * 100);
                return (
                  <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{p.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{p.innovator_name} · {p.category}</p>
                      </div>
                      <button onClick={() => setViewingProject(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex-shrink-0">
                        <Eye className="w-3.5 h-3.5" /> View Progress
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-slate-400">{p.completed_milestones || 0}/9</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TRAININGS ── */}
        {activeTab === 'trainings' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-700 dark:text-slate-200">Training Programmes <span className="text-gray-400 dark:text-slate-400 font-normal text-sm">({trainings.length})</span></h2>
              <button onClick={() => setShowTrainingForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold">
                <Plus className="w-4 h-4" /> Add Programme
              </button>
            </div>
            {showTrainingForm && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-green-200 p-6 mb-5">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">New Training Programme</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Title *</label>
                    <input value={trainingForm.title} onChange={e => setTrainingForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600-2 focus:ring-green-400 outline-none" placeholder="Programme title" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Target Audience</label>
                    <input value={trainingForm.target_audience} onChange={e => setTrainingForm(f => ({ ...f, target_audience: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600-2 focus:ring-green-400 outline-none" placeholder="e.g. Rural Innovators, Communities" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Status</label>
                    <select value={trainingForm.status} onChange={e => setTrainingForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600-2 focus:ring-green-400 outline-none">
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Start Date</label>
                    <input type="date" value={trainingForm.start_date} onChange={e => setTrainingForm(f => ({ ...f, start_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600-2 focus:ring-green-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">End Date</label>
                    <input type="date" value={trainingForm.end_date} onChange={e => setTrainingForm(f => ({ ...f, end_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600-2 focus:ring-green-400 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Description</label>
                    <textarea rows={3} value={trainingForm.description} onChange={e => setTrainingForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600-2 focus:ring-green-400 outline-none resize-none" placeholder="Programme description…" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={submitTraining} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold">Save</button>
                  <button onClick={() => setShowTrainingForm(false)} className="px-5 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-semibold">Cancel</button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {trainings.length === 0 && <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border text-gray-400 dark:text-slate-400">No training programmes yet</div>}
              {trainings.map(t => {
                const sc = { planned: 'bg-gray-100 text-gray-700', active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700', cancelled: 'bg-red-100 text-red-700' };
                return (
                  <div key={t.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{t.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sc[t.status] || 'bg-gray-100 text-gray-700'}`}>{t.status}</span>
                    </div>
                    {t.description && <p className="text-sm text-gray-500 dark:text-slate-400">{t.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400 dark:text-slate-400">
                      {t.target_audience && <span>Audience: {t.target_audience}</span>}
                      {t.start_date && <span>Start: {new Date(t.start_date).toLocaleDateString()}</span>}
                      {t.end_date && <span>End: {new Date(t.end_date).toLocaleDateString()}</span>}
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
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold">
                <Plus className="w-4 h-4" /> Submit Complaint
              </button>
            </div>
            {showComplaintForm && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-green-200 p-6 mb-5">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">New Complaint</h3>
                <div className="space-y-3">
                  <input value={complaintForm.subject} onChange={e => setComplaintForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600-2 focus:ring-green-400 outline-none" placeholder="Subject *" />
                  <textarea rows={4} value={complaintForm.description} onChange={e => setComplaintForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600-2 focus:ring-green-400 outline-none resize-none" placeholder="Describe the issue… *" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={submitComplaint} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold">Submit</button>
                  <button onClick={() => setShowComplaintForm(false)} className="px-5 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-semibold">Cancel</button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {complaints.length === 0 && <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border text-gray-400 dark:text-slate-400">No complaints filed</div>}
              {complaints.map(c => {
                const sc = { open: 'bg-red-100 text-red-700', in_review: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{c.subject}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sc[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status.replace('_', ' ')}</span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-400">By: {c.submitted_by_name} · {new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                      {(c.status === 'open' || c.status === 'in_review') && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => handleComplaintUpdate(c.id, { status: 'in_review' })}
                            className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-xs font-semibold">
                            <Clock className="w-3 h-3 inline mr-1" />In Review
                          </button>
                          <button onClick={() => { const r = window.prompt('Resolution:'); if (r) handleComplaintUpdate(c.id, { status: 'resolved', resolution: r }); }}
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

export default RTPWorkspace;
