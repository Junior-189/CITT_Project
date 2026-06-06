import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

const ProjectAssignments = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [assignForm, setAssignForm] = useState({});
  const [assigning, setAssigning] = useState(null);
  const [msg, setMsg] = useState('');

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

  const approved = projects.filter(p => p.approval_status === 'approved');
  const pending  = projects.filter(p => p.approval_status === 'pending');

  const filtered = approved.filter(p => {
    const q = search.toLowerCase();
    return !q || p.title?.toLowerCase().includes(q) || (p.innovator_name || p.user_name || '').toLowerCase().includes(q);
  });

  const mentors  = users.filter(u => u.role === 'mentor');
  const tcMembers = users.filter(u => u.role === 'technicalCommittee');
  const coordinators = users.filter(u => u.role === 'coordinator');

  const getUsersForType = (type) => {
    if (type === 'mentor') return mentors;
    if (type === 'technical_committee') return tcMembers;
    if (type === 'coordinator') return coordinators;
    return [];
  };

  const handleAssign = async (projectId) => {
    const form = assignForm[projectId] || {};
    if (!form.type) { setMsg('Please select an assignment type.'); return; }
    if (!form.userId) { setMsg('Please select a user.'); return; }
    setAssigning(projectId);
    setMsg('');
    try {
      const api = getAuthenticatedAxios();
      await api.post(`/api/projects/${projectId}/assign`, {
        assigned_user_id: parseInt(form.userId),
        assignment_type: form.type,
      });
      setMsg('Assigned successfully!');
      setAssignForm(f => ({ ...f, [projectId]: {} }));
      setExpanded(null);
      await fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Assignment failed.');
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Project Assignments</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Approved Projects', count: approved.length, color: 'border-green-500' },
            { label: 'Available Mentors', count: mentors.length, color: 'border-purple-500' },
            { label: 'TC Members', count: tcMembers.length, color: 'border-orange-500' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl p-4 border-l-4 ${s.color} shadow-sm text-center`}>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by project title or innovator name…"
            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white dark:bg-slate-800"
          />
        </div>

        {/* Approved Projects */}
        <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-teal-600" />
          Approved Projects — Ready to Assign
          <span className="text-sm font-normal text-gray-400">({filtered.length})</span>
        </h2>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : (
          <div className="space-y-3 mb-10">
            {filtered.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border text-gray-400">
                {search ? 'No projects match your search.' : 'No approved projects yet.'}
              </div>
            )}
            {filtered.map(p => {
              const isOpen = expanded === p.id;
              const form = assignForm[p.id] || {};
              const availableUsers = getUsersForType(form.type);
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{p.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {p.innovator_name || p.user_name || 'Unknown'} · {p.category}
                      </p>
                    </div>
                    <span className="hidden sm:inline px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Approved</span>
                    <button
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Assign {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-100 bg-teal-50 px-5 py-4">
                      <p className="text-sm font-semibold text-slate-700 mb-3">Assign to:</p>
                      <div className="flex flex-wrap gap-3 items-end">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Assignment Type</label>
                          <select
                            value={form.type || ''}
                            onChange={e => setAssignForm(f => ({ ...f, [p.id]: { type: e.target.value, userId: '' } }))}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white dark:bg-slate-800"
                          >
                            <option value="">Select type…</option>
                            <option value="mentor">Mentor</option>
                            <option value="technical_committee">Technical Committee</option>
                            <option value="coordinator">Coordinator</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {form.type === 'mentor' ? 'Mentor' : form.type === 'technical_committee' ? 'TC Member' : 'User'}
                          </label>
                          <select
                            value={form.userId || ''}
                            onChange={e => setAssignForm(f => ({ ...f, [p.id]: { ...f[p.id], userId: e.target.value } }))}
                            disabled={!form.type}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed min-w-[180px]"
                          >
                            <option value="">Select user…</option>
                            {availableUsers.map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                          </select>
                          {form.type && availableUsers.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">No {form.type.replace('_', ' ')} users available</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAssign(p.id)}
                          disabled={assigning === p.id || !form.type || !form.userId}
                          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          {assigning === p.id ? 'Assigning…' : 'Confirm'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pending Projects */}
        {pending.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
              Awaiting Approval Before Assignment
              <span className="text-sm font-normal text-gray-400">({pending.length})</span>
            </h2>
            <div className="space-y-2">
              {pending.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-yellow-200 px-5 py-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-700 truncate">{p.title}</h3>
                    <p className="text-xs text-gray-400">{p.innovator_name || p.user_name || 'Unknown'} · {p.category}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex-shrink-0">Pending Approval</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectAssignments;
