import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../services/api';
import { Newspaper, ChevronLeft, ChevronRight } from "lucide-react";

const POSTS_PER_PAGE = 9;

const Blog = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [selectedCategory, setSelectedCategory] = useState("");

  const fetchPosts = async (page = 1, category = selectedCategory) => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: POSTS_PER_PAGE };
      if (category) params.category = category;
      const res = await api.get('/api/cms/public/posts', { params });
      setPosts(res.data.posts || []);
      setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
    } catch {
      setError("Failed to load blog posts.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/cms/public/categories');
      setCategories(res.data || []);
    } catch { /* non-critical */ }
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchPosts(1, selectedCategory); }, [selectedCategory]);

  const handleCategoryClick = (slug) => {
    setSelectedCategory(slug === selectedCategory ? "" : slug);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchPosts(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="flex-1 px-4 md:px-16 py-10 overflow-auto bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400 text-lg">Loading blog...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 md:px-16 py-10 overflow-auto bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">Blog</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Latest updates, news, and insights from CITT.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 p-4 rounded">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? "bg-teal-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-400"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.slug
                    ? "bg-teal-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-400"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!error && posts.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-md text-center">
            <Newspaper className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
              No posts yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {selectedCategory
                ? "No published posts in this category yet."
                : "Blog posts will appear here once published."}
            </p>
          </div>
        )}

        {/* Posts Grid */}
        {posts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-700">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    {post.category_name && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {post.category_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                      <span>{post.author_name || "CITT"}</span>
                      <span>{formatDate(post.published_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Blog;
