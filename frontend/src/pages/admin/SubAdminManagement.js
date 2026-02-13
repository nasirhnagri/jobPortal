import { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PERMISSIONS = [
  { id: 'MANAGE_JOBS', label: 'Manage Jobs', description: 'Approve, edit, and delete job postings' },
  { id: 'MANAGE_USERS', label: 'Manage Users', description: 'View and manage user accounts' },
  { id: 'APPROVE_EMPLOYERS', label: 'Approve Employers', description: 'Review and approve employer accounts' },
  { id: 'VIEW_REPORTS', label: 'View Reports', description: 'Access analytics and reports' },
  { id: 'MANAGE_BLOG', label: 'Manage Blog', description: 'Create, edit, and publish blog posts' },
];

export const SubAdminManagement = () => {
  const { user } = useAuth();
  const [subadmins, setSubadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubadmin, setSelectedSubadmin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    permissions: []
  });

  useEffect(() => {
    fetchSubadmins();
  }, []);

  const fetchSubadmins = async () => {
    try {
      const response = await axios.get(`${API}/admin/subadmins`);
      setSubadmins(response.data);
    } catch (error) {
      console.error('Failed to fetch subadmins:', error);
      toast.error('Failed to load sub-admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubadmin = async () => {
    try {
      await axios.post(`${API}/admin/create-subadmin`, formData);
      toast.success('Sub-admin created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', permissions: [] });
      fetchSubadmins();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create sub-admin';
      toast.error(message);
    }
  };

  const handleUpdateSubadmin = async () => {
    try {
      await axios.put(`${API}/admin/subadmin/${selectedSubadmin.id}`, {
        name: formData.name,
        permissions: formData.permissions,
        status: selectedSubadmin.status
      });
      toast.success('Sub-admin updated successfully');
      setShowEditModal(false);
      fetchSubadmins();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to update sub-admin';
      toast.error(message);
    }
  };

  const handleDeleteSubadmin = async (id) => {
    if (!confirm('Are you sure you want to delete this sub-admin?')) return;
    
    try {
      await axios.delete(`${API}/admin/subadmin/${id}`);
      toast.success('Sub-admin deleted successfully');
      fetchSubadmins();
    } catch (error) {
      toast.error('Failed to delete sub-admin');
    }
  };

  const openEditModal = (subadmin) => {
    setSelectedSubadmin(subadmin);
    setFormData({
      name: subadmin.name,
      email: subadmin.email,
      password: '',
      permissions: subadmin.permissions || []
    });
    setShowEditModal(true);
  };

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  if (user?.role !== 'superadmin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="mt-4 text-xl font-semibold text-slate-900">Access Denied</h2>
            <p className="mt-2 text-slate-600">Only Super Admins can manage sub-admins</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
              Sub-Admin Management
            </h1>
            <p className="text-slate-600">Create and manage sub-administrator accounts</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} data-testid="create-subadmin-btn">
            <UserPlus className="w-4 h-4 mr-2" />
            Create Sub-Admin
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sub-Admins</CardTitle>
            <CardDescription>List of all sub-administrator accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : subadmins.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="mt-4 text-slate-600">No sub-admins created yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subadmins.map((subadmin) => (
                    <TableRow key={subadmin.id}>
                      <TableCell className="font-medium">{subadmin.name}</TableCell>
                      <TableCell>{subadmin.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {subadmin.permissions?.length > 0 ? (
                            subadmin.permissions.map((perm) => (
                              <span key={perm} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                                {PERMISSIONS.find((p) => p.id === perm)?.label || perm.replace(/_/g, ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-sm">No permissions</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`badge-${subadmin.status}`}>
                          {subadmin.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditModal(subadmin)}
                          data-testid={`edit-subadmin-${subadmin.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteSubadmin(subadmin.id)}
                          data-testid={`delete-subadmin-${subadmin.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sub-Admin</DialogTitle>
            <DialogDescription>
              Create a new sub-administrator account with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                data-testid="subadmin-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                data-testid="subadmin-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                data-testid="subadmin-password-input"
              />
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              {PERMISSIONS.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <Checkbox
                    id={permission.id}
                    checked={formData.permissions.includes(permission.id)}
                    onCheckedChange={() => togglePermission(permission.id)}
                    data-testid={`permission-${permission.id}`}
                  />
                  <div className="flex-1">
                    <label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                      {permission.label}
                    </label>
                    <p className="text-xs text-slate-500">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubadmin} data-testid="submit-create-subadmin">
              Create Sub-Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      {/* <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md ">
          <DialogHeader>
            <DialogTitle>Edit Sub-Admin</DialogTitle>
            <DialogDescription>
              Update sub-administrator details and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="edit-subadmin-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} disabled className="bg-slate-50" />
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              {PERMISSIONS.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <Checkbox
                    id={`edit-${permission.id}`}
                    checked={formData.permissions.includes(permission.id)}
                    onCheckedChange={() => togglePermission(permission.id)}
                  />
                  <div className="flex-1">
                    <label htmlFor={`edit-${permission.id}`} className="text-sm font-medium cursor-pointer">
                      {permission.label}
                    </label>
                    <p className="text-xs text-slate-500">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubadmin} data-testid="submit-edit-subadmin">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
  <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
    
    <DialogHeader>
      <DialogTitle>Edit Sub-Admin</DialogTitle>
      <DialogDescription>
        Update sub-administrator details and permissions
      </DialogDescription>
    </DialogHeader>

    {/* Scrollable Content Area */}
    <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
      
      <div className="space-y-2">
        <Label htmlFor="edit-name">Full Name</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          data-testid="edit-subadmin-name"
        />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={formData.email} disabled className="bg-slate-50" />
      </div>

      <div className="space-y-3">
        <Label>Permissions</Label>

        {PERMISSIONS.map((permission) => (
          <div
            key={permission.id}
            className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg"
          >
            <Checkbox
              id={`edit-${permission.id}`}
              checked={formData.permissions.includes(permission.id)}
              onCheckedChange={() =>
                togglePermission(permission.id)
              }
            />

            <div className="flex-1">
              <label
                htmlFor={`edit-${permission.id}`}
                className="text-sm font-medium cursor-pointer"
              >
                {permission.label}
              </label>
              <p className="text-xs text-slate-500">
                {permission.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Footer Fixed */}
    <DialogFooter className="pt-4 border-t">
      <Button
        variant="outline"
        onClick={() => setShowEditModal(false)}
      >
        Cancel
      </Button>
      <Button
        onClick={handleUpdateSubadmin}
        data-testid="submit-edit-subadmin"
      >
        Save Changes
      </Button>
    </DialogFooter>

  </DialogContent>
</Dialog>

    </DashboardLayout>
  );
};
