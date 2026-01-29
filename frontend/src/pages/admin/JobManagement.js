import { useState, useEffect } from 'react';
import axios from 'axios';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Briefcase, CheckCircle, XCircle, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const JobManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await axios.get(`${API}/admin/jobs/all${params}`);
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (jobId) => {
    try {
      await axios.put(`${API}/admin/jobs/${jobId}/approve`);
      toast.success('Job approved successfully');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to approve job');
    }
  };

  const handleReject = async (jobId) => {
    try {
      await axios.put(`${API}/admin/jobs/${jobId}/reject`);
      toast.success('Job rejected');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to reject job');
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await axios.delete(`${API}/admin/jobs/${jobId}`);
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-pending',
      approved: 'badge-approved',
      rejected: 'badge-rejected'
    };
    return badges[status] || 'badge-pending';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            Job Management
          </h1>
          <p className="text-slate-600">Review and manage job postings</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>All Jobs</CardTitle>
                <CardDescription>Approve or reject job postings</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="job-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="mt-4 text-slate-600">No jobs found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.company}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell className="text-sm">{job.job_type}</TableCell>
                      <TableCell>
                        <span className={getStatusBadge(job.status)}>
                          {job.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {job.employer_name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {job.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleApprove(job.id)}
                                data-testid={`approve-job-${job.id}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleReject(job.id)}
                                data-testid={`reject-job-${job.id}`}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-600"
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
