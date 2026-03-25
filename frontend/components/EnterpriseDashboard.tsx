import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'react-query';
import { coursesAPI, usersAPI, leaderboardAPI, analyticsAPI } from '@/utils/api';
import { Course, UserRole, View } from '@/types';
import {
  BookOpen,
  Trophy,
  Award,
  TrendingUp,
  Clock,
  Users,
  Star,
  Play,
  ArrowUpRight,
  Target,
  Zap,
  Brain,
  BarChart3,
  Activity,
  CheckCircle,
  Flame,
  GraduationCap
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { useRouter } from 'next/router';

export default function EnterpriseDashboard({ setView }: { setView?: (view: View) => void }) {
  const { user } = useAuth();
  const router = useRouter();

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery(
    'userStats',
    usersAPI.getStats,
    { enabled: !!user }
  );

  // Fetch user's enrolled courses
  const { data: myCourses, isLoading: myCoursesLoading } = useQuery(
    'my-courses',
    coursesAPI.getMyCourses,
    { enabled: !!user }
  );

  // Fetch user rank (for students)
  const { data: userRank } = useQuery(
    'userRank',
    leaderboardAPI.getUserRank,
    { enabled: user?.role === UserRole.STUDENT }
  );

  // Fetch real-time analytics for students
  const { data: studentAnalytics } = useQuery(
    'studentDashboardAnalytics',
    analyticsAPI.getPersonalAnalytics,
    {
      enabled: user?.role === UserRole.STUDENT,
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
      staleTime: 20000
    }
  );

  // Fetch real-time analytics for educators
  const { data: educatorAnalytics } = useQuery(
    'educatorDashboardAnalytics',
    analyticsAPI.getOverview,
    {
      enabled: user?.role === UserRole.EDUCATOR,
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
      staleTime: 20000
    }
  );

  if (statsLoading || myCoursesLoading) {
    return <LoadingSpinner />;
  }

  const isStudent = user?.role === UserRole.STUDENT;
  const isEducator = user?.role === UserRole.EDUCATOR;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <div className="bg-blue-600 rounded-2xl p-8 text-white overflow-hidden relative shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl font-bold text-white mb-3"
                >
                  Welcome back, {user?.name}! 👋
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-blue-100 text-lg mb-6"
                >
                  {isStudent 
                    ? "Ready to continue your learning journey?"
                    : "Ready to inspire and educate students today?"
                  }
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button 
                    variant="secondary" 
                    icon={<Target className="w-4 h-4" />}
                    onClick={() => setView && setView(isStudent ? View.COURSES : View.CREATOR)}
                  >
                    {isStudent ? 'Browse Courses' : 'Create New Course'}
                  </Button>
                </motion.div>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <Brain className="w-16 h-16 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid - Student */}
      {isStudent && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card key="learning-time" hover className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 dark:text-blue-300 text-sm font-medium mb-1">
                  Total Learning Time
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {(studentAnalytics as any)?.totalLearningHours || 0}h
                </p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-blue-600 mr-1" />
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    All time
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          <Card key="today-learning" hover className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-1">
                  Today's Learning
                </p>
                <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
                  {(studentAnalytics as any)?.todayLearningTime || 0}m
                </p>
                <div className="flex items-center mt-2">
                  <Zap className="w-4 h-4 text-indigo-600 mr-1" />
                  <span className="text-sm text-indigo-600 dark:text-indigo-400">
                    Keep learning!
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          <Card key="active-courses" hover className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 dark:text-green-300 text-sm font-medium mb-1">
                  Active Courses
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {(studentAnalytics as any)?.coursesInProgress || 0}
                </p>
                <div className="flex items-center mt-2">
                  <BookOpen className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    {(myCourses as any[])?.length || 0} total enrolled
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          <Card key="completion-rate" hover className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 dark:text-purple-300 text-sm font-medium mb-1">
                  Completion Rate
                </p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {(myCourses as any[])?.length > 0 
                    ? Math.round(((myCourses as any[]).filter((c: any) => c.enrollment?.completed).length / (myCourses as any[]).length) * 100)
                    : 0}%
                </p>
                <div className="flex items-center mt-2">
                  <Target className="w-4 h-4 text-purple-600 mr-1" />
                  <span className="text-sm text-purple-600 dark:text-purple-400">
                    {(myCourses as any[])?.filter((c: any) => c.enrollment?.completed).length || 0} completed
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Stats Grid - Educator */}
      {isEducator && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card key="total-students" hover className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 dark:text-blue-300 text-sm font-medium mb-1">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {(educatorAnalytics as any)?.metrics?.totalStudents || 0}
                </p>
                <div className="flex items-center mt-2">
                  <Users className="w-4 h-4 text-blue-600 mr-1" />
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    {(educatorAnalytics as any)?.metrics?.activeStudents || 0} active
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          <Card key="total-courses" hover className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 dark:text-green-300 text-sm font-medium mb-1">
                  Total Courses
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {(educatorAnalytics as any)?.metrics?.totalCourses || 0}
                </p>
                <div className="flex items-center mt-2">
                  <BookOpen className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Published
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          <Card key="total-enrollments" hover className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 dark:text-orange-300 text-sm font-medium mb-1">
                  Total Enrollments
                </p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {(educatorAnalytics as any)?.metrics?.totalEnrollments || 0}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-orange-600 mr-1" />
                  <span className="text-sm text-orange-600 dark:text-orange-400">
                    All courses
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          <Card key="avg-rating" hover className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 dark:text-purple-300 text-sm font-medium mb-1">
                  Average Rating
                </p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {(educatorAnalytics as any)?.metrics?.avgRating || 0}
                </p>
                <div className="flex items-center mt-2">
                  <Star className="w-4 h-4 text-purple-600 mr-1" />
                  <span className="text-sm text-purple-600 dark:text-purple-400">
                    {(educatorAnalytics as any)?.metrics?.totalReviews || 0} reviews
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Star className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Analytics Section */}
      {isStudent && (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Learning Progress Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Learning Progress
                </h2>
              </div>

              <div className="space-y-4">
                {/* Progress Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {(studentAnalytics as any)?.totalLearningHours || 0}h
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Total Learning
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {(studentAnalytics as any)?.coursesInProgress || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      In Progress
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {(studentAnalytics as any)?.weeklyLearningStreak || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Day Streak
                    </p>
                  </div>
                </div>

                {/* Weekly Activity Graph */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Weekly Activity
                  </h3>
                  <div className="flex items-end justify-between gap-2 h-32">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      const activity = (studentAnalytics as any)?.weeklyActivity?.find((a: any) => 
                        new Date(a._id).getDay() === (index + 1) % 7
                      );
                      const count = activity?.count || 0;
                      const maxCount = Math.max(...((studentAnalytics as any)?.weeklyActivity?.map((a: any) => a.count) || [1]));
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg relative" style={{ height: '100%' }}>
                            <div 
                              className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Course Status Donut Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Course Status
                </h2>
              </div>

              <div className="flex flex-col items-center justify-center h-64">
                {/* Donut Chart */}
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    {/* Completed courses */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={`${((myCourses as any[])?.filter((c: any) => c.enrollment?.completed).length / Math.max((myCourses as any[])?.length || 1, 1)) * 251.2} 251.2`}
                      className="text-green-500 transition-all duration-500"
                    />
                    {/* In progress courses */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={`${((myCourses as any[])?.filter((c: any) => !c.enrollment?.completed && c.enrollment?.progress > 0).length / Math.max((myCourses as any[])?.length || 1, 1)) * 251.2} 251.2`}
                      strokeDashoffset={`-${((myCourses as any[])?.filter((c: any) => c.enrollment?.completed).length / Math.max((myCourses as any[])?.length || 1, 1)) * 251.2}`}
                      className="text-blue-500 transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(myCourses as any[])?.length || 0}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Courses</p>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {(myCourses as any[])?.filter((c: any) => c.enrollment?.completed).length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {(myCourses as any[])?.filter((c: any) => !c.enrollment?.completed && c.enrollment?.progress > 0).length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Not Started</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {(myCourses as any[])?.filter((c: any) => !c.enrollment?.progress || c.enrollment?.progress === 0).length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Performance Metrics */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Performance
                </h2>
              </div>

              <div className="space-y-6">
                {/* Completion Rate Circular Progress */}
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={`${((myCourses as any[])?.length > 0 
                          ? ((myCourses as any[]).filter((c: any) => c.enrollment?.completed).length / (myCourses as any[]).length) * 282.6
                          : 0)} 282.6`}
                        className="text-green-500 transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(myCourses as any[])?.length > 0 
                            ? Math.round(((myCourses as any[]).filter((c: any) => c.enrollment?.completed).length / (myCourses as any[]).length) * 100)
                            : 0}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Complete</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Avg. Session</p>
                    </div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {(studentAnalytics as any)?.avgSessionDuration || 0}m
                    </p>
                  </div>

                  {userRank && (userRank as any).rank && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-yellow-600" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">Your Rank</p>
                      </div>
                      <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        #{(userRank as any)?.rank || 'N/A'}
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Streak</p>
                    </div>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {(studentAnalytics as any)?.weeklyLearningStreak || 0} days
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-green-600" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Badges</p>
                    </div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {user?.badges?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Educator Analytics */}
      {isEducator && (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Enrollment Trends */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Enrollment Trends
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {(educatorAnalytics as any)?.metrics?.totalLearningTime || 0}h
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Learning Hours
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {(educatorAnalytics as any)?.metrics?.avgRating || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Avg. Rating
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {(educatorAnalytics as any)?.metrics?.totalReviews || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Reviews
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Daily Enrollments (Last 7 Days)
                  </h3>
                  <div className="flex items-end justify-between gap-2 h-32">
                    {((educatorAnalytics as any)?.charts?.enrollmentGrowth || []).slice(-7).map((item: any, index: number) => {
                      const maxCount = Math.max(...((educatorAnalytics as any)?.charts?.enrollmentGrowth?.map((i: any) => i.count) || [1]));
                      const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                      const date = new Date(item._id);
                      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg relative" style={{ height: '100%' }}>
                            <div 
                              className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-300"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{dayLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Student Progress Donut */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Student Progress
                </h2>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 mb-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    {((educatorAnalytics as any)?.charts?.completionDistribution || []).map((item: any, index: number) => {
                      const total = ((educatorAnalytics as any)?.charts?.completionDistribution || []).reduce((sum: number, i: any) => sum + i.value, 0);
                      const percentage = total > 0 ? item.value / total : 0;
                      const colors = ['text-green-500', 'text-blue-500', 'text-gray-400'];
                      const previousPercentage = ((educatorAnalytics as any)?.charts?.completionDistribution || [])
                        .slice(0, index)
                        .reduce((sum: number, i: any) => sum + (total > 0 ? i.value / total : 0), 0);
                      
                      return (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="12"
                          strokeDasharray={`${percentage * 251.2} 251.2`}
                          strokeDashoffset={`-${previousPercentage * 251.2}`}
                          className={`${colors[index]} transition-all duration-500`}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(educatorAnalytics as any)?.metrics?.totalStudents || 0}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Students</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  {((educatorAnalytics as any)?.charts?.completionDistribution || []).map((item: any, index: number) => {
                    const colors = [
                      { dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
                      { dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
                      { dot: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-400' }
                    ];
                    const color = colors[index] || colors[0];
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color.dot}`}></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                        </div>
                        <span className={`text-sm font-bold ${color.text}`}>
                          {item.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Top Courses */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Top Courses
                </h2>
              </div>

              <div className="space-y-3">
                {((educatorAnalytics as any)?.charts?.coursePopularity || []).slice(0, 5).map((course: any, index: number) => {
                  const maxStudents = Math.max(...((educatorAnalytics as any)?.charts?.coursePopularity?.map((c: any) => c.studentCount) || [1]));
                  const percentage = maxStudents > 0 ? (course.studentCount / maxStudents) * 100 : 0;
                  const colors = ['from-yellow-500 to-yellow-600', 'from-orange-500 to-orange-600', 'from-red-500 to-red-600', 'from-purple-500 to-purple-600', 'from-blue-500 to-blue-600'];
                  
                  return (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 bg-gradient-to-br ${colors[index]} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {course.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {course.studentCount} students
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${colors[index]} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Recommended Courses for Students */}
      {isStudent && (myCourses as any[])?.filter((c: any) => !c.enrollment?.completed && c.enrollment?.progress > 0).length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Continue Your Learning
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Pick up where you left off
                </p>
              </div>
              <Button 
                variant="outline" 
                icon={<ArrowUpRight className="w-4 h-4" />}
                onClick={() => setView && setView(View.COURSES)}
              >
                View All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(myCourses as any[])?.filter((c: any) => !c.enrollment?.completed && c.enrollment?.progress > 0)
                .slice(0, 3)
                .map((course: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/courses/${course._id || course.id}/learn`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                        {course.title}
                      </h3>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 ml-2 flex-shrink-0">
                        {Math.round(course.enrollment?.progress || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${course.enrollment?.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Continue learning
                    </p>
                  </motion.div>
                ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions for Students */}
      {isStudent && (
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setView && setView(View.COURSES)}
                className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex flex-col items-center gap-2"
              >
                <BookOpen className="w-6 h-6" />
                <p className="font-semibold text-sm">Explore Courses</p>
              </button>
              <button
                onClick={() => setView && setView(View.CERTIFICATES)}
                className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex flex-col items-center gap-2"
              >
                <Award className="w-6 h-6" />
                <p className="font-semibold text-sm">Certificates</p>
              </button>
              <button
                onClick={() => setView && setView(View.LEADERBOARD)}
                className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex flex-col items-center gap-2"
              >
                <Trophy className="w-6 h-6" />
                <p className="font-semibold text-sm">Leaderboard</p>
              </button>
              <button
                onClick={() => setView && setView(View.BOT)}
                className="p-4 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex flex-col items-center gap-2"
              >
                <Brain className="w-6 h-6" />
                <p className="font-semibold text-sm">AI Tutor</p>
              </button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions for Educators */}
      {isEducator && (
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setView && setView(View.CREATOR)}
                className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex flex-col items-center gap-2"
              >
                <Play className="w-6 h-6" />
                <p className="font-semibold text-sm">Create Course</p>
              </button>
              <button
                onClick={() => setView && setView(View.ANALYTICS)}
                className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex flex-col items-center gap-2"
              >
                <BarChart3 className="w-6 h-6" />
                <p className="font-semibold text-sm">Analytics</p>
              </button>
              <button
                onClick={() => setView && setView(View.COURSES)}
                className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex flex-col items-center gap-2"
              >
                <BookOpen className="w-6 h-6" />
                <p className="font-semibold text-sm">My Courses</p>
              </button>
              <button
                onClick={() => setView && setView(View.COMMUNITY)}
                className="p-4 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex flex-col items-center gap-2"
              >
                <Users className="w-6 h-6" />
                <p className="font-semibold text-sm">Community</p>
              </button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recent Activity - Students */}
      {isStudent && user?.badges && user.badges.filter(b => !['First Spin', 'Lucky Seven', 'Spin Master', 'Spin Legend', '7-Day Streak', '30-Day Streak'].includes(b.name)).length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Achievements
              </h2>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.badges.filter(b => !['First Spin', 'Lucky Seven', 'Spin Master', 'Spin Legend', '7-Day Streak', '30-Day Streak'].includes(b.name)).slice(0, 3).map((badge, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white text-center mb-1">
                    {badge.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                  <Badge variant="warning" size="sm" className="mt-2">
                    New
                  </Badge>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recent Student Activity - Educators */}
      {isEducator && (
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setView && setView(View.ANALYTICS)}>
                View All
              </Button>
            </div>

            {((educatorAnalytics as any)?.recentActivity && (educatorAnalytics as any)?.recentActivity.length > 0) ? (
              <div className="space-y-3">
                {(educatorAnalytics as any).recentActivity.slice(0, 4).map((activity: any, index: number) => {
                  const activityTypes: any = {
                    'completed': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                    'enrolled': { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    'quiz_submitted': { icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                    'certificate_earned': { icon: Award, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  };
                  
                  const type = activityTypes[activity.type] || activityTypes['enrolled'];
                  const Icon = type.icon;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-4 p-4 ${type.bg} rounded-lg hover:shadow-md transition-all`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type.color}`}>
                        <Icon className={`w-5 h-5 ${type.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          <span className="font-semibold">{activity.studentName}</span> {activity.action}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {activity.courseName}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {activity.timeAgo}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No recent activity to display
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                  Student activities will appear here
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}