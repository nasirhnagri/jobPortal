import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  TrendingUp, 
  Clock, 
  Briefcase,
  Globe,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const JobDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetchJob();
    if (user?.role === 'candidate') {
      checkIfApplied();
    }
  }, [id, user]);

  const fetchJob = async () => {
    try {
      const response = await axios.get(`${API}/jobs/${id}`);
      setJob(response.data);
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast.error('Job not found');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const response = await axios.get(`${API}/candidate/applications`);
      const hasApplied = response.data.some(app => app.job_id === id);
      setApplied(hasApplied);
    } catch (error) {
      console.error('Failed to check application status:', error);
    }
  };

  const handleApply = async () => {
    if (!user) {
      toast.error('Please login to apply');
      navigate('/login', { state: { from: { pathname: `/jobs/${id}` } } });
      return;
    }

    if (user.role !== 'candidate') {
      toast.error('Only job seekers can apply for jobs');
      return;
    }

    setApplying(true);
    try {
      await axios.post(`${API}/candidate/applications`, {
        job_id: id,
        cover_letter: coverLetter
      });
      toast.success('Application submitted successfully!');
      setShowApplyModal(false);
      setApplied(true);
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to submit application';
      toast.error(message);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>JobNexus</span>
            </Link>

            <div className="flex items-center gap-3">
              {user ? (
                <Button onClick={() => navigate(user.role === 'candidate' ? '/candidate' : '/employer')} data-testid="dashboard-btn">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/register')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Back button */}
      <div className="section-container py-6">
        <Button variant="ghost" onClick={() => navigate('/jobs')} data-testid="back-btn">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>
      </div>

      {/* Job Details */}
      <div className="section-container pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }} data-testid="job-title">
                    {job.title}
                  </h1>
                  <p className="text-lg text-slate-600">{job.company}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      {job.job_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                {job.salary && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">{job.salary}</span>
                  </div>
                )}
                {job.experience_level && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">{job.experience_level}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Job Description</h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 whitespace-pre-wrap" data-testid="job-description">{job.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              {applied ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">Already Applied</h3>
                  <p className="mt-2 text-sm text-slate-600">You have already submitted an application for this job.</p>
                  <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/candidate/applications')} data-testid="view-applications-btn">
                    View My Applications
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => user?.role === 'candidate' ? setShowApplyModal(true) : handleApply()}
                    data-testid="apply-btn"
                  >
                    Apply Now
                  </Button>
                  {!user && (
                    <p className="mt-3 text-sm text-center text-slate-500">
                      You'll need to sign in to apply
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Company Info */}
            {job.company_profile && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">About {job.company}</h3>
                {job.company_profile.company_description && (
                  <p className="text-sm text-slate-600 mb-4">{job.company_profile.company_description}</p>
                )}
                <div className="space-y-3 text-sm">
                  {job.company_profile.company_location && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4" />
                      {job.company_profile.company_location}
                    </div>
                  )}
                  {job.company_profile.company_size && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4" />
                      {job.company_profile.company_size} employees
                    </div>
                  )}
                  {job.company_profile.company_website && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Globe className="w-4 h-4" />
                      <a href={job.company_profile.company_website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {job.title}</DialogTitle>
            <DialogDescription>
              Submit your application to {job.company}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cover Letter (Optional)
            </label>
            <Textarea
              placeholder="Write a brief cover letter explaining why you're a great fit for this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              data-testid="cover-letter-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={applying} data-testid="submit-application-btn">
              {applying ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
