import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    total: 0,
    byType: { Patent: 0, Trademark: 0, Copyright: 0, Design: 0, Other: 0 },
    byStatus: { pending: 0, approved: 0, rejected: 0 },
    monthlyTrends: [],
    approvalRate: 0,
    avgProcessingTime: 0
  });

  const { getAuthenticatedAxios } = useAuth();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const res = await api.get('/api/ipmanager/statistics');

      const byType = { Patent: 0, Trademark: 0, Copyright: 0, Design: 0, Other: 0 };
      (res.data.byType || []).forEach(r => {
        const key = r.ip_type || 'Other';
        if (byType[key] !== undefined) {
          byType[key] = parseInt(r.count);
        } else {
          byType.Other += parseInt(r.count);
        }
      });

      const byStatus = { pending: 0, approved: 0, rejected: 0 };
      (res.data.byStatus || []).forEach(r => {
        const key = (r.approval_status || 'pending').toLowerCase();
        if (byStatus[key] !== undefined) {
          byStatus[key] = parseInt(r.count);
        }
      });

      const monthlyTrends = (res.data.monthlyTrend || [])
        .map(r => ({ month: r.month, count: parseInt(r.count) }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const total = byStatus.pending + byStatus.approved + byStatus.rejected;
      const totalProcessed = byStatus.approved + byStatus.rejected;
      const approvalRate = totalProcessed > 0 ? ((byStatus.approved / totalProcessed) * 100).toFixed(1) : 0;

      setAnalyticsData({ total, byType, byStatus, monthlyTrends, approvalRate, avgProcessingTime: 0 });
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to fetch analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (count, total) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
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

  const maxMonthlyCount = Math.max(...analyticsData.monthlyTrends.map(m => m.count), 1);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">IP Management Analytics</h1>
          <p className="text-gray-600 mt-2">Detailed analytics and visualizations for IP activities</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total IP Records</p>
                <p className="text-3xl font-bold mt-2">{analyticsData.total}</p>
                <p className="text-green-100 text-xs mt-1">All IP applications</p>
              </div>
              <svg className="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Approval Rate</p>
                <p className="text-3xl font-bold mt-2">{analyticsData.approvalRate}%</p>
                <p className="text-green-100 text-xs mt-1">Success percentage</p>
              </div>
              <svg className="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Processed</p>
                <p className="text-3xl font-bold mt-2">{analyticsData.byStatus.approved + analyticsData.byStatus.rejected}</p>
                <p className="text-green-100 text-xs mt-1">Reviewed applications</p>
              </div>
              <svg className="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Pending Review</p>
                <p className="text-3xl font-bold mt-2">{analyticsData.byStatus.pending}</p>
                <p className="text-green-100 text-xs mt-1">Awaiting action</p>
              </div>
              <svg className="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* IP Type Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">IP Type Distribution</h2>
            <div className="space-y-4">
              {[
                { label: 'Patents', key: 'Patent', color: 'purple', icon: '📜' },
                { label: 'Trademarks', key: 'Trademark', color: 'orange', icon: '🏷️' },
                { label: 'Copyrights', key: 'Copyright', color: 'blue', icon: '📚' },
                { label: 'Designs', key: 'Design', color: 'teal', icon: '🎨' },
                { label: 'Other', key: 'Other', color: 'gray', icon: '📋' },
              ].map(({ label, key, color, icon }) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                      <span className="mr-2">{icon}</span> {label}
                    </span>
                    <span className={`text-sm font-bold text-${color}-600`}>
                      {analyticsData.byType[key]} ({getPercentage(analyticsData.byType[key], analyticsData.total)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`bg-${color}-600 h-4 rounded-full transition-all duration-500`}
                      style={{ width: `${getPercentage(analyticsData.byType[key], analyticsData.total)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pie Chart Visual */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-center items-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#9333ea" strokeWidth="20"
                      strokeDasharray={`${getPercentage(analyticsData.byType.Patent, analyticsData.total) * 2.51} 251`} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ea580c" strokeWidth="20"
                      strokeDasharray={`${getPercentage(analyticsData.byType.Trademark, analyticsData.total) * 2.51} 251`}
                      strokeDashoffset={`-${getPercentage(analyticsData.byType.Patent, analyticsData.total) * 2.51}`} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="20"
                      strokeDasharray={`${getPercentage(analyticsData.byType.Copyright, analyticsData.total) * 2.51} 251`}
                      strokeDashoffset={`-${(parseFloat(getPercentage(analyticsData.byType.Patent, analyticsData.total)) + parseFloat(getPercentage(analyticsData.byType.Trademark, analyticsData.total))) * 2.51}`} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#0d9488" strokeWidth="20"
                      strokeDasharray={`${getPercentage(analyticsData.byType.Design, analyticsData.total) * 2.51} 251`}
                      strokeDashoffset={`-${(parseFloat(getPercentage(analyticsData.byType.Patent, analyticsData.total)) + parseFloat(getPercentage(analyticsData.byType.Trademark, analyticsData.total)) + parseFloat(getPercentage(analyticsData.byType.Copyright, analyticsData.total))) * 2.51}`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.total}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Status Distribution</h2>
            <div className="space-y-4">
              {[
                { label: 'Pending', key: 'pending', barColor: 'bg-yellow-500', textColor: 'text-yellow-600', icon: '⏳' },
                { label: 'Approved', key: 'approved', barColor: 'bg-green-600', textColor: 'text-green-600', icon: '✅' },
                { label: 'Rejected', key: 'rejected', barColor: 'bg-red-600', textColor: 'text-red-600', icon: '❌' },
              ].map(({ label, key, barColor, textColor, icon }) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                      <span className="mr-2">{icon}</span> {label}
                    </span>
                    <span className={`text-sm font-bold ${textColor}`}>
                      {analyticsData.byStatus[key]} ({getPercentage(analyticsData.byStatus[key], analyticsData.total)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`${barColor} h-4 rounded-full transition-all duration-500`}
                      style={{ width: `${getPercentage(analyticsData.byStatus[key], analyticsData.total)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pie Chart Visual */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-center items-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#eab308" strokeWidth="20"
                      strokeDasharray={`${getPercentage(analyticsData.byStatus.pending, analyticsData.total) * 2.51} 251`} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#16a34a" strokeWidth="20"
                      strokeDasharray={`${getPercentage(analyticsData.byStatus.approved, analyticsData.total) * 2.51} 251`}
                      strokeDashoffset={`-${getPercentage(analyticsData.byStatus.pending, analyticsData.total) * 2.51}`} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#dc2626" strokeWidth="20"
                      strokeDasharray={`${getPercentage(analyticsData.byStatus.rejected, analyticsData.total) * 2.51} 251`}
                      strokeDashoffset={`-${(parseFloat(getPercentage(analyticsData.byStatus.pending, analyticsData.total)) + parseFloat(getPercentage(analyticsData.byStatus.approved, analyticsData.total))) * 2.51}`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.total}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Trends (Last 6 Months)</h2>
          <div className="space-y-4">
            {analyticsData.monthlyTrends.length > 0 ? (
              analyticsData.monthlyTrends.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(item.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </span>
                    <span className="text-sm font-bold text-teal-600">{item.count} submissions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-teal-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(item.count / maxMonthlyCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No monthly trend data available</p>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">Total Processed</p>
              <p className="text-4xl font-bold text-gray-900">{analyticsData.byStatus.approved + analyticsData.byStatus.rejected}</p>
              <p className="text-xs text-gray-500 mt-1">Approved + Rejected</p>
            </div>
            <div className="text-center border-l border-r border-gray-200">
              <p className="text-gray-600 text-sm mb-2">Success Rate</p>
              <p className="text-4xl font-bold text-green-600">{analyticsData.approvalRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Approval percentage</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">Pending Queue</p>
              <p className="text-4xl font-bold text-yellow-600">{analyticsData.byStatus.pending}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
