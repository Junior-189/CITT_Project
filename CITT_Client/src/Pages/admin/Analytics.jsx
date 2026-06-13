import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0891b2', '#d97706', '#7c3aed', '#059669', '#db2777', '#2563eb'];
const STATUS_COLORS = { pending: '#d97706', approved: '#059669', rejected: '#dc2626', completed: '#7c3aed' };

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className || ''}`} />
);

const Analytics = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('6m');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const months = period === '3m' ? 3 : period === '12m' ? 12 : 6;
      const [dashRes, trendsRes] = await Promise.all([
        api.get('/api/analytics/dashboard'),
        api.get(`/api/analytics/monthly-trends?months=${months}`),
      ]);
      setDashboardData(dashRes.data);
      setTrends((trendsRes.data || []).reverse());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedAxios, period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const formatCurrency = (amount) => {
    if (!amount) return '0 TZS';
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M TZS`;
    return `${Number(amount).toLocaleString()} TZS`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8"><Skeleton className="h-10 w-64" /><Skeleton className="h-5 w-80 mt-2" /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-12 mt-2" /><Skeleton className="h-3 w-24 mt-2" /></div>)}
          </div>
          <Skeleton className="h-80 w-full mb-8 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Skeleton className="h-72 rounded-xl" /><Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 p-4 rounded">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button onClick={fetchAll} className="text-sm text-red-600 hover:text-red-800 underline">Retry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { users, projects, funding, ipManagement, events } = dashboardData || {};
  const hasData = users?.total_users > 0 || projects?.total_projects > 0;

  if (!hasData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-16">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">No Analytics Data Yet</h2>
          <p className="text-gray-500 dark:text-slate-400">Analytics will appear once users, projects, and activities are recorded in the system.</p>
        </div>
      </div>
    );
  }

  const overviewCards = [
    { label: 'Total Users', value: users?.total_users || 0, sub: `+${users?.new_this_month || 0} this month` },
    { label: 'Total Projects', value: projects?.total_projects || 0, sub: `${projects?.pending_approval || 0} pending` },
    { label: 'Total Funding', value: formatCurrency(funding?.total_amount_requested), sub: `${formatCurrency(funding?.total_amount_approved)} approved` },
    { label: 'Events', value: events?.total_events || 0, sub: `${events?.upcoming_events || 0} upcoming` },
  ];

  const usersByRole = [
    { name: 'Innovators', value: users?.innovators || 0 },
    { name: 'IP Managers', value: users?.ip_managers || 0 },
    { name: 'Admins', value: users?.admins || 0 },
    { name: 'Super Admins', value: users?.super_admins || 0 },
  ];

  const projectStatusData = [
    { name: 'Pending', value: projects?.pending_approval || 0 },
    { name: 'Approved', value: projects?.approved || 0 },
    { name: 'Rejected', value: projects?.rejected || 0 },
    { name: 'Completed', value: projects?.completed || 0 },
  ];

  const fundingStatusData = [
    { name: 'Pending', value: funding?.pending_approval || 0 },
    { name: 'Approved', value: funding?.approved || 0 },
    { name: 'Disbursed', value: funding?.disbursed || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">System Analytics</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">Real-time system metrics and insights</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="mt-3 sm:mt-0 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="12m">Last 12 months</option>
          </select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {overviewCards.map((card, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500 dark:text-slate-400">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-1">{card.value}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Monthly Trends Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Monthly Trends</h2>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="projects" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} name="Projects" />
                <Line type="monotone" dataKey="funding_applications" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} name="Funding" />
                <Line type="monotone" dataKey="ip_records" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} name="IP Records" />
                <Line type="monotone" dataKey="new_users" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 dark:text-slate-500 text-center py-16">No trend data available</p>
          )}
        </div>

        {/* Users by Role + Projects by Status - side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Users by Role */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Users by Role</h2>
            {usersByRole.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={usersByRole} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {usersByRole.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 dark:text-slate-500 text-center py-16">No user data</p>
            )}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {usersByRole.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </div>

          {/* Projects by Status */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Projects by Status</h2>
            {projectStatusData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={projectStatusData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>{projectStatusData.map((d, i) => <Cell key={i} fill={STATUS_COLORS[d.name.toLowerCase()] || COLORS[i % COLORS.length]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 dark:text-slate-500 text-center py-16">No project data</p>
            )}
          </div>
        </div>

        {/* Funding + IP + Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Funding */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Funding</h2>
            <div className="space-y-3">
              {[
                { l: 'Total Applications', v: funding?.total_applications || 0 },
                { l: 'Pending', v: funding?.pending_approval || 0 },
                { l: 'Approved', v: funding?.approved || 0 },
                { l: 'Disbursed', v: funding?.disbursed || 0 },
              ].map((r, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-slate-400">{r.l}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{r.v}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 dark:border-slate-700 pt-3 mt-3">
                <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">Requested</span><span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{formatCurrency(funding?.total_amount_requested)}</span></div>
                <div className="flex justify-between mt-1"><span className="text-sm text-gray-500 dark:text-slate-400">Approved</span><span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{formatCurrency(funding?.total_amount_approved)}</span></div>
              </div>
            </div>
          </div>

          {/* IP Management */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">IP Management</h2>
            <div className="space-y-3">
              {[
                { l: 'Total Records', v: ipManagement?.total_ip_records || 0 },
                { l: 'Pending', v: ipManagement?.pending_approval || 0 },
                { l: 'Approved', v: ipManagement?.approved || 0 },
                { l: 'Rejected', v: ipManagement?.rejected || 0 },
              ].map((r, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-slate-400">{r.l}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Events */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Events</h2>
            <div className="space-y-3">
              {[
                { l: 'Total Events', v: events?.total_events || 0 },
                { l: 'Upcoming', v: events?.upcoming_events || 0 },
                { l: 'Past', v: events?.past_events || 0 },
              ].map((r, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-slate-400">{r.l}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
