import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Clock, Send, Circle, ChevronDown, ChevronUp, X, Eye } from 'lucide-react';

const STAGE_NAMES = {
  1:'Idea Generation',2:'Concept Development',3:'Prototype Development',
  4:'Testing & Validation',5:'IP & Documentation',6:'Funding & Investment',
  7:'Deployment / Implementation',8:'Monitoring & Evaluation',9:'Scaling & Commercialization',
};

const STATUS_CFG = {
  pending:     { icon: Circle,      color: 'text-gray-400',   bg: 'bg-gray-100',  label: 'Pending' },
  in_progress: { icon: Clock,       color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'In Progress' },
  submitted:   { icon: Send,        color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'Submitted' },
  completed:   { icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50',  label: 'Completed' },
  rejected:    { icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-50',    label: 'Needs Revision' },
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
    if (action === 'reject' && !notes.trim()) { setMsg('Notes required for rejection.'); return; }
    setActing(`${stageNum}-${action}`);
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/projects/${project.id}/milestones/${stageNum}/${action}`, { notes: notes || 'Approved by TC' });
      setMsg(action === 'approve' ? `Stage ${stageNum} approved!` : `Stage ${stageNum} sent back for revision.`);
      await fetchMilestones();
    } catch (e) { setMsg(e.response?.data?.error || 'Action failed.'); }
    finally { setActing(null); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-auto p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">{project.title}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">{project.innovator_name || 'Innovator'} · {completedCount}/9 stages completed</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-3 border-b">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.round(completedCount/9*100)}%` }} />
          </div>
        </div>
        {msg && (
          <div className="mx-6 mt-3 p-2 bg-blue-50 text-blue-700 text-sm rounded">
            {msg} <button className="ml-2 underline text-xs" onClick={() => setMsg('')}>Dismiss</button>
          </div>
        )}
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
                <button className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-50 dark:bg-slate-900"
                  onClick={() => setExpanded(isOpen ? null : stageNum)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-400">Stage {stageNum}</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{name}</p>
                  </div>
                  <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 bg-gray-50 border-t">
                    {record?.submission_notes && (
                      <div className="mt-3 p-3 bg-white border rounded-lg text-sm">
                        <p className="font-semibold text-gray-700 mb-1">Innovator's notes:</p>
                        <p className="text-gray-600 dark:text-slate-400">{record.submission_notes}</p>
                      </div>
                    )}
                    {status === 'submitted' && (
                      <div className="mt-3 space-y-2">
                        <textarea rows={2} value={reviewNotes[stageNum] || ''} placeholder="Review notes (required for revision request)..."
                          onChange={e => setReviewNotes(n => ({ ...n, [stageNum]: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none" />
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(stageNum, 'approve')} disabled={!!acting}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {acting === `${stageNum}-approve` ? 'Approving…' : 'Approve'}
                          </button>
                          <button onClick={() => handleAction(stageNum, 'reject')} disabled={!!acting}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                            <XCircle className="w-3.5 h-3.5" />
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

const TechnicalCommitteeDashboard = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewProject, setReviewProject] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const api = getAuthenticatedAxios();
        const res = await api.get('/api/projects/tc/projects');
        setProjects(res.data.projects || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const pendingReview = projects.filter(p => (p.submitted_milestones || 0) > 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {reviewProject && (
        <ReviewMilestoneModal project={reviewProject} onClose={() => setReviewProject(null)} getAuthenticatedAxios={getAuthenticatedAxios} />
      )}
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Technical Committee Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Assigned Projects', count: projects.length, color: 'border-orange-500' },
            { label: 'Awaiting Review', count: pendingReview.length, color: 'border-blue-500' },
            { label: 'Milestones Submitted', count: projects.reduce((acc, p) => acc + (p.submitted_milestones || 0), 0), color: 'border-yellow-400' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl p-4 border-l-4 ${s.color} shadow-sm text-center`}>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-slate-700 mb-4">Assigned Projects</h2>
        {loading ? <div className="text-center py-12 text-gray-400">Loading…</div> : (
          <div className="space-y-3">
            {projects.length === 0 && <div className="text-center py-12 bg-white rounded-xl border text-gray-400">No projects assigned yet</div>}
            {projects.map(p => {
              const pct = Math.round(((p.completed_milestones || 0) / 9) * 100);
              const hasSubmitted = (p.submitted_milestones || 0) > 0;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800 truncate">{p.title}</h3>
                        {hasSubmitted && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            {p.submitted_milestones} awaiting review
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{p.innovator_name || 'Unknown'} · {p.category}</p>
                    </div>
                    <button onClick={() => setReviewProject(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold">
                      <Eye className="w-3.5 h-3.5" /> Review
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{p.completed_milestones || 0}/9</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicalCommitteeDashboard;
