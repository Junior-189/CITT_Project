import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Edit2, Trash2, FileText, X, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CmsPages = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ slug: '', title: '', content: '', status: 'draft' });
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ total: 0 });

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const api = getAuthenticatedAxios();
      const res = await api.get('/api/cms/pages', { params: { limit: 100 } });
      setPages(res.data.pages || []);
      setPagination(res.data.pagination || { total: 0 });
    } catch {
      setError('Failed to load pages.');
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedAxios]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const openCreate = () => {
    setEditing(null);
    setForm({ slug: '', title: '', content: '', status: 'draft' });
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({ slug: p.slug, title: p.title, content: p.content, status: p.status });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const api = getAuthenticatedAxios();
      if (editing) {
        await api.put(`/api/cms/pages/${editing}`, form);
      } else {
        await api.post('/api/cms/pages', form);
      }
      closeForm();
      fetchPages();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save page.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this page?')) return;
    try {
      const api = getAuthenticatedAxios();
      await api.delete(`/api/cms/pages/${id}`);
      fetchPages();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete page.');
    }
  };

  const statusStyles = { draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };

  return (
    <main className="flex-1 px-4 md:px-8 py-8 overflow-auto bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/admin/cms" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pages</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{pagination.total} total</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors">
            <Plus className="w-4 h-4" /> New Page
          </button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">{error}</div>}

        {showForm && (
          <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Page' : 'New Page'}</h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
                  <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={8} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100" />
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
            <p className="text-slate-500 dark:text-slate-400">Loading pages...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No pages yet. Create your first page.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{p.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyles[p.status] || ''}`}>{p.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">/{p.slug} · Updated {new Date(p.updated_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => openEdit(p)}
                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)}
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

export default CmsPages;
