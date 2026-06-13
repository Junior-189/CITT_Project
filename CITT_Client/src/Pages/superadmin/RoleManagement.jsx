import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const RoleManagement = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '' });
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userForPassword, setUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Add new user state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'admin', phone: '', campus: '' });
  const [addLoading, setAddLoading] = useState(false);

  const rolesConfig = {
    superAdmin:              { label: 'Super Admin',              color: 'bg-slate-800 text-white' },
    admin:                   { label: 'Admin',                    color: 'bg-teal-700 text-white' },
    transferTechnologyOfficer: { label: 'Transfer Technology Officer', color: 'bg-teal-600 text-white' },
    ipManager:               { label: 'IP Manager',              color: 'bg-blue-700 text-white' },
    diiDirector:             { label: 'DII Director',            color: 'bg-teal-500 text-white' },
    debmDirector:            { label: 'DEBM Director',           color: 'bg-blue-600 text-white' },
    rtpDirector:             { label: 'RTP Director',            color: 'bg-teal-800 text-white' },
    mentor:                  { label: 'Mentor',                  color: 'bg-blue-500 text-white' },
    technicalCommittee:      { label: 'Technical Committee',     color: 'bg-slate-600 text-white' },
    coordinator:             { label: 'Coordinator',             color: 'bg-blue-400 text-white' },
    innovator:               { label: 'Innovator',               color: 'bg-slate-500 text-white' },
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const api = getAuthenticatedAxios();
      const params = filterRole !== 'all' ? { role: filterRole } : {};

      const response = await api.get('/api/superadmin/users', { params });
      setUsers(Array.isArray(response.data) ? response.data : (response.data.users || []));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async () => {
    if (!selectedUser || !newRole) return;
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/superadmin/users/${selectedUser.id}/role`, { newRole });
      setSuccess(`User role changed to ${rolesConfig[newRole]?.label || newRole}`);
      setShowRoleModal(false);
      setSelectedUser(null);
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change role');
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      const api = getAuthenticatedAxios();
      await api.delete(`/api/superadmin/users/${userToDelete.id}`);
      setSuccess(`User ${userToDelete.name} has been deleted successfully`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
      setShowDeleteModal(false);
    }
  };

  const handleEditClick = (user) => {
    setUserToEdit(user);
    setEditFormData({ name: user.name, email: user.email });
    setEditPassword('');
    setEditConfirmPassword('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!userToEdit) return;
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/superadmin/users/${userToEdit.id}`, {
        name: editFormData.name,
        email: editFormData.email
      });
      if (editFormData.role && editFormData.role !== userToEdit.role) {
        await api.put(`/api/superadmin/users/${userToEdit.id}/role`, { newRole: editFormData.role });
      }
      if (editPassword && editPassword.length > 0) {
        if (editPassword !== editConfirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (editPassword.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        await api.put(`/api/superadmin/users/${userToEdit.id}/password`, { newPassword: editPassword });
      }
      setSuccess('User information updated successfully');
      setShowEditModal(false);
      setUserToEdit(null);
      setEditPassword('');
      setEditConfirmPassword('');
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user information');
    }
  };

  const handlePasswordClick = (user) => {
    setUserForPassword(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!userForPassword) return;
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/superadmin/users/${userForPassword.id}/password`, { newPassword });
      setSuccess(`Password updated successfully for ${userForPassword.name}`);
      setShowPasswordModal(false);
      setUserForPassword(null);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password');
    }
  };

  const handleAddUser = async () => {
    if (!addFormData.name || !addFormData.email || !addFormData.password || !addFormData.role) {
      setError('Name, email, password, and role are required');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (addFormData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (addFormData.password !== addFormData.confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      setAddLoading(true);
      const api = getAuthenticatedAxios();
      await api.post('/api/superadmin/users', {
        name: addFormData.name,
        email: addFormData.email,
        password: addFormData.password,
        role: addFormData.role,
        phone: addFormData.phone || undefined,
        campus: addFormData.campus || undefined
      });
      setSuccess(`New ${rolesConfig[addFormData.role]?.label || addFormData.role} account created successfully`);
      setShowAddModal(false);
      setAddFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'admin', phone: '', campus: '' });
      fetchUsers();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
      setTimeout(() => setError(null), 5000);
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Role Management</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              Manage users, roles, and permissions
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400">
                SuperAdmin Only
              </span>
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add User
          </button>
        </div>

        {/* Success / Error Alerts */}
        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-500/10 border-l-4 border-green-500 p-4 rounded">
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Toolbar: Filter + Count */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 whitespace-nowrap">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-slate-100"
            >
              <option value="all">All Users ({users.length})</option>
              {Object.entries(rolesConfig).map(([role, config]) => (
                <option key={role} value={role}>{config.label}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500 dark:text-slate-400 ml-auto">
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Users Table */}
        {users.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">No users found</h3>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Campus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-teal-700 dark:text-teal-400 font-semibold text-sm">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{user.name}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${rolesConfig[user.role]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {rolesConfig[user.role]?.label || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                        {user.campus || user.university || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleRoleChange(user)}
                            className="px-3 py-1.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-500/30 transition text-xs font-medium">
                            Change Role
                          </button>
                          <button onClick={() => handleEditClick(user)}
                            className="px-3 py-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-500/30 transition text-xs font-medium">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteClick(user)}
                            className="px-3 py-1.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-500/30 transition text-xs font-medium">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add New User Modal */}
        {showAddModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
                <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-500/20 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-slate-100">Add New User</h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name *</label>
                          <input type="text" value={addFormData.name}
                            onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-slate-100"
                            placeholder="Enter full name" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email *</label>
                          <input type="email" value={addFormData.email}
                            onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-slate-100"
                            placeholder="Enter email address" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Role *</label>
                          <select value={addFormData.role}
                            onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-slate-100">
                            {Object.entries(rolesConfig).map(([role, config]) => (
                              <option key={role} value={role}>{config.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone</label>
                          <input type="text" value={addFormData.phone}
                            onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-slate-100"
                            placeholder="Enter phone number (optional)" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Campus</label>
                          <select value={addFormData.campus}
                            onChange={(e) => setAddFormData({ ...addFormData, campus: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-slate-100">
                            <option value="">Select campus</option>
                            <option value="Main Campus">Main Campus</option>
                            <option value="Rukwa Campus">Rukwa Campus</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password *</label>
                          <input type="password" value={addFormData.password}
                            onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-slate-100"
                            placeholder="Minimum 6 characters" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Confirm Password *</label>
                          <input type="password" value={addFormData.confirmPassword}
                            onChange={(e) => setAddFormData({ ...addFormData, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-slate-100"
                            placeholder="Confirm password" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button type="button" onClick={handleAddUser} disabled={addLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 sm:w-auto sm:text-sm disabled:opacity-50">
                    {addLoading ? 'Creating...' : `Add ${rolesConfig[addFormData.role]?.label || 'User'}`}
                  </button>
                  <button type="button" onClick={() => { setShowAddModal(false); setAddFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'admin', phone: '', campus: '' }); }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Change Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowRoleModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
                <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-500/20 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-slate-100">Change User Role</h3>
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                          <strong className="text-gray-900 dark:text-slate-100">{selectedUser.name}</strong> ({selectedUser.email})
                        </p>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                          Current Role: <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${rolesConfig[selectedUser.role]?.color}`}>
                            {rolesConfig[selectedUser.role]?.label}
                          </span>
                        </p>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 mt-4">New Role</label>
                        <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-slate-100">
                          {Object.entries(rolesConfig).map(([role, config]) => (
                            <option key={role} value={role}>{config.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button type="button" onClick={handleRoleSubmit}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 sm:w-auto sm:text-sm">
                    Change Role
                  </button>
                  <button type="button" onClick={() => { setShowRoleModal(false); setSelectedUser(null); }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && userToDelete && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowDeleteModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
                <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-slate-100">Delete User Account</h3>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">Do you want to delete this user?</p>
                        <div className="bg-teal-50 dark:bg-teal-500/10 border-l-4 border-teal-500 p-3 rounded">
                          <p className="text-sm text-teal-700 dark:text-teal-300"><strong>User:</strong> {userToDelete.name}</p>
                          <p className="text-sm text-teal-700 dark:text-teal-300 mt-1"><strong>Email:</strong> {userToDelete.email}</p>
                          <p className="text-sm text-teal-700 dark:text-teal-300 mt-1"><strong>Role:</strong> {rolesConfig[userToDelete.role]?.label}</p>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-3">
                          This action will move the user to deleted users. You can restore them later from the Past Users page.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button type="button" onClick={handleDeleteConfirm}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:w-auto sm:text-sm">
                    Yes, Delete User
                  </button>
                  <button type="button" onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto sm:text-sm">
                    No, Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && userToEdit && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowEditModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
                <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-500/20 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-slate-100">Edit User Information</h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name</label>
                          <input type="text" value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-slate-100" placeholder="Enter name" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
                          <input type="email" value={editFormData.email}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-slate-100" placeholder="Enter email" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Role</label>
                          <select value={editFormData.role || userToEdit.role}
                            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-slate-100">
                            {Object.keys(rolesConfig).map(r => (
                              <option key={r} value={r}>{rolesConfig[r].label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">New Password (optional)</label>
                          <input type="password" value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-slate-100" placeholder="Enter new password to reset" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Confirm Password</label>
                          <input type="password" value={editConfirmPassword}
                            onChange={(e) => setEditConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-slate-100" placeholder="Confirm new password" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button type="button" onClick={handleEditSubmit}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:w-auto sm:text-sm">
                    Save Changes
                  </button>
                  <button type="button" onClick={() => { setShowEditModal(false); setUserToEdit(null); }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && userForPassword && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowPasswordModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="relative inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
                <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-slate-100">Change Password</h3>
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                          <strong className="text-gray-900 dark:text-slate-100">{userForPassword.name}</strong> ({userForPassword.email})
                        </p>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">New Password</label>
                          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-slate-100" placeholder="Enter new password" />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Confirm Password</label>
                          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-slate-100" placeholder="Confirm new password" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Password must be at least 6 characters long.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button type="button" onClick={handlePasswordSubmit}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:w-auto sm:text-sm">
                    Update Password
                  </button>
                  <button type="button" onClick={() => { setShowPasswordModal(false); setUserForPassword(null); setNewPassword(''); setConfirmPassword(''); }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto sm:text-sm">
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

export default RoleManagement;
