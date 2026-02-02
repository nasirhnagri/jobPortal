import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import {
  Briefcase,
  Calendar,
  FolderOpen,
  Tag,
  User,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  ArrowLeft,
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const UPLOAD_BASE = process.env.REACT_APP_BACKEND_URL;

export const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    axios
      .get(`${API}/blog/posts/${slug}`)
      .then((res) => {
        setPost(res.data);
        document.title = res.data.meta_title || res.data.title || 'Blog | JobNexus';
        const desc = res.data.meta_description || res.data.excerpt;
        let metaDesc = document.querySelector('meta[name="description"]');
        if (desc) {
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute('content', desc.slice(0, 160));
        }
      })
      .catch((err) => setError(err.response?.status === 404 ? 'Post not found' : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [slug]);

  const imageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${UPLOAD_BASE}${url}`;
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || 'Blog Post';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-slate-600 mb-4">{error || 'Post not found'}</p>
        <Link to="/blog">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>JobNexus</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/jobs" className="text-slate-600 hover:text-slate-900 font-medium">Find Jobs</Link>
              <Link to="/blog" className="text-indigo-600 font-medium">Blog</Link>
            </nav>
            <Link to="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      <article className="section-container py-12">
        <div className="max-w-3xl mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {post.featured_image && (
            <img
              src={imageUrl(post.featured_image)}
              alt={post.title}
              className="w-full rounded-xl mb-8 object-cover max-h-[400px]"
            />
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(post.published_at || post.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {post.category && (
              <Link to={`/blog?category=${post.category.slug}`} className="flex items-center gap-1 hover:text-indigo-600">
                <FolderOpen className="w-4 h-4" />
                {post.category.name}
              </Link>
            )}
            {post.author_name && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author_name}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Manrope' }}>
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-slate-600 mb-8">{post.excerpt}</p>
          )}

          <div
            className="prose prose-slate max-w-none prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-slate-200">
              {post.tags.map((t) => (
                <Link
                  key={t.id}
                  to={`/blog?tag=${t.slug}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Tag className="w-3 h-3" />
                  {t.name}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </p>
            <div className="flex gap-2">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                aria-label="Share on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                aria-label="Share on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {post.author_name && (
            <div className="mt-8 p-6 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-2">About the author</h3>
              <p className="text-slate-600">{post.author_name}</p>
            </div>
          )}

          {post.related_posts?.length > 0 && (
            <div className="mt-12 pt-12 border-t border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Related posts</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {post.related_posts.map((r) => (
                  <Link
                    key={r.id}
                    to={`/blog/${r.slug}`}
                    className="flex gap-4 p-4 border border-slate-200 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
                  >
                    {r.featured_image ? (
                      <img src={imageUrl(r.featured_image)} alt={r.title} className="w-20 h-20 object-cover rounded" />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 rounded flex items-center justify-center">
                        <Briefcase className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-slate-900 truncate">{r.title}</h3>
                      <p className="text-sm text-slate-500">
                        {new Date(r.published_at || r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};
