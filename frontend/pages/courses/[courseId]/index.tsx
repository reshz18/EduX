import React from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { coursesAPI, certificatesAPI } from '@/utils/api';
import { Course } from '@/types';
import { Play, Clock, BookOpen, Star, Users, Award, CheckCircle, ArrowLeft, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface EnrollmentStatus {
  enrolled: boolean;
  progress: number;
  completed: boolean;
  lastWatchedTime: number;
  enrolledAt?: string;
  completedAt?: string;
  certificateId?: string;
}

export default function CourseDetail() {
  const router = useRouter();
  const { courseId } = router.query;
  const queryClient = useQueryClient();

  // Fetch course data
  const { data: course, isLoading } = useQuery(
    ['course', courseId],
    () => coursesAPI.getCourse(courseId as string),
    { enabled: !!courseId }
  ) as { data: Course | undefined, isLoading: boolean };

  // Fetch enrollment status
  const { data: enrollment } = useQuery<EnrollmentStatus>(
    ['enrollment', courseId],
    () => coursesAPI.getEnrollmentStatus(courseId as string) as Promise<EnrollmentStatus>,
    { enabled: !!courseId }
  );

  // Enrollment mutation
  const enrollMutation = useMutation(
    () => coursesAPI.enrollInCourse(courseId as string),
    {
      onSuccess: () => {
        toast.success('Successfully enrolled in course!');
        queryClient.invalidateQueries(['enrollment', courseId]);
        router.push(`/courses/${courseId}/learn`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to enroll in course');
      }
    }
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course not found</h2>
      </div>
    );
  }

  const formatTime = (seconds: number | string) => {
    const sec = typeof seconds === 'string' ? parseInt(seconds) : seconds;
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleEnrollOrContinue = () => {
    if (enrollment?.enrolled) {
      router.push(`/courses/${courseId}/learn`);
    } else {
      enrollMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            icon={<ArrowLeft className="w-4 h-4" />}
            size="sm"
          >
            Back to Courses
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <Card className="p-0 overflow-hidden">
              <div className="relative">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="success">{course.level}</Badge>
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {course.title}
                </h1>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  by {course.instructorName}
                </p>

                <div className="flex items-center gap-6 mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {course.rating?.average?.toFixed(1) || '4.5'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      ({course.rating?.count || 0} reviews)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {course.enrolledStudents?.length || 0} students
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {course.totalDuration ? formatTime(course.totalDuration) : 'Duration varies'}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {course.description}
                </p>
              </div>
            </Card>

            {/* Course Content */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Course Content
              </h2>
              
              <div className="space-y-3">
                {course.lessons?.map((lesson, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        {enrollment?.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {lesson.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Video Lesson
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {lesson.duration ? formatTime(lesson.duration) : 'Duration varies'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* What You'll Learn */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                What You'll Learn
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.tags?.map((tag, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300 capitalize">
                      {tag.replace('-', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <Card className="p-6 sticky top-6">
              <div className="text-center mb-6">
                {course.pointsRequired > 0 ? (
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {course.pointsRequired} Points
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    Free
                  </div>
                )}
                <p className="text-gray-600 dark:text-gray-400">
                  {enrollment?.enrolled ? 'You are enrolled' : 'One-time enrollment'}
                </p>
              </div>

              {enrollment?.enrolled && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Your Progress</span>
                    <span>{enrollment.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${enrollment.progress || 0}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleEnrollOrContinue}
                disabled={enrollMutation.isLoading}
                className="w-full mb-4"
                size="lg"
              >
                {enrollMutation.isLoading ? (
                  'Processing...'
                ) : enrollment?.enrolled ? (
                  enrollment.completed ? 'Review Course' : 'Continue Learning'
                ) : (
                  'Enroll Now'
                )}
              </Button>

              {enrollment?.enrolled && enrollment?.progress >= 100 && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/courses/${courseId}/quiz`)}
                  className="w-full mb-4"
                  icon={<FileText className="w-4 h-4" />}
                >
                  Take Quiz
                </Button>
              )}

              {enrollment?.completed && enrollment?.certificateId && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    const certId = enrollment.certificateId;
                    if (!certId) {
                      toast.error('Certificate ID not found');
                      return;
                    }
                    try {
                      await certificatesAPI.downloadCertificate(certId);
                      toast.success('Certificate downloaded successfully!');
                    } catch (error: any) {
                      console.error('Download error:', error);
                      toast.error(error.message || 'Failed to download certificate');
                    }
                  }}
                  className="w-full"
                  icon={<Award className="w-4 h-4" />}
                >
                  Download Certificate
                </Button>
              )}
            </Card>

            {/* Course Info */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Course Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Level</span>
                  <Badge variant="outline">{course.level}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Category</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {course.category}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Duration</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {course.totalDuration ? formatTime(course.totalDuration) : 'Varies'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Lessons</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {course.lessons?.length || 1}
                  </span>
                </div>
              </div>
            </Card>

            {/* Tags */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Tags
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {course.tags?.map((tag, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}