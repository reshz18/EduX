import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { certificatesAPI, coursesAPI } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { 
  Award, 
  Download, 
  Share2, 
  Eye, 
  Calendar, 
  BookOpen, 
  Star, 
  ExternalLink,
  CheckCircle,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Input from './ui/Input';
import LoadingSpinner from './LoadingSpinner';

interface Certificate {
  _id: string;
  certificateId: string;
  courseId: string;
  userId: string;
  userName: string;
  courseName: string;
  instructorName: string;
  issuedAt: string;
  completionDate: string;
}

export default function Certificates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch certificates
  const { data: certificates, isLoading } = useQuery<Certificate[], Error>(
    'certificates',
    () => certificatesAPI.getCertificates() as Promise<Certificate[]>
  );

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      await certificatesAPI.downloadCertificate(certificate.certificateId);
      toast.success('Certificate downloaded successfully!');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download certificate');
    }
  };

  const handleShareCertificate = (certificate: Certificate) => {
    const verificationUrl = `${window.location.origin}/verify/${certificate.certificateId}`;
    if (navigator.share) {
      navigator.share({
        title: `Certificate - ${certificate.courseName}`,
        text: `I've completed ${certificate.courseName} and earned a certificate!`,
        url: verificationUrl
      });
    } else {
      navigator.clipboard.writeText(verificationUrl);
      toast.success('Certificate verification URL copied to clipboard!');
    }
  };

  const handleVerifyCertificate = (certificateId: string) => {
    window.open(`/verify/${certificateId}`, '_blank');
  };

  const filteredCertificates = certificates?.filter((cert: Certificate) => {
    const matchesSearch = cert.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Certificates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage your course completion certificates
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredCertificates.map((certificate: Certificate) => (
            <motion.div
              key={certificate._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <Card className="p-6 h-full flex flex-col hover:shadow-xl transition-all duration-300 border-2 border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                  {certificate.courseName}
                </h3>

                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  by {certificate.instructorName}
                </p>

                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                    <span className="font-medium">{new Date(certificate.completionDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>ID</span>
                    </div>
                    <span className="font-mono">{certificate.certificateId}</span>
                  </div>

                  <div className="flex space-x-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadCertificate(certificate)}
                      icon={<Download className="w-4 h-4" />}
                      className="flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareCertificate(certificate)}
                      icon={<Share2 className="w-4 h-4" />}
                      className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Share
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredCertificates.length === 0 && !isLoading && (
        <div className="text-center py-16 col-span-full">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No certificates yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            {searchTerm 
              ? 'No certificates match your search. Try different keywords.'
              : 'Complete courses to earn certificates. Certificates are automatically generated when you finish watching 90% or more of a course.'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-slate-700 hover:bg-slate-800 text-white"
            >
              Browse Courses
            </Button>
          )}
        </div>
      )}

    </div>
  );
}