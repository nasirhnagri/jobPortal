import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  FileText, 
  Briefcase, 
  Clock, 
  CheckCircle,
  Search,
  ArrowRight,
  User
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CandidateDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, profileRes] = await Promise.all([
        axios.get(`${API}/candidate/applications`),
        axios.get(`${API}/candidate/profile`)
      ]);
      setApplications(appsRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  const isProfileComplete = profile && profile.headline && profile.skills?.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }} data-testid="candidate-dashboard-title">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-600">Track your job applications and find new opportunities</p>
        </div>

        {/* Profile Completion Banner */}
        {!isProfileComplete && (
          <Card className="bg-indigo-50 border-indigo-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-indigo-900">Complete your profile</p>
                    <p className="text-sm text-indigo-700">Stand out to employers by adding your skills and experience</p>
                  </div>
                </div>
                <Button onClick={() => navigate('/candidate/profile')} data-testid="complete-profile-btn">
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle>
              <FileText className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
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
              <CardTitle className="text-sm font-medium text-slate-600">Shortlisted</CardTitle>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{stats.shortlisted}</div>
            </CardContent>
          </Card>

          <Card className="bg-indigo-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100">Find your next role</p>
                  <p className="text-2xl font-bold mt-1">Browse Jobs</p>
                </div>
                <Button 
                  variant="secondary" 
                  size="icon"
                  onClick={() => navigate('/jobs')}
                  data-testid="browse-jobs-btn"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Track your job application status</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => navigate('/candidate/applications')} data-testid="view-all-applications">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="mt-4 text-slate-600">No applications yet</p>
                <Button onClick={() => navigate('/jobs')} className="mt-4">
                  Find Jobs
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => (
                  <div 
                    key={app.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-slate-900">{app.job_title}</h3>
                      <p className="text-sm text-slate-500">{app.company}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`badge-${app.status}`}>{app.status}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(app.created_at).toLocaleDateString()}
                      </span>
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
