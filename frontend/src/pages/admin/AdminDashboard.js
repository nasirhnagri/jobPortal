import { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  Building2, 
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  ArrowRight
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [pendingEmployers, setPendingEmployers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, jobsRes, employersRes] = await Promise.all([
        axios.get(`${API}/admin/analytics`),
        axios.get(`${API}/admin/jobs/pending`),
        axios.get(`${API}/admin/employers/pending`)
      ]);
      setAnalytics(analyticsRes.data);
      setPendingJobs(jobsRes.data.slice(0, 5));
      setPendingEmployers(employersRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveJob = async (jobId) => {
    try {
      await axios.put(`${API}/admin/jobs/${jobId}/approve`);
      setPendingJobs(prev => prev.filter(job => job.id !== jobId));
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to approve job:', error);
    }
  };

  const handleApproveEmployer = async (employerId) => {
    try {
      await axios.put(`${API}/admin/employer/${employerId}/approve`);
      setPendingEmployers(prev => prev.filter(emp => emp.id !== employerId));
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to approve employer:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }} data-testid="admin-dashboard-title">
            Admin Dashboard
          </h1>
          <p className="text-slate-600">Overview of your job portal</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
              <Users className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-total-users">{analytics?.users?.total || 0}</div>
              <p className="text-xs text-slate-500 mt-1">
                {analytics?.users?.candidates || 0} candidates, {analytics?.users?.employers || 0} employers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Jobs</CardTitle>
              <Briefcase className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-total-jobs">{analytics?.jobs?.total || 0}</div>
              <p className="text-xs text-slate-500 mt-1">
                {analytics?.jobs?.approved || 0} approved, {analytics?.jobs?.pending || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Employers</CardTitle>
              <Building2 className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-active-employers">{analytics?.users?.active_employers || 0}</div>
              <p className="text-xs text-slate-500 mt-1">
                {analytics?.users?.pending_employers || 0} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Applications</CardTitle>
              <FileText className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-applications">{analytics?.applications?.total || 0}</div>
              <p className="text-xs text-slate-500 mt-1">
                {analytics?.users?.subadmins || 0} sub-admins
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Jobs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Pending Jobs
                </CardTitle>
                <CardDescription>Jobs waiting for approval</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/jobs')} data-testid="view-all-jobs-btn">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {pendingJobs.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No pending jobs</p>
              ) : (
                <div className="space-y-3">
                  {pendingJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{job.title}</p>
                        <p className="text-sm text-slate-500">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleApproveJob(job.id)}
                          data-testid={`approve-job-${job.id}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Employers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  Pending Employers
                </CardTitle>
                <CardDescription>Employers waiting for approval</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/employers')} data-testid="view-all-employers-btn">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {pendingEmployers.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No pending employers</p>
              ) : (
                <div className="space-y-3">
                  {pendingEmployers.map((employer) => (
                    <div key={employer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{employer.name}</p>
                        <p className="text-sm text-slate-500">{employer.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleApproveEmployer(employer.id)}
                          data-testid={`approve-employer-${employer.id}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
