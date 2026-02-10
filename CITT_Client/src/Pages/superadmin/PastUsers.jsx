import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const PastUsers = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDeletedUsers();
  }, []);

  const fetchDeletedUsers = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const response = await api.get('/api/superadmin/users/deleted');
      setDeletedUsers(response.data.users || response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch deleted users');
      console.error('Error fetching deleted users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreUser = async () => {
    if (!selectedUser) return;

    try {
      const api = getAuthenticatedAxios();
      await api.post(`/api/superadmin/users/${selectedUser.id}/restore`);
      setSuccess(`User ${selectedUser.name} has been restored successfully`);
      setShowRestoreModal(false);
      setSelectedUser(null);
      fetchDeletedUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to restore user');
      setShowRestoreModal(false);
    }
  };

  const handlePermanentDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${userName}? This action cannot be undone!`)) {
      return;
    }

    try {
      const api = getAuthenticatedAxios();
      await api.delete(`/api/superadmin/users/${userId}/permanent`);
      setSuccess(`User ${userName} has been permanently deleted`);
      fetchDeletedUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to permanently delete user');
    }
  };

  const filteredUsers = deletedUsers.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rolesConfig = {
    superAdmin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800', icon: '👑' },
    admin: { label: 'Admin', color: 'bg-teal-100 text-teal-800', icon: '🔑' },
    ipManager: { label: 'IP Manager', color: 'bg-orange-100 text-orange-800', icon: '📜' },
    innovator: { label: 'Innovator', color: 'bg-blue-100 text-blue-800', icon: '💡' }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading deleted users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Past Users (Deleted)</h1>
          <p className="text-gray-600 mt-2">View and restore deleted user accounts</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-600">
            SuperAdmin & Admin Only
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Total Deleted Users</p>
                <p className="text-2xl font-bold text-gray-900">{deletedUsers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Can Be Restored</p>
                <p className="text-2xl font-bold text-yellow-600">{deletedUsers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Recently Deleted</p>
                <p className="text-2xl font-bold text-blue-600">
                  {deletedUsers.filter(u => {
                    const deletedDate = new Date(u.deleted_at);
                    const daysSinceDeleted = (Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);
                    return daysSinceDeleted <= 7;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900"
            />
          </div>
        </div>

        {/* Deleted Users List */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Deleted Users Found</h3>
            <p className="mt-2 text-sm text-gray-600">
              {searchTerm ? 'No users match your search criteria.' : 'There are no deleted users to display.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-red-500">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-700 font-semibold text-lg">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <span className={`px-3 py-1 inline-flex items-center text-sm leading-5 font-semibold rounded-full ${rolesConfig[user.role]?.color || 'bg-gray-100 text-gray-800'}`}>
                    <span className="mr-1">{rolesConfig[user.role]?.icon}</span>
                    {rolesConfig[user.role]?.label || user.role}
                  </span>
                </div>

                {user.university && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>University:</strong> {user.university}
                  </p>
                )}

                <div className="mb-4 text-xs text-gray-500 space-y-1">
                  <p><strong>Created:</strong> {formatDate(user.created_at)}</p>
                  <p className="text-red-600"><strong>Deleted:</strong> {formatDate(user.deleted_at)}</p>
                  {user.deleted_by && (
                    <p><strong>Deleted By:</strong> {user.deleted_by_name || 'Admin'}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowRestoreModal(true);
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                  >
                    Restore User
                  </button>

                  <button
                    onClick={() => handlePermanentDelete(user.id, user.name)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Restore Confirmation Modal */}
        {showRestoreModal && selectedUser && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-slate-700 bg-opacity-75 transition-opacity" onClick={() => {
                setShowRestoreModal(false);
                setSelectedUser(null);
              }}></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Restore User Account
                      </h3>
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-4">
                          Are you sure you want to restore the account for <strong className="text-gray-900">{selectedUser.name}</strong>?
                        </p>
                        <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                          <p className="text-xs text-green-700">
                            <strong>Email:</strong> {selectedUser.email}
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            <strong>Role:</strong> {rolesConfig[selectedUser.role]?.label}
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            <strong>Deleted:</strong> {formatDate(selectedUser.deleted_at)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          This user will be able to log in again with their previous credentials.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleRestoreUser}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Yes, Restore User
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRestoreModal(false);
                      setSelectedUser(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PastUsers;
