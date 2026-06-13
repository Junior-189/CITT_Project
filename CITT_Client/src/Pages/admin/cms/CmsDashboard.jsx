import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FileText, Newspaper, Tags, ArrowRight } from 'lucide-react';

const CmsDashboard = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [stats, setStats] = useState({ pages: 0, posts: 0, categories: 0, publishedPosts: 0 });
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const api = getAuthenticatedAxios();
        const [pagesRes, postsRes, catRes] = await Promise.all([
          api.get('/api/cms/pages', { params: { limit: 1 } }),
          api.get('/api/cms/posts', { params: { limit: 5 } }),
          api.get('/api/cms/categories'),
        ]);
        setStats({
          pages: pagesRes.data.pagination?.total || 0,
          posts: postsRes.data.pagination?.total || 0,
          categories: catRes.data.length || 0,
          publishedPosts: postsRes.data.posts?.filter(p => p.status === 'published').length || 0,
        });
        setRecentPosts(postsRes.data.posts?.slice(0, 5) || []);
      } catch {
        setError('Failed to load CMS data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [getAuthenticatedAxios]);

  const cards = [
    { label: 'Pages', count: stats.pages, icon: FileText, color: 'bg-blue-500', link: '/admin/cms/pages' },
    { label: 'Posts', count: stats.posts, icon: Newspaper, color: 'bg-teal-500', link: '/admin/cms/posts' },
    { label: 'Categories', count: stats.categories, icon: Tags, color: 'bg-purple-500', link: '/admin/cms/categories' },
    { label: 'Published', count: stats.publishedPosts, icon: Newspaper, color: 'bg-green-500', link: '/admin/cms/posts?status=published' },
  ];

  const statusStyles = { draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };

  return (
    <main className="flex-1 px-4 md:px-8 py-8 overflow-auto bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Content Management</h1>

        {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">{error}</div>}

        {loading ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-3" />
            Loading CMS data...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {cards.map(c => (
                <Link key={c.label} to={c.link}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center`}>
                      <c.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{c.count}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{c.label}</p>
                </Link>
              ))}
            </div>

            {recentPosts.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent Posts</h2>
                  <Link to="/admin/cms/posts" className="text-sm text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
                    View All <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {recentPosts.map(post => (
                    <div key={post.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-100">{post.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {post.category_name || 'Uncategorized'} · {new Date(post.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyles[post.status] || ''}`}>
                        {post.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default CmsDashboard;
