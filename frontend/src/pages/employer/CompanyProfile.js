import { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Building2, Globe, MapPin, Users, Save } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CompanyProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    company_name: '',
    company_description: '',
    company_website: '',
    company_location: '',
    company_size: '',
    company_logo: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/employer/profile`);
      if (response.data && Object.keys(response.data).length > 0) {
        setProfile(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/employer/profile`, profile);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            Company Profile
          </h1>
          <p className="text-slate-600">Manage your company information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </CardTitle>
            <CardDescription>This information will be shown to job seekers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={profile.company_name}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                placeholder="Enter company name"
                data-testid="company-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_description">Company Description</Label>
              <Textarea
                id="company_description"
                value={profile.company_description}
                onChange={(e) => setProfile({ ...profile, company_description: e.target.value })}
                placeholder="Tell job seekers about your company..."
                rows={4}
                data-testid="company-description-input"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_website" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </Label>
                <Input
                  id="company_website"
                  value={profile.company_website}
                  onChange={(e) => setProfile({ ...profile, company_website: e.target.value })}
                  placeholder="https://example.com"
                  data-testid="company-website-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="company_location"
                  value={profile.company_location}
                  onChange={(e) => setProfile({ ...profile, company_location: e.target.value })}
                  placeholder="City, Country"
                  data-testid="company-location-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_size" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Company Size
              </Label>
              <Input
                id="company_size"
                value={profile.company_size}
                onChange={(e) => setProfile({ ...profile, company_size: e.target.value })}
                placeholder="e.g., 50-100, 100-500"
                data-testid="company-size-input"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} data-testid="save-profile-btn">
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
