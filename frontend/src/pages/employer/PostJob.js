import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Briefcase, MapPin, DollarSign, Clock, X } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const PostJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    salary: '',
    job_type: 'full-time',
    experience_level: '',
    skills: []
  });

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.company || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/employer/jobs`, formData);
      toast.success('Job posted successfully! Pending admin approval.');
      navigate('/employer/jobs');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to post job';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            Post a New Job
          </h1>
          <p className="text-slate-600">Create a new job posting for your company</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Job Details
              </CardTitle>
              <CardDescription>Fill in the details about the position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  data-testid="job-title-input"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Enter company name"
                  data-testid="job-company-input"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={6}
                  data-testid="job-description-input"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location *
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., New York, NY or Remote"
                    data-testid="job-location-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Salary Range
                  </Label>
                  <Input
                    id="salary"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="e.g., $80,000 - $120,000"
                    data-testid="job-salary-input"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Type *</Label>
                  <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value })}>
                    <SelectTrigger data-testid="job-type-select">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Experience Level
                  </Label>
                  <Select value={formData.experience_level} onValueChange={(value) => setFormData({ ...formData, experience_level: value })}>
                    <SelectTrigger data-testid="experience-level-select">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead/Manager</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skills</Label>
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
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                        {skill}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/employer/jobs')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} data-testid="submit-job-btn">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Post Job'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
};
