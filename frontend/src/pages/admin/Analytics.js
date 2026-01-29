import { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Users, 
  Briefcase, 
  Building2, 
  FileText,
  TrendingUp,
  UserCheck,
  Clock,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/admin/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const userChartData = [
    { name: 'Candidates', value: analytics?.users?.candidates || 0 },
    { name: 'Employers', value: analytics?.users?.employers || 0 },
    { name: 'Sub-Admins', value: analytics?.users?.subadmins || 0 },
  ];

  const jobChartData = [
    { name: 'Approved', value: analytics?.jobs?.approved || 0 },
    { name: 'Pending', value: analytics?.jobs?.pending || 0 },
    { name: 'Rejected', value: analytics?.jobs?.rejected || 0 },
  ];

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            Analytics & Reports
          </h1>
          <p className="text-slate-600">Platform performance overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
              <Users className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.users?.total || 0}</div>
              <p className="text-xs text-emerald-600 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Active platform users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Jobs</CardTitle>
              <Briefcase className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.jobs?.total || 0}</div>
              <p className="text-xs text-slate-500 mt-1">
                {analytics?.jobs?.approved || 0} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Employers</CardTitle>
              <Building2 className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.users?.active_employers || 0}</div>
              <p className="text-xs text-amber-600 mt-1">
                <Clock className="w-3 h-3 inline mr-1" />
                {analytics?.users?.pending_employers || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Applications</CardTitle>
              <FileText className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.applications?.total || 0}</div>
              <p className="text-xs text-slate-500 mt-1">
                Total submissions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
              <CardDescription>Distribution of users across roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {userChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jobs by Status</CardTitle>
              <CardDescription>Current status of all job postings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jobChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-emerald-700">Active Candidates</p>
                  <p className="text-2xl font-bold text-emerald-900">{analytics?.users?.candidates || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-amber-700">Pending Jobs</p>
                  <p className="text-2xl font-bold text-amber-900">{analytics?.jobs?.pending || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-red-700">Rejected Jobs</p>
                  <p className="text-2xl font-bold text-red-900">{analytics?.jobs?.rejected || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
