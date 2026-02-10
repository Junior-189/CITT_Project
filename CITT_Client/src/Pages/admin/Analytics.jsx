import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Analytics = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const response = await api.get('/api/analytics/dashboard');
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
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

  const { users, projects, funding, ipManagement, events, activity } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">System-wide statistics and insights</p>
        </div>

        {/* Users Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users?.total_users || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Innovators</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{users?.innovators || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">IP Managers</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{users?.ip_managers || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Admins</p>
              <p className="text-3xl font-bold text-teal-600 mt-2">{(users?.admins || 0) + (users?.super_admins || 0)}</p>
            </div>
          </div>
        </div>

        {/* Projects Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{projects?.total_projects || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{projects?.pending_approval || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{projects?.approved || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{projects?.completed || 0}</p>
            </div>
          </div>
        </div>

        {/* Funding Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Funding Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{funding?.total_applications || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{funding?.pending_approval || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{funding?.approved || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Requested</p>
              <p className="text-xl font-bold text-blue-600 mt-2">
                {funding?.total_amount_requested ? `${Number(funding.total_amount_requested).toLocaleString()} TZS` : '0 TZS'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Approved</p>
              <p className="text-xl font-bold text-green-600 mt-2">
                {funding?.total_amount_approved ? `${Number(funding.total_amount_approved).toLocaleString()} TZS` : '0 TZS'}
              </p>
            </div>
          </div>
        </div>

        {/* IP Management & Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IP Management */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">IP Management</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total IP Records</span>
                  <span className="text-2xl font-bold text-gray-900">{ipManagement?.total_ip_records || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending</span>
                  <span className="text-2xl font-bold text-yellow-600">{ipManagement?.pending_approval || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Approved</span>
                  <span className="text-2xl font-bold text-green-600">{ipManagement?.approved || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Events */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Events</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Events</span>
                  <span className="text-2xl font-bold text-gray-900">{events?.total_events || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Upcoming</span>
                  <span className="text-2xl font-bold text-blue-600">{events?.upcoming_events || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Past Events</span>
                  <span className="text-2xl font-bold text-gray-600">{events?.past_events || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity */}
        {activity && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Total Actions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{activity.total_actions || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Last 24 Hours</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{activity.last_24_hours || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Last 7 Days</p>
                  <p className="text-3xl font-bold text-teal-600 mt-2">{activity.last_7_days || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
