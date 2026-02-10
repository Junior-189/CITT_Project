import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    byType: { Patent: 0, Trademark: 0, Copyright: 0, Design: 0, Other: 0 },
    byStatus: { pending: 0, approved: 0, rejected: 0 },
    monthlyTrend: [],
    approvalRate: 0,
    avgProcessingTime: 0
  });

  const { getAuthenticatedAxios } = useAuth();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
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

      const monthlyTrend = (res.data.monthlyTrend || [])
        .map(r => ({ month: r.month, count: parseInt(r.count) }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const total = byStatus.pending + byStatus.approved + byStatus.rejected;
      const totalProcessed = byStatus.approved + byStatus.rejected;
      const approvalRate = totalProcessed > 0 ? ((byStatus.approved / totalProcessed) * 100).toFixed(1) : 0;

      setStats({ total, byType, byStatus, monthlyTrend, approvalRate, avgProcessingTime: 0 });
      setError(null);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to fetch statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
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
              <button onClick={fetchStatistics} className="text-sm text-red-600 hover:text-red-800 underline">Retry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">IP Management Statistics</h1>
          <p className="text-gray-600 mt-2">Comprehensive overview of intellectual property records</p>
        </div>

        {/* Overall Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total IP Records</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Approval Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.approvalRate}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Processed</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.byStatus.approved + stats.byStatus.rejected}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.byStatus.pending}</p>
            </div>
          </div>
        </div>

        {/* IP Type Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">By IP Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Patents</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.byType.Patent}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Trademarks</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.byType.Trademark}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Copyrights</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.byType.Copyright}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Designs</p>
                  <p className="text-3xl font-bold text-teal-600 mt-2">{stats.byType.Design}</p>
                </div>
                <div className="p-3 bg-teal-100 rounded-lg">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Other</p>
                  <p className="text-3xl font-bold text-gray-600 mt-2">{stats.byType.Other}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">By Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.byStatus.pending}</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${stats.total > 0 ? (stats.byStatus.pending / stats.total) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.byStatus.approved}</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.total > 0 ? (stats.byStatus.approved / stats.total) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.byStatus.rejected}</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: `${stats.total > 0 ? (stats.byStatus.rejected / stats.total) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        {stats.monthlyTrend.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Trend (Last 6 Months)</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                {stats.monthlyTrend.map((item, index) => {
                  const maxCount = Math.max(...stats.monthlyTrend.map(m => m.count), 1);
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {new Date(item.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </span>
                        <span className="text-sm font-bold text-teal-600">{item.count} submissions</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-teal-600 h-3 rounded-full transition-all duration-500" style={{ width: `${(item.count / maxCount) * 100}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-2">Total Processed</p>
                <p className="text-4xl font-bold text-gray-900">{stats.byStatus.approved + stats.byStatus.rejected}</p>
                <p className="text-xs text-gray-500 mt-1">Approved + Rejected</p>
              </div>
              <div className="text-center border-l border-r border-gray-200">
                <p className="text-gray-600 text-sm mb-2">Success Rate</p>
                <p className="text-4xl font-bold text-green-600">{stats.approvalRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Approval percentage</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-2">Pending Queue</p>
                <p className="text-4xl font-bold text-yellow-600">{stats.byStatus.pending}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
