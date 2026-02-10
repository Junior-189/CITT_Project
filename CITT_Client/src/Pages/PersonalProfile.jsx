import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const PersonalProfile = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile, token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // Use authProfile from context if available, otherwise fetch
        if (authProfile) {
          setProfile(authProfile);
          setFormData({
            name: authProfile.name || '',
            email: authProfile.email || '',
            phone: authProfile.phone || ''
          });
        } else if (token) {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProfile(response.data);
          setFormData({
            name: response.data.name || '',
            email: response.data.email || '',
            phone: response.data.phone || ''
          });
        } else {
          setError('Not authenticated');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load your profile');
      } finally {
        setLoading(false);
      }
    };

    if (user || token) {
      fetchProfile();
    } else {
      setLoading(false);
      setError('Please log in first');
    }
  }, [user, authProfile, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      const userId = profile?.id;
      if (!userId) {
        setError('User ID not found');
        return;
      }
      await api.put(`/users/${userId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(prev => ({
        ...prev,
        ...formData
      }));
      setIsEditing(false);
      // Show success message
      alert('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <main className="flex-1 px-16 py-10 overflow-auto bg-white">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your profile...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 px-16 py-10 overflow-auto bg-white">
        <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg mb-6">
          <p className="text-red-700 font-semibold">{error || 'Profile not found'}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-slate-300 text-slate-800 rounded-md hover:bg-slate-400 transition"
        >
          Go Home
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 px-16 py-10 overflow-auto bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800 to-teal-700 text-white rounded-xl p-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-slate-200 mb-4">{profile.email}</p>
            <div className="flex gap-4">
              <div className="bg-teal-600 px-4 py-2 rounded-lg">
                <p className="text-sm text-slate-200">Role</p>
                <p className="font-bold capitalize">{profile.role || 'innovator'}</p>
              </div>
              <div className="bg-teal-600 px-4 py-2 rounded-lg">
                <p className="text-sm text-slate-200">Member Since</p>
                <p className="font-bold">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-semibold transition"
            >
              Edit Profile
            </button>
          )}
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
          Profile Information
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'submissions'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          My Submissions
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'activity'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          Activity
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg mb-6">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="+255 123 456 789"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <p className="text-slate-600 text-lg">{profile.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <p className="text-slate-600 text-lg">{profile.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                  <p className="text-slate-600 text-lg">{profile.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                  <p className="text-slate-600 text-lg capitalize">{profile.role || 'innovator'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Member Since</label>
                  <p className="text-slate-600 text-lg">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Account Status</label>
                  <p className="text-green-600 font-semibold flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                    Active
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Event Submissions</h3>
            <div className="text-center py-12">
              <p className="text-slate-600">You haven't submitted to any events yet.</p>
              <button
                onClick={() => navigate('/events')}
                className="mt-4 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition"
              >
                Explore Events
              </button>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Recent Activity</h3>
            <div className="text-center py-12">
              <p className="text-slate-600">No recent activity</p>
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="mt-8 grid grid-cols-3 gap-6">
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">📊 Quick Stats</h3>
          <p className="text-slate-600 text-sm mb-3">Account Type: <span className="font-semibold capitalize">{profile.role || 'innovator'}</span></p>
          <p className="text-slate-600 text-sm">Status: <span className="text-green-600 font-semibold">Active</span></p>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">🔐 Security</h3>
          <p className="text-slate-600 text-sm mb-3">Authentication: <span className="font-semibold">Enabled</span></p>
          <p className="text-slate-600 text-sm">Last Updated: <span className="font-semibold">Today</span></p>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">⏰ Membership</h3>
          <p className="text-slate-600 text-sm mb-3">Joined: <span className="font-semibold">
            {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
          </span></p>
          <p className="text-slate-600 text-sm">Duration: <span className="font-semibold">
            {profile.created_at ? Math.floor((new Date() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24)) : 0} days
          </span></p>
        </div>
      </div>
    </main>
  );
};

export default PersonalProfile;
