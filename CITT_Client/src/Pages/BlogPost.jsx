import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from '../services/api';
import { ArrowLeft, Newspaper, Calendar, User } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/cms/public/posts/${slug}`);
      setPost(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Post not found.");
      } else {
        setError("Failed to load post.");
      }
    } finally {
      setLoading(false);
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
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400 text-lg">Loading post...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 px-4 md:px-16 py-10 overflow-auto bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
        <div className="max-w-3xl mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-md text-center">
            <Newspaper className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
              {error}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              The post you are looking for may have been removed or is not yet published.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 md:px-16 py-10 overflow-auto bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <article className="max-w-3xl mx-auto">
        <Link to="/blog" className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="aspect-[16/9] rounded-xl overflow-hidden mb-8 bg-slate-100 dark:bg-slate-700">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Category Badge */}
        {post.category_name && (
          <span className="inline-block bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            {post.category_name}
          </span>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" /> {post.author_name || "CITT"}
          </span>
          {post.published_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {formatDate(post.published_at)}
            </span>
          )}
        </div>

        {/* Content */}
        <div
          className="[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-slate-800 dark:[&_h1]:text-slate-100
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-slate-800 dark:[&_h2]:text-slate-100
            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-slate-800 dark:[&_h3]:text-slate-100
            [&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-slate-600 dark:[&_p]:text-slate-300
            [&_a]:text-teal-600 dark:[&_a]:text-teal-400 [&_a]:underline
            [&_img]:rounded-xl [&_img]:shadow-md [&_img]:my-6 [&_img]:max-w-full
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1
            [&_li]:text-slate-600 dark:[&_li]:text-slate-300 [&_li]:leading-relaxed
            [&_blockquote]:border-l-4 [&_blockquote]:border-teal-500 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-6 [&_blockquote]:italic [&_blockquote]:text-slate-500 dark:[&_blockquote]:text-slate-400
            [&_pre]:bg-slate-100 dark:[&_pre]:bg-slate-800 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre]:text-sm
            [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-teal-700 dark:[&_code]:text-teal-300
            [&_hr]:my-8 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-700
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Back link at bottom */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Link to="/blog" className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:underline font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </article>
    </main>
  );
};

export default BlogPost;
