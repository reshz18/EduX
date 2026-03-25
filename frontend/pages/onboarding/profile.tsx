import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/utils/api';
import { OnboardingData, UserRole } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

const EDUCATION_LEVELS = [
  "High School",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Professional",
  "Other",
];

const TEACHING_EXPERIENCE_OPTIONS = [
  'Less than 1 year',
  '1–3 years',
  '3–5 years',
  '5–10 years',
  '10+ years',
];

const STUDENT_INTERESTS = [
  'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
  'Artificial Intelligence', 'Cybersecurity', 'Cloud Computing', 'DevOps',
  'UI/UX Design', 'Digital Marketing', 'Business Analytics', 'Project Management',
  'Blockchain', 'Game Development', 'IoT', 'Robotics',
];

const SUBJECT_OPTIONS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'Web Development', 'Data Science', 'Machine Learning', 'Cybersecurity',
  'Business', 'Economics', 'History', 'Literature', 'Languages', 'Design', 'Other',
];

export default function ProfileCompletion() {
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: '',
    bio: '',
    interests: [],
    educationLevel: 'Other',
    skills: [],
    socialLinks: { github: '', linkedin: '', website: '' },
    location: '',
    institution: '',
    teachingExperience: '',
    subjectsTaught: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { darkMode } = useTheme();
  const { user, updateUser, loading } = useAuth();
  const router = useRouter();

  const isEducator = user?.role === UserRole.EDUCATOR;

  useEffect(() => {
    if (user?.isOnboarded) { router.push('/dashboard'); return; }
    if (!user && !loading) { router.push('/auth/login'); return; }
    if (user?.name) setFormData(prev => ({ ...prev, fullName: user.name }));
  }, [user, loading, router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [platform]: value } }));
  };

  const handleToggle = (field: 'interests' | 'subjectsTaught', value: string) => {
    setFormData(prev => {
      const current = (prev[field] || []) as string[];
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter(i => i !== value) : [...current, value],
      };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (formData.bio && formData.bio.length > 150) newErrors.bio = 'Bio must be less than 150 characters';

    if (isEducator) {
      if (!formData.institution?.trim()) newErrors.institution = 'Institution / Organisation is required';
      if (!formData.teachingExperience) newErrors.teachingExperience = 'Please select your teaching experience';
      if (!formData.subjectsTaught?.length) newErrors.subjectsTaught = 'Please select at least one subject';
    } else {
      if (!formData.interests?.length) newErrors.interests = 'Please select at least one interest';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        // backend still expects username — reuse the one from signup (already stored)
        username: user?.username,
      };
      const response = await api.post('/users/complete-profile', payload);
      if (response.data.user) {
        updateUser(response.data.user);
        router.replace('/dashboard');
      }
    } catch (error: any) {
      console.error('Error completing profile:', error);
      if (error.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => { apiErrors[err.param] = err.msg; });
        setErrors(apiErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const inputBase = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
    darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;
  const label = `block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-12 px-4`}>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Complete Your Profile
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isEducator
              ? 'Tell us about your teaching background'
              : 'Tell us more about yourself to personalise your learning experience'}
          </p>
          <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Full Name */}
              <div>
                <label className={label}>Full Name *</label>
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>

              {/* Bio */}
              <div>
                <label className={label}>Bio <span className="text-gray-400">(Optional)</span></label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder={isEducator ? 'Briefly describe your teaching philosophy...' : 'Tell us a bit about yourself...'}
                  rows={3}
                  maxLength={150}
                  className={`${inputBase} ${errors.bio ? 'border-red-500' : ''}`}
                />
                <div className="flex justify-between mt-1">
                  {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
                  <p className={`text-sm ml-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formData.bio?.length || 0}/150</p>
                </div>
              </div>

              {/* ── EDUCATOR FIELDS ── */}
              {isEducator && (
                <>
                  {/* Institution */}
                  <div>
                    <label className={label}>Institution / Organisation *</label>
                    <Input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => handleInputChange('institution', e.target.value)}
                      placeholder="e.g. MIT, Coursera, Self-employed"
                      className={errors.institution ? 'border-red-500' : ''}
                    />
                    {errors.institution && <p className="text-red-500 text-sm mt-1">{errors.institution}</p>}
                  </div>

                  {/* Teaching Experience */}
                  <div>
                    <label className={label}>Teaching Experience *</label>
                    <select
                      value={formData.teachingExperience}
                      onChange={(e) => handleInputChange('teachingExperience', e.target.value)}
                      className={`${inputBase} ${errors.teachingExperience ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select experience</option>
                      {TEACHING_EXPERIENCE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {errors.teachingExperience && <p className="text-red-500 text-sm mt-1">{errors.teachingExperience}</p>}
                  </div>

                  {/* Subjects Taught */}
                  <div>
                    <label className={label}>Subjects You Teach * <span className="text-gray-400">(Select at least one)</span></label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {SUBJECT_OPTIONS.map(subject => (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => handleToggle('subjectsTaught', subject)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            formData.subjectsTaught?.includes(subject)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : darkMode
                              ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                    {errors.subjectsTaught && <p className="text-red-500 text-sm mt-1">{errors.subjectsTaught}</p>}
                  </div>
                </>
              )}

              {/* ── STUDENT FIELDS ── */}
              {!isEducator && (
                <>
                  {/* Education Level */}
                  <div>
                    <label className={label}>Education Level *</label>
                    <select
                      value={formData.educationLevel}
                      onChange={(e) => handleInputChange('educationLevel', e.target.value)}
                      className={inputBase}
                    >
                      {EDUCATION_LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  {/* Learning Interests */}
                  <div>
                    <label className={label}>Learning Interests * <span className="text-gray-400">(Select at least one)</span></label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {STUDENT_INTERESTS.map(interest => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleToggle('interests', interest)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            formData.interests?.includes(interest)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : darkMode
                              ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                    {errors.interests && <p className="text-red-500 text-sm mt-1">{errors.interests}</p>}
                  </div>
                </>
              )}

              {/* Location (both roles) */}
              <div>
                <label className={label}>Location <span className="text-gray-400">(Optional)</span></label>
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, Country"
                />
              </div>

              {/* Social Links (both roles) */}
              <div>
                <label className={label}>Social Links <span className="text-gray-400">(Optional)</span></label>
                <div className="space-y-3">
                  <Input
                    type="url"
                    value={formData.socialLinks?.github || ''}
                    onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                    placeholder="GitHub profile URL"
                  />
                  <Input
                    type="url"
                    value={formData.socialLinks?.linkedin || ''}
                    onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                    placeholder="LinkedIn profile URL"
                  />
                  <Input
                    type="url"
                    value={formData.socialLinks?.website || ''}
                    onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                    placeholder="Personal website URL"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full py-3 text-lg font-semibold">
                {isLoading ? 'Completing Profile...' : 'Complete Profile'}
              </Button>
            </form>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center mt-8"
        >
          <div className="flex space-x-2">
            <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          <p className={`ml-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Step 2 of 2</p>
        </motion.div>
      </div>
    </div>
  );
}
