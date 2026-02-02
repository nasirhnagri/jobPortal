import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Briefcase, Search, ChevronLeft, ChevronRight, Calendar, FolderOpen, Tag, ArrowRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const UPLOAD_BASE = process.env.REACT_APP_BACKEND_URL;

export const BlogList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const limit = 12;
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  const updateParams = (updates) => {
    const p = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v != null && v !== '') p.set(k, String(v));
      else p.delete(k);
    });
    setSearchParams(p);
  };

  useEffect(() => {
    const p = Number(searchParams.get('page')) || 1;
    setPage(p);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit };
    if (search) params.search = search;
    if (category) params.category = category;
    if (tag) params.tag = tag;
    axios
      .get(`${API}/blog/posts`, { params })
      .then((res) => {
        setPosts(res.data.posts);
        setTotal(res.data.total);
      })
      .catch(() => {
        setPosts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, search, category, tag]);

  useEffect(() => {
    axios.get(`${API}/blog/categories`).then((res) => setCategories(res.data)).catch(() => {});
    axios.get(`${API}/blog/tags`).then((res) => setTags(res.data)).catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / limit);
  const imageUrl = (url) => (url && !url.startsWith('http') ? `${UPLOAD_BASE}${url}` : url);

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

      <main className="section-container py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope' }}>Blog</h1>
          <p className="text-slate-600 mb-8">Insights and updates from the JobNexus team</p>

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 flex-shrink-0 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onBlur={() => updateParams({ search: searchInput.trim() || null, page: null })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), updateParams({ search: (e.target.value || '').trim() || null, page: null }))}
                    placeholder="Search posts..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categories</label>
                <div className="space-y-1">
                  <button type="button" onClick={() => updateParams({ category: null, page: null })} className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${!category ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>All</button>
                  {categories.map((c) => (
                    <button key={c.id} type="button" onClick={() => updateParams({ category: c.slug, page: null })} className={`block w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${category === c.slug ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                      <FolderOpen className="w-4 h-4" />{c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => updateParams({ tag: null, page: null })} className={`px-2 py-1 rounded text-xs ${!tag ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>All</button>
                  {tags.slice(0, 20).map((t) => (
                    <button key={t.id} type="button" onClick={() => updateParams({ tag: t.slug, page: null })} className={`px-2 py-1 rounded text-xs ${tag === t.slug ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <p className="text-slate-500 text-center py-16">No posts found.</p>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    {posts.map((post) => (
                      <Link key={post.id} to={`/blog/${post.slug}`} className="group border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all">
                        {post.featured_image ? (
                          <img src={imageUrl(post.featured_image)} alt={post.title} className="w-full h-48 object-cover" />
                        ) : (
                          <div className="w-full h-48 bg-slate-100 flex items-center justify-center">
                            <Briefcase className="w-12 h-12 text-slate-300" />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                            {post.category && <span className="flex items-center gap-1"><FolderOpen className="w-4 h-4" />{post.category.name}</span>}
                          </div>
                          <h2 className="font-semibold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{post.title}</h2>
                          {post.excerpt && <p className="text-slate-600 text-sm mt-2 line-clamp-2">{post.excerpt}</p>}
                          <span className="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium mt-3">Read more <ArrowRight className="w-4 h-4" /></span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                      <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => updateParams({ page: page > 2 ? page - 1 : null })}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-slate-600 px-4">Page {page} of {totalPages}</span>
                      <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => updateParams({ page: page + 1 })}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
