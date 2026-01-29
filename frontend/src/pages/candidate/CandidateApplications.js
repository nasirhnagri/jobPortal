import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FileText, Building2, MapPin, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CandidateApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API}/candidate/applications`);
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    
    try {
      await axios.delete(`${API}/candidate/applications/${applicationId}`);
      toast.success('Application withdrawn');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to withdraw application');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      reviewed: 'bg-blue-100 text-blue-700 border-blue-200',
      shortlisted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      hired: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            My Applications
          </h1>
          <p className="text-slate-600">Track the status of your job applications</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="mt-4 text-slate-600">No applications yet</p>
                <Button onClick={() => navigate('/jobs')} className="mt-4" data-testid="find-jobs-btn">
                  Find Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{app.job_title}</h3>
                        <p className="text-slate-600">{app.company}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          Applied on {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(app.status)}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/jobs/${app.job_id}`)}
                          data-testid={`view-job-${app.id}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        {app.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleWithdraw(app.id)}
                            data-testid={`withdraw-${app.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {app.cover_letter && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 mb-1">Your Cover Letter</p>
                      <p className="text-sm text-slate-600 line-clamp-2">{app.cover_letter}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
