import { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { User, Briefcase, MapPin, Phone, FileText, X, Save } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CandidateProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [profile, setProfile] = useState({
    headline: '',
    summary: '',
    skills: [],
    experience: '',
    education: '',
    resume_url: '',
    phone: '',
    location: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/candidate/profile`);
      if (response.data && Object.keys(response.data).length > 0) {
        setProfile(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/candidate/profile`, profile);
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
            My Profile
          </h1>
          <p className="text-slate-600">Update your professional profile to attract employers</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Professional Information
            </CardTitle>
            <CardDescription>This information will be shared with employers when you apply</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="headline">Professional Headline</Label>
              <Input
                id="headline"
                value={profile.headline}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                placeholder="e.g., Senior Software Engineer | React & Node.js Expert"
                data-testid="headline-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Professional Summary</Label>
              <Textarea
                id="summary"
                value={profile.summary}
                onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                placeholder="Brief overview of your experience and career goals..."
                rows={4}
                data-testid="summary-input"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  data-testid="phone-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="City, Country"
                  data-testid="location-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Skills
              </Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  data-testid="skill-input"
                />
                <Button type="button" variant="outline" onClick={addSkill}>
                  Add
                </Button>
              </div>
              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                      {skill}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Work Experience</Label>
              <Textarea
                id="experience"
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                placeholder="Describe your work experience..."
                rows={4}
                data-testid="experience-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <Textarea
                id="education"
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                placeholder="Your educational background..."
                rows={3}
                data-testid="education-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume_url" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Resume URL
              </Label>
              <Input
                id="resume_url"
                value={profile.resume_url}
                onChange={(e) => setProfile({ ...profile, resume_url: e.target.value })}
                placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
                data-testid="resume-url-input"
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
