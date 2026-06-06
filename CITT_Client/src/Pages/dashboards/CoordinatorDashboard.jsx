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

const ReadOnlyMilestoneModal = ({ project, onClose, getAuthenticatedAxios }) => {
  const [milestones, setMilestones] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const api = getAuthenticatedAxios();
        const res = await api.get(`/api/projects/${project.id}/milestones`);
        setMilestones(res.data.milestones || []);
      } catch (e) { console.error(e); }
    };
    fetch();
  }, [project.id]);

  const completedCount = milestones.filter(m => m.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-auto p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-bold text-lg">{project.title}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">{project.innovator_name || 'Innovator'} · {completedCount}/9 completed</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-3 border-b">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span><span>{Math.round(completedCount/9*100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${Math.round(completedCount/9*100)}%` }} />
          </div>
        </div>
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-400">Stage {stageNum}</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {isOpen && record?.submission_notes && (
                  <div className="px-6 pb-4 bg-gray-50 border-t text-sm text-gray-600 dark:text-slate-400">
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

const FILTERS = ['all','pending','approved','in_progress','completed'];

const CoordinatorDashboard = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewProject, setViewProject] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const api = getAuthenticatedAxios();
        const res = await api.get('/api/projects/coordinator/projects');
        setProjects(res.data.projects || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = projects.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'pending') return p.approval_status === 'pending';
    if (filter === 'approved') return p.approval_status === 'approved';
    if (filter === 'in_progress') return p.project_status === 'on_progress';
    if (filter === 'completed') return p.project_status === 'completed';
    return true;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {viewProject && (
        <ReadOnlyMilestoneModal project={viewProject} onClose={() => setViewProject(null)} getAuthenticatedAxios={getAuthenticatedAxios} />
      )}
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Coordinator Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Projects', count: projects.length, color: 'border-pink-500' },
            { label: 'Pending', count: projects.filter(p => p.approval_status === 'pending').length, color: 'border-yellow-400' },
            { label: 'Approved', count: projects.filter(p => p.approval_status === 'approved').length, color: 'border-green-500' },
            { label: 'Completed', count: projects.filter(p => p.project_status === 'completed').length, color: 'border-purple-500' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl p-4 border-l-4 ${s.color} shadow-sm text-center`}>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Filter:</span>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-pink-400 outline-none">
            {FILTERS.map(f => <option key={f} value={f}>{f === 'all' ? 'All Projects' : f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <span className="text-xs text-gray-400">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? <div className="text-center py-12 text-gray-400">Loading…</div> : (
          <div className="space-y-3">
            {filtered.length === 0 && <div className="text-center py-12 bg-white rounded-xl border text-gray-400">No projects match the filter</div>}
            {filtered.map(p => {
              const pct = Math.round(((p.completed_milestones || 0) / 9) * 100);
              const badgeClass = p.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                p.approval_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800 truncate">{p.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>{p.approval_status}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{p.innovator_name || 'Unknown'} · {p.category}</p>
                    </div>
                    <button onClick={() => setViewProject(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-semibold">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </div>
                  {p.approval_status === 'approved' && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">{p.completed_milestones || 0}/9</span>
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

export default CoordinatorDashboard;
