import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Analytics = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const response = await api.get('/api/superadmin/analytics');
      setAnalyticsData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics data');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto"></div>
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
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { users, projects, funding, overview } = analyticsData || {};

  // Calculate percentages for bar charts
  const getUserRolePercentage = (count, total) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  };

  const getProjectStatusPercentage = (count, total) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive analytics and visualizations</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-600">
            SuperAdmin & Admin Only
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Users</p>
                <p className="text-3xl font-bold mt-2">{users?.total || 0}</p>
                <p className="text-purple-100 text-xs mt-1">All registered users</p>
              </div>
              <svg className="w-12 h-12 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Projects</p>
                <p className="text-3xl font-bold mt-2">{projects?.total || 0}</p>
                <p className="text-blue-100 text-xs mt-1">Innovation projects</p>
              </div>
              <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Funding Apps</p>
                <p className="text-3xl font-bold mt-2">{funding?.total || 0}</p>
                <p className="text-green-100 text-xs mt-1">Funding applications</p>
              </div>
              <svg className="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Total Funding</p>
                <p className="text-3xl font-bold mt-2">
                  {funding?.total_amount ? `${(funding.total_amount / 1000000).toFixed(1)}M` : '0'}
                </p>
                <p className="text-orange-100 text-xs mt-1">TZS requested</p>
              </div>
              <svg className="w-12 h-12 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Roles Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">User Distribution by Role</h2>
            <div className="space-y-4">
              {/* Super Admin Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Super Admins
                  </span>
                  <span className="text-sm font-bold text-purple-600">
                    {users?.super_admins || 0} ({getUserRolePercentage(users?.super_admins, users?.total)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-purple-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${getUserRolePercentage(users?.super_admins, users?.total)}%` }}
                  ></div>
                </div>
              </div>

              {/* Admin Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Admins
                  </span>
                  <span className="text-sm font-bold text-teal-600">
                    {users?.admins || 0} ({getUserRolePercentage(users?.admins, users?.total)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-teal-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${getUserRolePercentage(users?.admins, users?.total)}%` }}
                  ></div>
                </div>
              </div>

              {/* IP Manager Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    IP Managers
                  </span>
                  <span className="text-sm font-bold text-orange-600">
                    {users?.ip_managers || 0} ({getUserRolePercentage(users?.ip_managers, users?.total)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-orange-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${getUserRolePercentage(users?.ip_managers, users?.total)}%` }}
                  ></div>
                </div>
              </div>

              {/* Innovators Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Innovators
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {users?.innovators || 0} ({getUserRolePercentage(users?.innovators, users?.total)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${getUserRolePercentage(users?.innovators, users?.total)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Pie Chart Visual Representation */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-center items-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {/* Super Admins - Purple */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#9333ea"
                      strokeWidth="20"
                      strokeDasharray={`${getUserRolePercentage(users?.super_admins, users?.total) * 2.51} 251`}
                      strokeDashoffset="0"
                    />
                    {/* Admins - Teal */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="20"
                      strokeDasharray={`${getUserRolePercentage(users?.admins, users?.total) * 2.51} 251`}
                      strokeDashoffset={`-${getUserRolePercentage(users?.super_admins, users?.total) * 2.51}`}
                    />
                    {/* IP Managers - Orange */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#ea580c"
                      strokeWidth="20"
                      strokeDasharray={`${getUserRolePercentage(users?.ip_managers, users?.total) * 2.51} 251`}
                      strokeDashoffset={`-${(getUserRolePercentage(users?.super_admins, users?.total) + getUserRolePercentage(users?.admins, users?.total)) * 2.51}`}
                    />
                    {/* Innovators - Blue */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="20"
                      strokeDasharray={`${getUserRolePercentage(users?.innovators, users?.total) * 2.51} 251`}
                      strokeDashoffset={`-${(getUserRolePercentage(users?.super_admins, users?.total) + getUserRolePercentage(users?.admins, users?.total) + getUserRolePercentage(users?.ip_managers, users?.total)) * 2.51}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{users?.total || 0}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Status Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Status Distribution</h2>
            <div className="space-y-4">
              {/* Pending Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="mr-2">⏳</span> Pending
                  </span>
                  <span className="text-sm font-bold text-yellow-600">
                    {projects?.pending || 0} ({getProjectStatusPercentage(projects?.pending, projects?.total)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-yellow-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${getProjectStatusPercentage(projects?.pending, projects?.total)}%` }}
                  ></div>
                </div>
              </div>

              {/* Approved Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="mr-2">✅</span> Approved
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    {projects?.approved || 0} ({getProjectStatusPercentage(projects?.approved, projects?.total)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${getProjectStatusPercentage(projects?.approved, projects?.total)}%` }}
                  ></div>
                </div>
              </div>

              {/* In Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="mr-2">🔄</span> In Progress
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {projects?.in_progress || 0} ({getProjectStatusPercentage(projects?.in_progress, projects?.total)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${getProjectStatusPercentage(projects?.in_progress, projects?.total)}%` }}
                  ></div>
                </div>
              </div>

              {/* Completed Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="mr-2">🎉</span> Completed
                  </span>
                  <span className="text-sm font-bold text-purple-600">
                    {projects?.completed || 0} ({getProjectStatusPercentage(projects?.completed, projects?.total)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-purple-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${getProjectStatusPercentage(projects?.completed, projects?.total)}%` }}
                  ></div>
                </div>
              </div>

              {/* Rejected Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="mr-2">❌</span> Rejected
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    {projects?.rejected || 0} ({getProjectStatusPercentage(projects?.rejected, projects?.total)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-red-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${getProjectStatusPercentage(projects?.rejected, projects?.total)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Pie Chart Visual */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-center items-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#eab308" strokeWidth="20"
                      strokeDasharray={`${getProjectStatusPercentage(projects?.pending, projects?.total) * 2.51} 251`} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#16a34a" strokeWidth="20"
                      strokeDasharray={`${getProjectStatusPercentage(projects?.approved, projects?.total) * 2.51} 251`}
                      strokeDashoffset={`-${getProjectStatusPercentage(projects?.pending, projects?.total) * 2.51}`} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="20"
                      strokeDasharray={`${getProjectStatusPercentage(projects?.in_progress, projects?.total) * 2.51} 251`}
                      strokeDashoffset={`-${(getProjectStatusPercentage(projects?.pending, projects?.total) + getProjectStatusPercentage(projects?.approved, projects?.total)) * 2.51}`} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#9333ea" strokeWidth="20"
                      strokeDasharray={`${getProjectStatusPercentage(projects?.completed, projects?.total) * 2.51} 251`}
                      strokeDashoffset={`-${(getProjectStatusPercentage(projects?.pending, projects?.total) + getProjectStatusPercentage(projects?.approved, projects?.total) + getProjectStatusPercentage(projects?.in_progress, projects?.total)) * 2.51}`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{projects?.total || 0}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Funding Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Funding Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-600">Total Requested</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {funding?.total_amount ? `${(funding.total_amount / 1000000).toFixed(2)}M TZS` : '0 TZS'}
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600">Total Approved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {funding?.approved_amount ? `${(funding.approved_amount / 1000000).toFixed(2)}M TZS` : '0 TZS'}
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {funding?.pending || 0} applications
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
