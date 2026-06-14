import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const safeDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString();
};

const IPManagerDashboard = () => {
  const { profile, role, getAuthenticatedAxios } = useAuth();
  const [stats, setStats] = useState({ total_records: 0, pending: 0, approved: 0, rejected: 0 });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const api = getAuthenticatedAxios();
      const res = await api.get('/api/ipmanager/dashboard');
      setStats(res.data.stats || { total_records: 0, pending: 0, approved: 0, rejected: 0 });
      setRecentSubmissions(res.data.recentSubmissions || []);
    } catch (err) {
      setError('Failed to load dashboard. Please try again.');
      console.error('Failed to fetch IP manager dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedAxios]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button onClick={fetchDashboard} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total IP Records', value: stats.total_records || 0, iconBg: 'bg-orange-100 dark:bg-orange-500/20', iconColor: 'text-orange-600 dark:text-orange-400', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { label: 'Pending Approval', value: stats.pending || 0, iconBg: 'bg-yellow-100 dark:bg-yellow-500/20', iconColor: 'text-yellow-600 dark:text-yellow-400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Approved', value: stats.approved || 0, iconBg: 'bg-green-100 dark:bg-green-500/20', iconColor: 'text-green-600 dark:text-green-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Rejected', value: stats.rejected || 0, iconBg: 'bg-red-100 dark:bg-red-500/20', iconColor: 'text-red-600 dark:text-red-400', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const linkCards = [
    { to: '/ipmanager/records', label: 'IP Records', desc: 'View and manage all IP records', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-orange-600 dark:text-orange-400' },
    { to: '/ipmanager/pending', label: 'Pending Approvals', desc: 'Review and approve IP applications', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'text-orange-600 dark:text-orange-400' },
    { to: '/ipmanager/analytics', label: 'Analytics', desc: 'View IP statistics and charts', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-orange-600 dark:text-orange-400' },
    { to: '/ipmanager/submitted-ips', label: 'Submitted IPs', desc: 'Review all IPs submitted by innovators', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'text-orange-600 dark:text-orange-400' },
    { to: '/ipmanager/submitted-projects', label: 'Submitted Projects', desc: 'Review all projects submitted by innovators', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-orange-600 dark:text-orange-400' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-slate-800 to-teal-700 rounded-lg shadow-md p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">IP Manager Dashboard</h1>
              <p className="mt-2 opacity-90">Welcome back, {profile?.name || 'IP Manager'}!</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                {role}
              </span>
              <p className="text-sm opacity-80 mt-1">{profile?.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statCards.map(card => (
            <div key={card.label} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.iconBg}`}>
                  <svg className={`w-8 h-8 ${card.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 dark:text-slate-400 text-sm">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {linkCards.map(card => (
            <Link
              key={card.to}
              to={card.to}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{card.label}</h3>
                <svg className={`w-6 h-6 ${card.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-slate-400 text-sm">{card.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Recent Submissions</h2>
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">No recent submissions</p>
            ) : (
              <ul className="space-y-3">
                {recentSubmissions.map((s) => (
                  <li key={s.id} className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{s.title || s.ip_title || 'Untitled'}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{s.user_name || s.submitter || ''} — {safeDate(s.created_at)}</p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' : s.approval_status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'}`}>
                        {s.approval_status || s.status || 'pending'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 bg-teal-50 dark:bg-teal-500/10 border-l-4 border-teal-600 dark:border-teal-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-teal-600 dark:text-teal-300">
                <strong>IP Manager Dashboard:</strong> You have full access to manage Intellectual Property records, approvals, and analytics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPManagerDashboard;
