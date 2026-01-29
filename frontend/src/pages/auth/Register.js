import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Briefcase, Mail, Lock, User, ArrowRight, AlertCircle, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'candidate';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: defaultRole
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const user = await register(formData.name, formData.email, formData.password, formData.role);
      
      if (formData.role === 'employer') {
        toast.success('Registration successful! Your account is pending approval.');
        navigate('/employer/pending');
      } else {
        toast.success('Welcome to JobNexus!');
        navigate('/candidate');
      }
    } catch (err) {
      const message = err.response?.data?.detail || 'Registration failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>JobNexus</span>
          </Link>

          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>Create an account</h1>
          <p className="mt-2 text-slate-600">Join JobNexus and start your journey</p>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Role Selection */}
            <div className="form-group">
              <Label className="form-label mb-3 block">I want to</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                className="grid grid-cols-2 gap-4"
              >
                <div className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.role === 'candidate' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <RadioGroupItem value="candidate" id="candidate" className="sr-only" />
                  <label htmlFor="candidate" className="flex flex-col items-center cursor-pointer">
                    <Users className={`w-8 h-8 ${formData.role === 'candidate' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={`mt-2 font-medium ${formData.role === 'candidate' ? 'text-indigo-600' : 'text-slate-600'}`}>Find Jobs</span>
                  </label>
                </div>
                <div className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.role === 'employer' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <RadioGroupItem value="employer" id="employer" className="sr-only" />
                  <label htmlFor="employer" className="flex flex-col items-center cursor-pointer">
                    <Building2 className={`w-8 h-8 ${formData.role === 'employer' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={`mt-2 font-medium ${formData.role === 'employer' ? 'text-indigo-600' : 'text-slate-600'}`}>Post Jobs</span>
                  </label>
                </div>
              </RadioGroup>
            </div>

            <div className="form-group">
              <Label htmlFor="name" className="form-label">Full name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 h-11"
                  required
                  data-testid="name-input"
                />
              </div>
            </div>

            <div className="form-group">
              <Label htmlFor="email" className="form-label">Email address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-11"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="form-group">
              <Label htmlFor="password" className="form-label">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 h-11"
                  required
                  data-testid="password-input"
                />
              </div>
            </div>

            <div className="form-group">
              <Label htmlFor="confirmPassword" className="form-label">Confirm password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10 h-11"
                  required
                  data-testid="confirm-password-input"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading} data-testid="register-submit">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {formData.role === 'employer' && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Employer accounts require admin approval before you can post jobs.
              </p>
            </div>
          )}

          <p className="mt-8 text-center text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium" data-testid="login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:flex flex-1 bg-indigo-600 items-center justify-center p-12">
        <div className="max-w-lg text-center text-white">
          <h2 className="text-4xl font-bold" style={{ fontFamily: 'Manrope' }}>
            Start Your Journey
          </h2>
          <p className="mt-4 text-indigo-100 text-lg">
            Whether you're looking for your next opportunity or seeking top talent, JobNexus connects you with the right match.
          </p>
          <img 
            src="https://images.unsplash.com/photo-1758518729685-f88df7890776?crop=entropy&cs=srgb&fm=jpg&q=85&w=600" 
            alt="Office collaboration"
            className="mt-8 rounded-2xl shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};
