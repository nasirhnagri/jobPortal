import { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Search, Users, CheckCircle, XCircle, Ban, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await axios.get(`${API}/admin/users?${params.toString()}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await axios.put(`${API}/admin/user/${userId}/block`);
      toast.success('User blocked successfully');
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to block user';
      toast.error(message);
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await axios.put(`${API}/admin/user/${userId}/activate`);
      toast.success('User activated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const colors = {
      subadmin: 'bg-purple-100 text-purple-700',
      employer: 'bg-blue-100 text-blue-700',
      candidate: 'bg-emerald-100 text-emerald-700'
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            User Management
          </h1>
          <p className="text-slate-600">Manage all user accounts on the platform</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View and manage user accounts</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                    data-testid="search-users-input"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="role-filter">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="subadmin">Sub-Admin</SelectItem>
                    <SelectItem value="employer">Employer</SelectItem>
                    <SelectItem value="candidate">Candidate</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="mt-4 text-slate-600">No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`badge-${user.status}`}>
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.status === 'blocked' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 hover:text-emerald-700"
                            onClick={() => handleActivateUser(user.id)}
                            data-testid={`activate-user-${user.id}`}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Activate
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleBlockUser(user.id)}
                            data-testid={`block-user-${user.id}`}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Block
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
