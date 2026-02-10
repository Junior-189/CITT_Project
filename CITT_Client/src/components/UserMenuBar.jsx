import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, User, LogOut, Lock, ChevronDown } from 'lucide-react';

const UserMenuBar = () => {
  const { profile, role, logout, getAuthenticatedAxios } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Refs for click outside detection
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const passwordModalRef = useRef(null);

  // Fetch notifications from backend
  useEffect(() => {
    if (profile) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  const fetchNotifications = async () => {
    try {
      const api = getAuthenticatedAxios();
      const response = await api.get('/api/notifications');
      const notifs = response.data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (passwordModalRef.current && !passwordModalRef.current.contains(event.target)) {
        // Don't close modal on outside click - user must explicitly close it
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      const api = getAuthenticatedAxios();
      await api.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordSuccess('Password changed successfully!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (profile?.name) {
      return profile.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'superAdmin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-teal-100 text-teal-800';
      case 'ipManager':
        return 'bg-orange-100 text-orange-800';
      case 'innovator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'superAdmin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'ipManager':
        return 'IP Manager';
      case 'innovator':
        return 'Innovator';
      default:
        return 'User';
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <div className="relative" ref={notificationMenuRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-600">{unreadCount} unread</p>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-sm font-semibold">
              {getUserInitials()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{profile?.name || 'User'}</p>
              <p className="text-xs text-gray-300">{profile?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-900">{profile?.name}</p>
                <p className="text-xs text-gray-600">{profile?.email}</p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor()}`}>
                  {getRoleLabel()}
                </span>
              </div>
              <div className="py-2">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowPasswordModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Logout Button */}
        <button
          onClick={handleLogout}
          className="hidden lg:flex items-center gap-2 px-4 py-2 text-slate-800 bg-teal-200 hover:bg-teal-300 rounded-lg transition-colors text-sm font-medium"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            ref={passwordModalRef}
            className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">{passwordSuccess}</p>
                </div>
              )}

              <form onSubmit={handlePasswordChange}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    placeholder="Enter new password (min 6 characters)"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError('');
                      setPasswordSuccess('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserMenuBar;
