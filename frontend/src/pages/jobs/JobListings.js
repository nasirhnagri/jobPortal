import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  Search, 
  MapPin, 
  Building2, 
  Briefcase, 
  Clock, 
  TrendingUp,
  Filter,
  X,
  ArrowRight
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const JobListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    jobType: searchParams.get('job_type') || ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [searchParams]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.get('search')) params.append('search', searchParams.get('search'));
      if (searchParams.get('location')) params.append('location', searchParams.get('location'));
      if (searchParams.get('job_type')) params.append('job_type', searchParams.get('job_type'));
      
      const response = await axios.get(`${API}/jobs?${params.toString()}`);
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.location) params.set('location', filters.location);
    if (filters.jobType) params.set('job_type', filters.jobType);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ search: '', location: '', jobType: '' });
    setSearchParams(new URLSearchParams());
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    const routes = {
      superadmin: '/admin',
      subadmin: '/admin',
      employer: '/employer',
      candidate: '/candidate'
    };
    return routes[user.role] || '/';
  };

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
                <Button onClick={() => navigate(getDashboardLink())} data-testid="dashboard-btn">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')} data-testid="login-btn">
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/register')} data-testid="register-btn">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="section-container">
          <h1 className="text-3xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Manrope' }}>
            Find Your Perfect Job
          </h1>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 h-11"
                  data-testid="search-input"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="City or remote"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="pl-10 h-11"
                  data-testid="location-input"
                />
              </div>
              <Select value={filters.jobType} onValueChange={(value) => setFilters({ ...filters, jobType: value })}>
                <SelectTrigger className="w-full md:w-48 h-11" data-testid="job-type-select">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="h-11" data-testid="search-btn">
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>

            {(filters.search || filters.location || filters.jobType) && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Active filters:</span>
                {filters.search && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                    {filters.search}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, search: '' })} />
                  </span>
                )}
                {filters.location && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                    {filters.location}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, location: '' })} />
                  </span>
                )}
                {filters.jobType && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                    {filters.jobType}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, jobType: '' })} />
                  </span>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="clear-filters">
                  Clear all
                </Button>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Jobs List */}
      <section className="py-8">
        <div className="section-container">
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-600">
              {loading ? 'Loading...' : `${jobs.length} jobs found`}
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-slate-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-6 bg-slate-200 rounded w-1/3 mb-2" />
                      <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
                      <div className="h-4 bg-slate-200 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-16 h-16 text-slate-300 mx-auto" />
              <h3 className="mt-4 text-xl font-semibold text-slate-900">No jobs found</h3>
              <p className="mt-2 text-slate-600">Try adjusting your search criteria</p>
              <Button variant="outline" onClick={clearFilters} className="mt-4" data-testid="clear-search">
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl p-6 border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  data-testid={`job-listing-${job.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                          <p className="text-slate-600">{job.company}</p>
                        </div>
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full whitespace-nowrap">
                          {job.job_type}
                        </span>
                      </div>
                      <p className="mt-3 text-slate-600 line-clamp-2">{job.description}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        {job.salary && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {job.salary}
                          </span>
                        )}
                        {job.experience_level && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.experience_level}
                          </span>
                        )}
                      </div>
                      {job.skills && job.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {job.skills.slice(0, 5).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 5 && (
                            <span className="px-2 py-1 text-slate-500 text-xs">
                              +{job.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
