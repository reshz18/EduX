import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { coursesAPI } from '@/utils/api';
import { Course } from '@/types';
import { BookOpen, Star, Clock, Filter, Search, Play, Award } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';
import LoadingSpinner from './LoadingSpinner';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: coursesData, isLoading } = useQuery(
    ['courses', searchTerm, selectedCategory, selectedLevel],
    () => coursesAPI.getCourses({
      search: searchTerm,
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      level: selectedLevel !== 'All' ? selectedLevel : undefined,
    })
  ) as { data: { courses: Course[] } | undefined, isLoading: boolean };

  // Get user's enrolled courses (only if authenticated)
  const { data: myCourses } = useQuery(
    'my-courses', 
    coursesAPI.getMyCourses,
    { 
      enabled: false, // Completely disabled to prevent server errors
      retry: false,
      onError: (error) => {
        console.log('My courses fetch failed (user may not be logged in):', error);
      }
    }
  );

  // Enrollment mutation
  const enrollMutation = useMutation(
    (courseId: string) => coursesAPI.enrollInCourse(courseId),
    {
      onSuccess: (data, courseId) => {
        toast.success('Successfully enrolled in course!');
        queryClient.invalidateQueries('my-courses');
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

  const categories = ['All', 'Programming', 'Data Science', 'Web Development', 'Database'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const isEnrolled = (courseId: string) => {
    return false; // Temporarily disabled to prevent errors
  };

  const getEnrollmentData = (courseId: string) => {
    return null; // Temporarily disabled to prevent errors
  };

  const handleCourseAction = (course: Course) => {
    const courseId = course._id || course.id; // Use _id from API or fallback to id
    const enrolled = isEnrolled(courseId);
    if (enrolled) {
      router.push(`/courses/${courseId}/learn`);
    } else {
      router.push(`/courses/${courseId}`);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Explore Courses
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Discover new skills and advance your career
          </p>
        </div>
        <Button variant="primary" icon={<BookOpen className="w-4 h-4" />}>
          My Courses
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesData?.courses?.map((course: Course, index: number) => {
          const courseId = course._id || course.id;
          const enrolled = isEnrolled(courseId);
          const enrollmentData = getEnrollmentData(courseId);
          
          return (
            <motion.div
              key={courseId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="p-0 overflow-hidden group cursor-pointer">
                <div 
                  className="w-full h-full"
                  onClick={() => handleCourseAction(course)}
                >
                <div className="relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="success" size="sm">
                      {course.level}
                    </Badge>
                  </div>
                  {/* Enrollment status badges temporarily disabled */}
                  {false && enrolled && enrollmentData?.completed && (
                    <div className="absolute top-4 left-4">
                      <Badge variant="success" size="sm">
                        <Award className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    by {course.instructorName}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Progress section temporarily disabled */}
                  {false && enrolled && enrollmentData ? (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{enrollmentData.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrollmentData.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {course.rating?.average?.toFixed(1) || '4.5'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({course.rating?.count || 0})
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{course.totalDuration ? formatTime(parseInt(course.totalDuration.toString())) : 'Varies'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={course.pointsRequired > 0 ? "primary" : "success"}
                      size="sm"
                    >
                      {course.pointsRequired > 0 ? `${course.pointsRequired} pts` : 'Free'}
                    </Badge>

                    <Button 
                      size="sm" 
                      variant={enrolled ? "outline" : "primary"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCourseAction(course);
                      }}
                    >
                      {/* Temporarily show 'View Course' for all */}
                      View Course
                    </Button>
                  </div>
                </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {coursesData?.courses?.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No courses found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search criteria
          </p>
        </div>
      )}
    </div>
  );
}