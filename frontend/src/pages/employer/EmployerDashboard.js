import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Briefcase, 
  Users, 
  Clock, 
  CheckCircle,
  Plus,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const EmployerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, applications: 0 });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API}/employer/jobs`);
      setJobs(response.data);
      
      const total = response.data.length;
      const approved = response.data.filter(j => j.status === 'approved').length;
      const pending = response.data.filter(j => j.status === 'pending').length;
      
      setStats({ total, approved, pending, applications: 0 });
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.status === 'pending') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">Account Pending Approval</h2>
            <p className="mt-2 text-slate-600 max-w-md">
              Your employer account is under review. You'll be able to post jobs once approved.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }} data-testid="employer-dashboard-title">
              Employer Dashboard
            </h1>
            <p className="text-slate-600">Manage your job postings and applicants</p>
          </div>
          <Button onClick={() => navigate('/employer/jobs/new')} data-testid="post-job-btn">
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Jobs</CardTitle>
              <Briefcase className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle>
              <Users className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.applications}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Job Postings</CardTitle>
              <CardDescription>Your latest job listings</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => navigate('/employer/jobs')} data-testid="view-all-jobs">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
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
              <div className="space-y-4">
                {jobs.slice(0, 5).map((job) => (
                  <div 
                    key={job.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/employer/jobs/${job.id}/applicants`)}
                  >
                    <div>
                      <h3 className="font-medium text-slate-900">{job.title}</h3>
                      <p className="text-sm text-slate-500">{job.location} • {job.job_type}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`badge-${job.status}`}>{job.status}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
