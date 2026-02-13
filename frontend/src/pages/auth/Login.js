import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Briefcase, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { toast } from 'sonner';

export const Login = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      toast.success('Welcome back!');
      
      // Navigate based on role
      const routes = {
        superadmin: '/admin',
        subadmin: '/admin',
        employer: user.status === 'pending' ? '/employer/pending' : '/employer',
        candidate: '/candidate'
      };
      navigate(routes[user.role] || from);
    } catch (err) {
      const message = err.message || err.response?.data?.detail || 'Invalid credentials';
      const displayMessage = typeof message === 'string' ? message : (Array.isArray(message) ? message.map(m => m.msg || m).join(', ') : 'Invalid credentials');
      setError(displayMessage);
      toast.error(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>JobNexus</span>
          </Link>

          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>Welcome back</h1>
          <p className="mt-2 text-slate-600">Sign in to your account to continue</p>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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

            <Button type="submit" className="w-full h-11" disabled={loading} data-testid="login-submit">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Google login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
                <GoogleLogin
                  onSuccess={async (res) => {
                    try {
                      const cred = res.credential;
                      if (!cred) {
                        toast.error('Google login failed. No credential.');
                        return;
                      }
                      const user = await googleLogin(cred, 'candidate');
                      toast.success('Signed in with Google');
                      const routes = {
                        superadmin: '/admin',
                        subadmin: '/admin',
                        employer: user.status === 'pending' ? '/employer/pending' : '/employer',
                        candidate: '/candidate',
                      };
                      navigate(routes[user.role] || from);
                    } catch (err) {
                      toast.error(err.message || 'Google login failed');
                    }
                  }}
                  onError={() => toast.error('Google login failed')}
                  useOneTap={false}
                />
              </GoogleOAuthProvider>
            </div>
          </div>

          <p className="mt-8 text-center text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium" data-testid="register-link">
              Sign up
            </Link>
          </p>

          <p className="mt-2 text-center text-slate-500 text-sm">
            <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Forgot your password?
            </Link>
          </p>

          {/* <div className="mt-8 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Demo Credentials:</p>
            <p className="text-sm text-slate-600">Super Admin: admin@jobconnect.com / Admin@123</p>
          </div> */}
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:flex flex-1 bg-indigo-600 items-center justify-center p-12">
        <div className="max-w-lg text-center text-white">
          <h2 className="text-4xl font-bold" style={{ fontFamily: 'Manrope' }}>
            Your Dream Career Awaits
          </h2>
          <p className="mt-4 text-indigo-100 text-lg">
            Connect with top employers and find opportunities that match your skills and aspirations.
          </p>
          <img 
            src="https://images.unsplash.com/photo-1758518731468-98e90ffd7430?crop=entropy&cs=srgb&fm=jpg&q=85&w=600" 
            alt="Team collaboration"
            className="mt-8 rounded-2xl shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};
