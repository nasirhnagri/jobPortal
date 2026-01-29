import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { ArrowLeft, Users, Mail, Phone, MapPin, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const JobApplicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const fetchApplicants = async () => {
    try {
      const response = await axios.get(`${API}/employer/jobs/${jobId}/applicants`);
      setApplicants(response.data);
    } catch (error) {
      console.error('Failed to fetch applicants:', error);
      toast.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, status) => {
    try {
      await axios.put(`${API}/employer/applications/${applicationId}/status`, { status });
      toast.success('Application status updated');
      fetchApplicants();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      reviewed: 'bg-blue-100 text-blue-700',
      shortlisted: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      hired: 'bg-purple-100 text-purple-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/employer/jobs')} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            Job Applicants
          </h1>
          <p className="text-slate-600">Review and manage applications</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applicants.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="mt-4 text-slate-600">No applicants yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {applicants.map((applicant) => (
              <Card key={applicant.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-lg">
                            {applicant.candidate_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{applicant.candidate_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Mail className="w-4 h-4" />
                            {applicant.candidate_email}
                          </div>
                        </div>
                      </div>

                      {applicant.candidate_profile && (
                        <div className="mt-4 space-y-2">
                          {applicant.candidate_profile.headline && (
                            <p className="text-slate-700 font-medium">{applicant.candidate_profile.headline}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                            {applicant.candidate_profile.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {applicant.candidate_profile.location}
                              </span>
                            )}
                            {applicant.candidate_profile.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {applicant.candidate_profile.phone}
                              </span>
                            )}
                          </div>
                          {applicant.candidate_profile.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {applicant.candidate_profile.skills.slice(0, 5).map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                          {applicant.candidate_profile.resume_url && (
                            <a
                              href={applicant.candidate_profile.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm mt-2"
                            >
                              <FileText className="w-4 h-4" />
                              View Resume
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}

                      {applicant.cover_letter && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-700 mb-2">Cover Letter</p>
                          <p className="text-sm text-slate-600">{applicant.cover_letter}</p>
                        </div>
                      )}

                      <p className="text-xs text-slate-400 mt-4">
                        Applied on {new Date(applicant.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(applicant.status)}`}>
                        {applicant.status}
                      </span>
                      <Select value={applicant.status} onValueChange={(value) => handleStatusChange(applicant.id, value)}>
                        <SelectTrigger className="w-40" data-testid={`status-select-${applicant.id}`}>
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
