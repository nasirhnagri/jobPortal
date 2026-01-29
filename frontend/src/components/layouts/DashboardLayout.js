import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  UserCheck,
  BarChart3,
  ClipboardList,
  UserCircle,
  Search,
  Bell
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const getNavItems = (role, permissions = []) => {
  const adminItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: Users, label: 'Sub Admins', href: '/admin/subadmins', superadminOnly: true },
    { icon: Building2, label: 'Employers', href: '/admin/employers', permission: 'APPROVE_EMPLOYERS' },
    { icon: UserCheck, label: 'Users', href: '/admin/users', permission: 'MANAGE_USERS' },
    { icon: Briefcase, label: 'Jobs', href: '/admin/jobs', permission: 'MANAGE_JOBS' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics', permission: 'VIEW_REPORTS' },
  ];

  const employerItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/employer' },
    { icon: Building2, label: 'Company Profile', href: '/employer/profile' },
    { icon: Briefcase, label: 'My Jobs', href: '/employer/jobs' },
    { icon: ClipboardList, label: 'Applications', href: '/employer/applications' },
  ];

  const candidateItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/candidate' },
    { icon: UserCircle, label: 'My Profile', href: '/candidate/profile' },
    { icon: Search, label: 'Find Jobs', href: '/jobs' },
    { icon: FileText, label: 'My Applications', href: '/candidate/applications' },
  ];

  if (role === 'superadmin') {
    return adminItems.filter(item => !item.permission || true);
  }
  if (role === 'subadmin') {
    return adminItems.filter(item => {
      if (item.superadminOnly) return false;
      if (!item.permission) return true;
      return permissions.includes(item.permission);
    });
  }
  if (role === 'employer') return employerItems;
  if (role === 'candidate') return candidateItems;
  return [];
};

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = getNavItems(user?.role, user?.permissions);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleLabel = (role) => {
    const labels = {
      superadmin: 'Super Admin',
      subadmin: 'Sub Admin',
      employer: 'Employer',
      candidate: 'Job Seeker'
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'Manrope' }}>JobNexus</span>
            </Link>
            <button 
              className="lg:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/admin' && item.href !== '/employer' && item.href !== '/candidate' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{getRoleLabel(user?.role)}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between h-full px-4 sm:px-6">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setSidebarOpen(true)}
              data-testid="mobile-menu-button"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative" data-testid="notifications-button">
                <Bell className="w-5 h-5 text-slate-500" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-button">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/')} data-testid="menu-home">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Home
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="menu-logout">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="animate-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
