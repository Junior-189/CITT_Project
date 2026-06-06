import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, MailOpen, ExternalLink, RefreshCw } from 'lucide-react';

const ContactMessages = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const api = getAuthenticatedAxios();
      const res = await api.get('/api/contact', { params: { page, limit: 20 } });
      setMessages(res.data.messages || []);
      setPagination(res.data.pagination || { total: 0, pages: 0 });
    } catch (e) {
      setError('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, [page]);

  const markAsRead = async (id) => {
    try {
      const api = getAuthenticatedAxios();
      await api.put(`/api/contact/${id}/read`);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      const api = getAuthenticatedAxios();
      await api.put('/api/contact/mark-all-read');
      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
    } catch {}
  };

  const handleReply = (msg) => {
    const subject = msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`;
    window.location.href = `mailto:${msg.email}?subject=${encodeURIComponent(subject)}`;
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <main className="flex-1 px-4 md:px-8 py-8 overflow-auto bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Contact Messages</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {pagination.total} total · {unreadCount} unread
            </p>
          </div>
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <MailOpen className="w-4 h-4" /> Mark All Read
              </button>
            )}
            <button onClick={fetchMessages}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm">
            <Mail className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No contact messages yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map(msg => {
              const isExpanded = expandedId === msg.id;
              return (
                <div key={msg.id}
                  className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border transition-colors
                    ${!msg.is_read ? 'border-teal-300 dark:border-teal-700 bg-teal-50/30 dark:bg-teal-900/10' : 'border-gray-100 dark:border-slate-700'}`}>
                  <div
                    className="p-4 cursor-pointer flex items-start gap-4"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : msg.id);
                      if (!msg.is_read) markAsRead(msg.id);
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {msg.is_read ? (
                        <MailOpen className="w-5 h-5 text-slate-400" />
                      ) : (
                        <Mail className="w-5 h-5 text-teal-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className={`font-semibold text-sm ${!msg.is_read ? 'text-teal-700 dark:text-teal-300' : 'text-slate-800 dark:text-slate-100'}`}>
                          {msg.subject}
                        </h3>
                        {!msg.is_read && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full">New</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {msg.name} · {msg.email} · {new Date(msg.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {!isExpanded && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-1">{msg.message}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                      {isExpanded ? 'Collapse' : 'View'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-700 pt-3">
                      <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      <div className="mt-4 flex gap-3">
                        <button onClick={() => handleReply(msg)}
                          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors">
                          <ExternalLink className="w-4 h-4" /> Reply via Email
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50">Prev</button>
            <span className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Page {page} of {pagination.pages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </main>
  );
};

export default ContactMessages;
