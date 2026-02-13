import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Users, 
  Building2, 
  ArrowRight,
  ChevronRight,
  Star,
  TrendingUp,
  Shield,
  Clock,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [stats, setStats] = useState({ jobs: 0, companies: 0, candidates: 0 });
  const [heroVideos, setHeroVideos] = useState([]);
  const [activeHeroVideo, setActiveHeroVideo] = useState(0);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchFeaturedJobs();
    fetchHeroVideos();
  }, []);

  const fetchFeaturedJobs = async () => {
    try {
      const response = await axios.get(`${API}/jobs?limit=6`);
      setFeaturedJobs(response.data);
      setStats({
        jobs: response.data.length * 10 + 150,
        companies: Math.floor(response.data.length * 2 + 50),
        candidates: response.data.length * 100 + 1000
      });
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchHeroVideos = async () => {
    try {
      const base = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
      const res = await axios.get(`${base.replace(/\/$/, '')}/api/hero/videos`);
      setHeroVideos(res.data || []);
      setActiveHeroVideo(0);
    } catch (e) {
      setHeroVideos([]);
    }
  };

  useEffect(() => {
    if (!heroVideos || heroVideos.length <= 1) return;
    const t = setInterval(() => {
      setActiveHeroVideo((i) => (i + 1) % heroVideos.length);
    }, 33000);
    return () => clearInterval(t);
  }, [heroVideos]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (location) params.set('location', location);
    navigate(`/jobs?${params.toString()}`);
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

  const categories = [
    { icon: '💻', name: 'Technology', count: '2,450+' },
    { icon: '📊', name: 'Finance', count: '1,200+' },
    { icon: '🎨', name: 'Design', count: '980+' },
    { icon: '📈', name: 'Marketing', count: '1,100+' },
    { icon: '🏥', name: 'Healthcare', count: '750+' },
    { icon: '📚', name: 'Education', count: '620+' },
  ];

  return (
    <div className="min-h-screen bg-white">
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

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/jobs" className="text-slate-600 hover:text-slate-900 font-medium" data-testid="nav-find-jobs">Find Jobs</Link>
              <Link to="/blog" className="text-slate-600 hover:text-slate-900 font-medium">Blog</Link>
              <Link to="/about" className="text-slate-600 hover:text-slate-900 font-medium">About</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="theme-toggle-landing"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-slate-600" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </Button>
              {user ? (
                <Button onClick={() => navigate(getDashboardLink())} data-testid="dashboard-button">
                  Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')} data-testid="login-button">
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/register')} data-testid="register-button">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with background video */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background video (no dark overlay for full brightness) */}
        {heroVideos.length > 0 && (
          <video
            key={heroVideos[activeHeroVideo]?.id || activeHeroVideo}
            src={`${(process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '')}${
              heroVideos[activeHeroVideo]?.url || ''
            }`}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}

        <div className="section-container relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight"
              style={{ fontFamily: 'Manrope' }}
            >
              Find Your Dream Job
              <span className="text-indigo-300"> Today</span>
            </h1>
            <p className="mt-6 text-lg text-slate-200 max-w-2xl mx-auto">
              Connect with top employers and discover opportunities that match your skills and aspirations. Your next
              career move starts here.
            </p>

            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="mt-10 p-4 bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-200"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 border-slate-200"
                    data-testid="search-input"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="City or remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-12 h-12 border-slate-200"
                    data-testid="location-input"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-8" data-testid="search-button">
                  <Search className="w-5 h-5 mr-2" />
                  Search Jobs
                </Button>
              </div>
            </form>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-300">{stats.jobs}+</p>
                <p className="text-slate-200">Active Jobs</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-300">{stats.companies}+</p>
                <p className="text-slate-200">Companies</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-300">{stats.candidates}+</p>
                <p className="text-slate-200">Job Seekers</p>
              </div>
            </div>

            {/* Dots for multiple videos */}
            {heroVideos.length > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {heroVideos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveHeroVideo(idx)}
                    className={`h-2.5 w-2.5 rounded-full ${
                      idx === activeHeroVideo ? 'bg-indigo-400' : 'bg-white/50'
                    }`}
                    aria-label={`Go to video ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-slate-50">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>Popular Categories</h2>
            <p className="mt-3 text-slate-600">Explore opportunities across industries</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/jobs?search=${category.name}`}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg hover:border-indigo-300 border border-slate-200 transition-all"
                data-testid={`category-${category.name.toLowerCase()}`}
              >
                <span className="text-4xl">{category.icon}</span>
                <h3 className="mt-4 font-semibold text-slate-900">{category.name}</h3>
                <p className="text-sm text-slate-500">{category.count} jobs</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      {featuredJobs.length > 0 && (
        <section className="py-20">
          <div className="section-container">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>Featured Jobs</h2>
                <p className="mt-2 text-slate-600">Latest opportunities from top companies</p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/jobs')} data-testid="view-all-jobs">
                View All Jobs
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.slice(0, 6).map((job) => (
                <div
                  key={job.id}
                  className="job-card"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  data-testid={`job-card-${job.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      {job.job_type}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900 text-lg">{job.title}</h3>
                  <p className="text-slate-600">{job.company}</p>
                  <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Manrope' }}>Why Choose JobNexus?</h2>
            <p className="mt-3 text-slate-400">Everything you need for a successful job search</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* <div className="text-center p-8 border-2 border-white rounded-[30px] "> */}
            <div className="text-center p-8 border-2 border-red-100 rounded-[20px] hover:bg-gray-600 hover:text-black transition duration-300">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Verified Employers</h3>
              <p className="mt-3 text-slate-400">All employers go through our verification process to ensure legitimate opportunities.</p>
            </div>
            <div className="text-center p-8 border-2 border-red-100 rounded-[20px] hover:bg-gray-600 hover:text-black transition duration-300">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Quick Apply</h3>
              <p className="mt-3 text-slate-400">Apply to multiple jobs with a single profile. Track all your applications in one place.</p>
            </div>
            <div className="text-center p-8 border-2 border-red-100 rounded-[20px] hover:bg-gray-600 hover:text-black transition duration-300">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Top Companies</h3>
              <p className="mt-3 text-slate-400">Connect with industry-leading companies actively hiring top talent like you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="section-container">
          <div className="bg-indigo-600 rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Manrope' }}>Ready to Get Started?</h2>
            <p className="mt-4 text-indigo-100 max-w-2xl mx-auto">
              Join thousands of professionals who have found their dream jobs through JobNexus.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/register?role=candidate')}
                data-testid="cta-find-jobs"
              >
                <Users className="w-5 h-5 mr-2" />
                Find Jobs
              </Button>
              <Button 
                size="lg" 
                className="bg-white text-indigo-600 hover:bg-indigo-50"
                onClick={() => navigate('/register?role=employer')}
                data-testid="cta-post-jobs"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Post Jobs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="section-container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope' }}>JobNexus</span>
            </div>
            <p className="text-sm">© 2024 JobNexus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
