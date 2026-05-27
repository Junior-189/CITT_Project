import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Wrench, GitMerge, ArrowRight } from 'lucide-react';

const WORKSPACE_CARDS = [
  {
    role: 'mentor',
    title: 'Mentor',
    subtitle: 'Guide and support innovators through milestone stages',
    icon: Users,
    color: {
      bg: 'bg-teal-50', border: 'border-teal-200', icon: 'bg-teal-100 text-teal-600',
      btn: 'bg-teal-600 hover:bg-teal-700', badge: 'bg-teal-100 text-teal-800',
      ring: 'ring-teal-300', text: 'text-teal-600',
    },
    route: '/workspace/mentor',
    responsibilities: [
      'Guide assigned innovators through all milestone stages',
      'Review and approve or reject milestone submissions',
      'Provide feedback and comments on each stage',
      'Track innovator progress and report to DII Director',
      'Support innovators in preparing documentation and proofs',
    ],
  },
  {
    role: 'technicalCommittee',
    title: 'Technical Committee',
    subtitle: 'Evaluate and validate technical aspects of innovations',
    icon: Wrench,
    color: {
      bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600',
      btn: 'bg-blue-600 hover:bg-blue-700', badge: 'bg-blue-100 text-blue-800',
      ring: 'ring-blue-300', text: 'text-blue-600',
    },
    route: '/workspace/technical-committee',
    responsibilities: [
      'Conduct technical assessment of prototype and design stages',
      'Validate testing and validation results',
      'Review IP documentation and technical reports',
      'Provide technical evaluation and scoring',
      'Approve or reject technical milestone stages',
    ],
  },
  {
    role: 'coordinator',
    title: 'Coordinator',
    subtitle: 'Coordinate activities and ensure smooth project flow',
    icon: GitMerge,
    color: {
      bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-100 text-purple-600',
      btn: 'bg-purple-600 hover:bg-purple-700', badge: 'bg-purple-100 text-purple-800',
      ring: 'ring-purple-300', text: 'text-purple-600',
    },
    route: '/workspace/coordinator',
    responsibilities: [
      'Coordinate communication between innovators and mentors',
      'Monitor overall project progress across all stages',
      'Ensure timely submission of milestone documents',
      'Report project status to admin and directors',
      'Facilitate meetings and training sessions',
    ],
  },
];

const ADMIN_ROLES = ['admin', 'superAdmin', 'transferTechnologyOfficer', 'diiDirector'];

const WorkspacePortal = () => {
  const { profile, role, getAuthenticatedAxios } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (profile) fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    try {
      const api = getAuthenticatedAxios();
      const res = await api.get('/api/workspace/stats');
      setStats(res.data);
    } catch (e) { console.error('Stats error:', e); }
  };

  const isMyRole = (card) => profile && role === card.role;
  const canAccess = (card) => profile && (role === card.role || ADMIN_ROLES.includes(role));

  const handleCardClick = (card) => {
    if (canAccess(card)) {
      navigate(card.route);
    } else {
      setSelected(selected?.role === card.role ? null : card);
    }
  };

  return (
    <main className="flex-1 bg-gray-50 overflow-auto">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-800 via-teal-800 to-teal-700 text-white py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-teal-300 text-sm font-semibold uppercase tracking-widest mb-2">CITT</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Workspace Portal</h1>
          <p className="text-teal-100 text-lg max-w-2xl mx-auto">
            Select your workspace role to access your dedicated project management area.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">

        {/* Stats bar */}
        {stats && profile && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Assigned Projects', value: stats.assignedProjects, color: 'border-teal-500' },
              { label: 'Pending Reviews', value: stats.pendingReviews, color: 'border-yellow-400' },
              { label: 'Completed', value: stats.completedProjects, color: 'border-green-500' },
              { label: 'Notifications', value: stats.unreadNotifications, color: 'border-red-400' },
            ].map(s => (
              <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.color} text-center`}>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {WORKSPACE_CARDS.map(card => {
            const Icon = card.icon;
            const isMe = isMyRole(card);
            const canGo = canAccess(card);
            const c = card.color;
            return (
              <div
                key={card.role}
                onClick={() => handleCardClick(card)}
                className={`bg-white rounded-2xl p-8 shadow-sm border-2 cursor-pointer transition-all duration-200 flex flex-col items-center text-center hover:shadow-lg
                  ${selected?.role === card.role
                    ? `${c.border} ring-4 ${c.ring} shadow-md`
                    : isMe
                    ? `${c.border} shadow-md`
                    : 'border-gray-100 hover:border-gray-200'}
                  ${canGo ? 'hover:-translate-y-1' : ''}`}
              >
                <div className={`w-24 h-24 rounded-full ${c.icon} flex items-center justify-center mb-5`}>
                  <Icon className="w-12 h-12" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{card.title}</h3>
                <p className="text-sm text-slate-500 leading-snug max-w-[180px]">{card.subtitle}</p>
                {isMe && (
                  <span className={`mt-3 text-xs px-2.5 py-1 rounded-full font-semibold ${c.badge}`}>
                    Your Role
                  </span>
                )}
                {canGo && (
                  <div className={`mt-4 flex items-center gap-1 text-xs font-semibold ${c.text}`}>
                    Enter Workspace <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail panel when non-member clicks a card */}
        {selected && (
          <div className={`rounded-2xl border-2 p-6 md:p-8 mb-8 ${selected.color.bg} ${selected.color.border}`}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selected.title} Workspace</h2>
                <p className="text-slate-500 mt-1 text-sm">{selected.subtitle}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">Responsibilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selected.responsibilities.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <span className={`w-6 h-6 rounded-full ${selected.color.icon} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700">{r}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default WorkspacePortal;
