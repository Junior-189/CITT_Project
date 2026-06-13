import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Edit2, Trash2, Tags, X, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CmsCategories = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '' });
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const api = getAuthenticatedAxios();
      const res = await api.get('/api/cms/categories');
      setCategories(res.data || []);
    } catch {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedAxios]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '' });
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c.id);
    setForm({ name: c.name, slug: c.slug });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const api = getAuthenticatedAxios();
      if (editing) {
        await api.put(`/api/cms/categories/${editing}`, form);
      } else {
        await api.post('/api/cms/categories', form);
      }
      closeForm();
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      const api = getAuthenticatedAxios();
      await api.delete(`/api/cms/categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete category.');
    }
  };

  return (
    <main className="flex-1 px-4 md:px-8 py-8 overflow-auto bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/admin/cms" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Categories</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{categories.length} total</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors">
            <Plus className="w-4 h-4" /> New Category
          </button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">{error}</div>}

        {showForm && (
          <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
                  <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100" required />
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm">
            <Tags className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No categories yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map(c => (
              <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">/{c.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)}
                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default CmsCategories;
