import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { toast } from 'sonner';
import { Loader2, Trash2, Upload } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${API_BASE.replace(/\/$/, '')}/api`;

export const HeroVideoManagement = () => {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('active');
  const [order, setOrder] = useState(0);
  const [file, setFile] = useState(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/hero/admin/videos`);
      setVideos(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load hero videos');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [videos]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a video file (MP4/WebM)');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title);
      form.append('status', status);
      form.append('order', String(order || 0));

      await axios.post(`${API}/hero/admin/videos/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Hero video uploaded');
      setTitle('');
      setStatus('active');
      setOrder(0);
      setFile(null);
      await fetchVideos();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleQuickUpdate = async (videoId, patch) => {
    try {
      await axios.put(`${API}/hero/admin/videos/${videoId}`, patch);
      await fetchVideos();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    }
  };

  const handleDelete = async (videoId) => {
    if (!confirm('Delete this hero video?')) return;
    try {
      await axios.delete(`${API}/hero/admin/videos/${videoId}`);
      toast.success('Video deleted');
      await fetchVideos();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            Hero Video Slider
          </h1>
          <p className="text-slate-600">Upload and manage videos shown on the landing page hero.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload new video</CardTitle>
            <CardDescription>Allowed: MP4/WebM (max 50MB). Videos autoplay muted on the landing hero.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <Label htmlFor="hero-title">Title</Label>
                <Input id="hero-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hiring success stories" />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <Label htmlFor="hero-order">Order</Label>
                <Input
                  id="hero-order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="hero-file">Video file</Label>
                <Input
                  id="hero-file"
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="md:col-span-1">
                <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current hero videos</CardTitle>
            <CardDescription>Lower order shows first. Set inactive to hide without deleting.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVideos.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <video
                          src={v.url?.startsWith('http') ? v.url : `${API_BASE}${v.url}`}
                          className="w-40 h-24 object-cover rounded border border-slate-200"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <Input
                          value={v.title || ''}
                          onChange={(e) => handleQuickUpdate(v.id, { title: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <select
                          value={v.status || 'active'}
                          onChange={(e) => handleQuickUpdate(v.id, { status: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </TableCell>
                      <TableCell className="w-28">
                        <Input
                          type="number"
                          value={v.order ?? 0}
                          onChange={(e) => handleQuickUpdate(v.id, { order: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(v.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedVideos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-10">
                        No hero videos yet. Upload one above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HeroVideoManagement;

