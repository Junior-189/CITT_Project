import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TYPE_COLORS = { Patent: '#7c3aed', Trademark: '#d97706', Copyright: '#2563eb', Design: '#0d9488', Other: '#6b7280' };
const STATUS_COLORS = { pending: '#d97706', approved: '#059669', rejected: '#dc2626' };

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className || ''}`} />
);

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    total: 0,
    byType: { Patent: 0, Trademark: 0, Copyright: 0, Design: 0, Other: 0 },
    byStatus: { pending: 0, approved: 0, rejected: 0 },
    monthlyTrends: [],
    approvalRate: 0,
  });

  const { getAuthenticatedAxios } = useAuth();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const res = await api.get('/api/ipmanager/statistics');

      const byType = { Patent: 0, Trademark: 0, Copyright: 0, Design: 0, Other: 0 };
      (res.data.byType || []).forEach(r => {
        const key = r.ip_type || 'Other';
        if (byType[key] !== undefined) { byType[key] = parseInt(r.count); } else { byType.Other += parseInt(r.count); }
      });

      const byStatus = { pending: 0, approved: 0, rejected: 0 };
      (res.data.byStatus || []).forEach(r => {
        const key = (r.approval_status || 'pending').toLowerCase();
        if (byStatus[key] !== undefined) byStatus[key] = parseInt(r.count);
      });

      const monthlyTrends = (res.data.monthlyTrend || [])
        .map(r => ({ month: r.month, count: parseInt(r.count) }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const total = byStatus.pending + byStatus.approved + byStatus.rejected;
      const totalProcessed = byStatus.approved + byStatus.rejected;
      const approvalRate = totalProcessed > 0 ? parseFloat(((byStatus.approved / totalProcessed) * 100).toFixed(1)) : 0;

      setAnalyticsData({ total, byType, byStatus, monthlyTrends, approvalRate });
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to fetch analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedAxios]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8"><Skeleton className="h-10 w-72" /><Skeleton className="h-5 w-96 mt-2" /></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6"><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-12 mt-2" /><Skeleton className="h-3 w-24 mt-2" /></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Skeleton className="h-80 rounded-lg" /><Skeleton className="h-80 rounded-lg" />
          </div>
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={fetchAnalytics} className="text-sm text-red-600 hover:text-red-800 underline">Retry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (analyticsData.total === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-16">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">No IP Analytics Yet</h2>
          <p className="text-gray-500 dark:text-slate-400">Analytics will appear once IP records are submitted and processed.</p>
        </div>
      </div>
    );
  }

  const typePieData = Object.entries(analyticsData.byType)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const statusPieData = Object.entries(analyticsData.byStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  const totalProcessed = analyticsData.byStatus.approved + analyticsData.byStatus.rejected;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">IP Management Analytics</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2">Detailed analytics and visualizations for IP activities</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total IP Records', value: analyticsData.total, sub: 'All IP applications' },
            { label: 'Approval Rate', value: `${analyticsData.approvalRate}%`, sub: 'Success percentage' },
            { label: 'Total Processed', value: totalProcessed, sub: 'Reviewed applications' },
            { label: 'Pending Review', value: analyticsData.byStatus.pending, sub: 'Awaiting action' },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-500 dark:text-slate-400">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{card.value}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* IP Type Distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">IP Type Distribution</h2>
            {typePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={typePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {typePieData.map((d) => <Cell key={d.name} fill={TYPE_COLORS[d.name] || '#6b7280'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 dark:text-slate-500 text-center py-16">No type data</p>
            )}
          </div>

          {/* Status Distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Status Distribution</h2>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusPieData.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name.toLowerCase()] || '#6b7280'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 dark:text-slate-500 text-center py-16">No status data</p>
            )}
          </div>
        </div>

        {/* Monthly Trends Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Monthly Trends</h2>
          {analyticsData.monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.monthlyTrends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(m) => {
                    const d = new Date(m + '-01');
                    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  labelFormatter={(m) => new Date(m + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  formatter={(value) => [`${value} submissions`, 'Count']}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 dark:text-slate-500 text-center py-16">No monthly trend data available</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Analytics;
