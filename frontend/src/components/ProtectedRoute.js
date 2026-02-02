import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, roles = [], permissions = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardRoutes = {
      superadmin: '/admin',
      subadmin: '/admin',
      employer: '/employer',
      candidate: '/candidate'
    };
    return <Navigate to={dashboardRoutes[user.role] || '/'} replace />;
  }

  // For subadmins: require at least one of the given permissions (superadmin bypasses)
  if (user.role === 'subadmin' && permissions.length > 0) {
    const userPerms = user.permissions || [];
    const hasPermission = permissions.some((p) => userPerms.includes(p));
    if (!hasPermission) {
      return <Navigate to="/admin" replace />;
    }
  }

  // Check if employer is pending
  if (user.role === 'employer' && user.status === 'pending' && !location.pathname.includes('/pending')) {
    return <Navigate to="/employer/pending" replace />;
  }

  return children;
};
