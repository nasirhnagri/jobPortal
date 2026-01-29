import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Plus, Briefcase, Eye, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const EmployerJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API}/employer/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await axios.delete(`${API}/employer/jobs/${jobId}`);
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
              My Jobs
            </h1>
            <p className="text-slate-600">Manage your job postings</p>
          </div>
          <Button onClick={() => navigate('/employer/jobs/new')} data-testid="post-new-job-btn">
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Listings</CardTitle>
            <CardDescription>All your job postings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="mt-4 text-slate-600">No job postings yet</p>
                <Button onClick={() => navigate('/employer/jobs/new')} className="mt-4">
                  Post Your First Job
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>{job.job_type}</TableCell>
                      <TableCell>
                        <span className={`badge-${job.status}`}>{job.status}</span>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(job.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/employer/jobs/${job.id}/applicants`)}
                            data-testid={`view-applicants-${job.id}`}
                          >
                            <Users className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(job.id)}
                            data-testid={`delete-job-${job.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
