import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/users/${id}`);
        setUser(response.data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="flex-1 px-16 py-10 overflow-auto bg-white">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading user profile...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 px-16 py-10 overflow-auto bg-white">
        <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg mb-6">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-300 text-slate-800 rounded-md hover:bg-slate-400 transition"
        >
          Go Back
        </button>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 px-16 py-10 overflow-auto bg-white">
        <div className="text-center py-10">
          <p className="text-slate-600 text-lg">User not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-slate-300 text-slate-800 rounded-md hover:bg-slate-400 transition"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-16 py-10 overflow-auto bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800 to-teal-700 text-white rounded-xl p-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
            <p className="text-slate-200 mb-4">{user.email}</p>
            <div className="flex gap-4">
              <div className="bg-teal-600 px-4 py-2 rounded-lg">
                <p className="text-sm text-slate-200">Role</p>
                <p className="font-bold capitalize">{user.role || 'innovator'}</p>
              </div>
              <div className="bg-teal-600 px-4 py-2 rounded-lg">
                <p className="text-sm text-slate-200">Member Since</p>
                <p className="font-bold">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          Profile Info
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'contact'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          Contact Details
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <p className="text-slate-600 text-lg">{user.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <p className="text-slate-600 text-lg">{user.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                <p className="text-slate-600 text-lg capitalize">{user.role || 'innovator'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Account Status</label>
                <p className="text-green-600 font-semibold flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                  Active
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Member Since</label>
                <p className="text-slate-600 text-lg">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Last Updated</label>
                <p className="text-slate-600 text-lg">
                  {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <a href={`mailto:${user.email}`} className="text-teal-600 hover:text-teal-700 text-lg">
                {user.email}
              </a>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
              <p className="text-slate-600 text-lg">
                {user.phone ? (
                  <a href={`tel:${user.phone}`} className="text-teal-600 hover:text-teal-700">
                    {user.phone}
                  </a>
                ) : (
                  'Not provided'
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="mt-8 grid grid-cols-3 gap-6">
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">📊 Statistics</h3>
          <p className="text-slate-600 text-sm mb-3">Account Status: <span className="text-green-600 font-semibold">Active</span></p>
          <p className="text-slate-600 text-sm">Member Duration: <span className="font-semibold">
            {user.created_at ? Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) : 0} days
          </span></p>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">🔒 Account Information</h3>
          <p className="text-slate-600 text-sm mb-3">Role: <span className="font-semibold capitalize">{user.role || 'innovator'}</span></p>
          <p className="text-slate-600 text-sm">Account Type: <span className="font-semibold">Standard</span></p>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">⏰ Timeline</h3>
          <p className="text-slate-600 text-sm mb-3">Registered: <span className="font-semibold">
            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
          </span></p>
          <p className="text-slate-600 text-sm">Last Active: <span className="font-semibold">Today</span></p>
        </div>
      </div>
    </main>
  );
};

export default UserProfile;
