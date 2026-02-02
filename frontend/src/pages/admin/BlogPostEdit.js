import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${API_BASE.replace(/\/$/, '')}/api`;

const BlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category_id: '',
    tag_ids: [],
    status: 'draft',
    allow_comments: true,
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          axios.get(`${API}/blog/admin/categories`),
          axios.get(`${API}/blog/admin/tags`),
        ]);
        setCategories(catRes.data);
        setTags(tagRes.data);
      } catch (err) {
        toast.error('Failed to load categories/tags');
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      axios
        .get(`${API}/blog/admin/posts/${id}`)
        .then((res) => {
          const p = res.data;
          setFormData({
            title: p.title || '',
            excerpt: p.excerpt || '',
            content: p.content || '',
            featured_image: p.featured_image || '',
            category_id: p.category_id || '',
            tag_ids: p.tag_ids || [],
            status: p.status || 'draft',
            allow_comments: p.allow_comments !== false,
          });
        })
        .catch(() => toast.error('Failed to load post'))
        .finally(() => setLoading(false));
    }
  }, [isEditMode, id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTagToggle = (tagId) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((t) => t !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image (JPEG, PNG, GIF, WebP)');
      return;
    }
    setUploadingImage(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await axios.post(`${API}/blog/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, featured_image: res.data.url }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim() || undefined,
        content: formData.content.trim(),
        featured_image: formData.featured_image || undefined,
        category_id: formData.category_id || undefined,
        tag_ids: formData.tag_ids,
        status: formData.status,
        allow_comments: formData.allow_comments,
      };
      if (isEditMode) {
        await axios.put(`${API}/blog/admin/posts/${id}`, payload);
        toast.success('Post updated');
      } else {
        await axios.post(`${API}/blog/admin/posts`, payload);
        toast.success('Post created');
      }
      navigate('/admin/blogs');
    } catch (err) {
      toast.error(err.response?.data?.detail || (isEditMode ? 'Update failed' : 'Create failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/blogs">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
              {isEditMode ? 'Edit Blog Post' : 'New Blog Post'}
            </h1>
            <p className="text-slate-600">
              {isEditMode ? 'Update your blog post' : 'Create and publish a new blog post'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter blog title"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Brief summary"
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <Label htmlFor="content">Content *</Label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your content..."
              required
              rows={14}
              className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 font-mono text-sm"
            />
          </div>

          <div>
            <Label>Featured image</Label>
            <div className="mt-1 flex items-center gap-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm">
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingImage ? 'Uploading...' : 'Upload image'}
                </span>
              </label>
              {formData.featured_image && (
                <img
                  src={formData.featured_image.startsWith('http') ? formData.featured_image : `${API_BASE}${formData.featured_image}`}
                  alt="Featured"
                  className="h-20 w-auto rounded object-cover border border-slate-200"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Category</Label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              >
                <option value="draft">Draft</option>
                <option value="pending_review">Pending review</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <Label>Tags</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tag_ids.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allow_comments"
              name="allow_comments"
              checked={formData.allow_comments}
              onChange={handleChange}
              className="rounded border-slate-300"
            />
            <Label htmlFor="allow_comments" className="cursor-pointer">Allow comments</Label>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="outline" asChild>
              <Link to="/admin/blogs">Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEditMode ? 'Update post' : 'Create post'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default BlogEditor;
