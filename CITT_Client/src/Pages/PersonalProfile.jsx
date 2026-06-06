import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const CAMPUS_OPTIONS = ['Main Campus', 'Rukwa Campus'];

const PersonalProfile = () => {
  const { profile: authProfile, token, fetchCurrentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', campus: '' });
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);

  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (initialLoadDone.current) return;
    const load = async () => {
      try {
        if (authProfile) {
          setProfile(authProfile);
          setFormData({ name: authProfile.name || '', phone: authProfile.phone || '', campus: authProfile.campus || '' });
        } else if (token) {
          const res = await api.get('/api/auth/me');
          setProfile(res.data);
          setFormData({ name: res.data.name || '', phone: res.data.phone || '', campus: res.data.campus || '' });
        }
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
        initialLoadDone.current = true;
      }
    };
    if (authProfile || token) load();
    else { setLoading(false); initialLoadDone.current = true; }
  }, [authProfile, token]);

  const handleSave = async () => {
    setError('');
    try {
      const res = await api.put(`/api/users/${profile.id}`, {
        name: formData.name || null,
        email: profile.email,
        phone: formData.phone || null,
        campus: formData.campus || null,
      });
      // Update local profile from backend response (authoritative)
      const updated = res.data;
      setProfile(updated);
      setFormData({ name: updated.name || '', phone: updated.phone || '', campus: updated.campus || '' });
      // Refresh AuthContext profile so parent re-renders don't overwrite
      if (token && fetchCurrentUser) fetchCurrentUser(token);
      setIsEditing(false);
      setSaveMsg('Profile updated successfully');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile');
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await api.post('/api/auth/upload-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(p => ({ ...p, profile_photo_url: res.data.photo_url }));
    } catch {
      setError('Photo upload failed');
    }
    setPhotoUploading(false);
  };

  if (loading) {
    return (
      <main className="flex-1 px-8 py-10 overflow-auto bg-gray-50 dark:bg-slate-900">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 px-8 py-10 overflow-auto bg-gray-50 dark:bg-slate-900">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">{error || 'Profile not found'}</div>
      </main>
    );
  }

  const photoSrc = profile.profile_photo_url
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${profile.profile_photo_url}`
    : null;

  return (
    <main className="flex-1 px-8 py-10 overflow-auto bg-gray-50 dark:bg-slate-900">
      <div className="max-w-3xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Profile</h1>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button onClick={handleSave}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition">
                  Save Changes
                </button>
                <button onClick={() => { setIsEditing(false); setError(''); setFormData({ name: profile.name || '', phone: profile.phone || '', campus: profile.campus || '' }); }}
                   className="px-4 py-2 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg transition">
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition">
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {saveMsg && <div className="mb-4 bg-teal-50 dark:bg-teal-900/30 border border-teal-300 dark:border-teal-800 rounded-lg p-3 text-teal-700 dark:text-teal-300 text-sm">{saveMsg}</div>}
        {error && <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">{error}</div>}

        {/* Profile header card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6 flex items-center gap-6">
          {/* Photo */}
          <div
            className="relative w-28 h-28 flex-shrink-0 cursor-pointer group"
            onClick={() => photoInputRef.current?.click()}
          >
            {photoSrc ? (
              <img src={photoSrc} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-teal-100 dark:border-teal-800" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-teal-700 flex items-center justify-center border-4 border-teal-100 dark:border-teal-800">
                <span className="text-white text-3xl font-bold">{profile.name?.[0]?.toUpperCase() || '?'}</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {photoUploading
                ? <div className="animate-spin rounded-full h-6 w-6 border-2 border-white" />
                : <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              }
            </div>
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* Name / role / date */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{profile.name}</h2>
            <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-700 text-white capitalize">
              {profile.role || 'innovator'}
            </span>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Fields card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
              {isEditing
                ? <input name="name" value={formData.name} onChange={e => setFormData(s => ({ ...s, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                : <p className="text-slate-700 dark:text-slate-200 text-sm">{profile.name || 'Not provided'}</p>
              }
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                Email
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </label>
              <p className="text-slate-500 text-sm">{profile.email || 'Not provided'}</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone Number</label>
              {isEditing
                ? <input name="phone" value={formData.phone} onChange={e => setFormData(s => ({ ...s, phone: e.target.value }))}
                    placeholder="+255 700 000 000"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                : <p className="text-slate-700 dark:text-slate-200 text-sm">{profile.phone || 'Not provided'}</p>
              }
            </div>

            {/* Campus */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Campus</label>
              {isEditing
                ? <select value={formData.campus} onChange={e => setFormData(s => ({ ...s, campus: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none">
                    <option value="">Select campus</option>
                    {CAMPUS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                : <p className="text-slate-700 dark:text-slate-200 text-sm">{profile.campus || 'Not provided'}</p>
              }
            </div>

            {/* Role (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Role</label>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-teal-700 text-white capitalize">
                {profile.role || 'innovator'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PersonalProfile;
