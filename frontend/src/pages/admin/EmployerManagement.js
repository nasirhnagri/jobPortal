import { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Building2, CheckCircle, XCircle, Mail, Globe } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const EmployerManagement = () => {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployers();
  }, []);

  const fetchEmployers = async () => {
    try {
      const response = await axios.get(`${API}/admin/employers/pending`);
      setEmployers(response.data);
    } catch (error) {
      console.error('Failed to fetch employers:', error);
      toast.error('Failed to load employers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (employerId) => {
    try {
      await axios.put(`${API}/admin/employer/${employerId}/approve`);
      toast.success('Employer approved successfully');
      fetchEmployers();
    } catch (error) {
      toast.error('Failed to approve employer');
    }
  };

  const handleReject = async (employerId) => {
    try {
      await axios.put(`${API}/admin/employer/${employerId}/reject`);
      toast.success('Employer rejected');
      fetchEmployers();
    } catch (error) {
      toast.error('Failed to reject employer');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            Employer Approvals
          </h1>
          <p className="text-slate-600">Review and approve employer registrations</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Employers</CardTitle>
            <CardDescription>Employers waiting for account approval</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : employers.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="mt-4 text-slate-600">No pending employer approvals</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employers.map((employer) => (
                    <TableRow key={employer.id}>
                      <TableCell className="font-medium">{employer.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {employer.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {employer.profile?.company_name || (
                          <span className="text-slate-400 text-sm">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(employer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleApprove(employer.id)}
                            data-testid={`approve-employer-${employer.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleReject(employer.id)}
                            data-testid={`reject-employer-${employer.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
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
