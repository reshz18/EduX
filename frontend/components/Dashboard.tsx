import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'react-query';
import { coursesAPI, usersAPI, leaderboardAPI, certificatesAPI, analyticsAPI } from '@/utils/api';
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
  CheckCircle,
  Target,
  Zap,
  Activity,
  BarChart3,
  Calendar,
  Flame,
  GraduationCap,
  Brain,
  TrendingDown
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { useRouter } from 'next/router';
import Card from './ui/Card';

export default function Dashboard({ setView }: { setView?: (view: View) => void }) {
  const { user } = useAuth();
  const router = useRouter();

  const navigateToView = (view: View) => {
    if (setView) {
      setView(view);
    } else {
      router.push('/dashboard');
    }
  };

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

  // Fetch user's certificates
  const { data: certificates } = useQuery(
    'certificates',
    certificatesAPI.getCertificates,
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Student Dashboard
  if (isStudent) {
    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-display font-bold mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-white/90 text-lg">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm font-medium">
                  Total Points
                </p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-white mt-1">
                  {user?.points || 0}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Keep earning!
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm font-medium">
                  Courses Enrolled
                </p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-white mt-1">
                  {(myCourses as any[])?.length || 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Active learning
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm font-medium">
                  Completed
                </p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-white mt-1">
                  {(myCourses as any[])?.filter((course: any) => course.enrollment?.completed).length || 0}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Great progress!
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm font-medium">
                  Certificates
                </p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-white mt-1">
                  {(certificates as any[])?.length || 0}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Achievements
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Learning Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Learning Progress Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Learning Progress
              </h2>
            </div>

            <div className="space-y-4">
              {/* Progress Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(studentAnalytics as any)?.totalLearningHours || 0}h
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    Total Learning
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(studentAnalytics as any)?.coursesInProgress || 0}
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    In Progress
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {(studentAnalytics as any)?.weeklyLearningStreak || 0}
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    Day Streak
                  </p>
                </div>
              </div>

              {/* Weekly Activity Graph */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-3">
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
                        <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-t-lg relative" style={{ height: '100%' }}>
                          <div 
                            className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-xs text-secondary-600 dark:text-secondary-400">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Course Progress Donut Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
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
                    className="text-secondary-200 dark:text-secondary-700"
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
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                      {(myCourses as any[])?.length || 0}
                    </p>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">Courses</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">Completed</span>
                  </div>
                  <span className="text-sm font-semibold text-secondary-900 dark:text-white">
                    {(myCourses as any[])?.filter((c: any) => c.enrollment?.completed).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">In Progress</span>
                  </div>
                  <span className="text-sm font-semibold text-secondary-900 dark:text-white">
                    {(myCourses as any[])?.filter((c: any) => !c.enrollment?.completed && c.enrollment?.progress > 0).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary-300 dark:bg-secondary-600"></div>
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">Not Started</span>
                  </div>
                  <span className="text-sm font-semibold text-secondary-900 dark:text-white">
                    {(myCourses as any[])?.filter((c: any) => !c.enrollment?.progress || c.enrollment?.progress === 0).length || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Performance Metrics
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
                      className="text-secondary-200 dark:text-secondary-700"
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
                      <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                        {(myCourses as any[])?.length > 0 
                          ? Math.round(((myCourses as any[]).filter((c: any) => c.enrollment?.completed).length / (myCourses as any[]).length) * 100)
                          : 0}%
                      </p>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400">Complete</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">Avg. Session</p>
                  </div>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {(studentAnalytics as any)?.avgSessionDuration || 0}m
                  </p>
                </div>

                {userRank && (userRank as any).rank && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-yellow-600" />
                      <p className="text-xs text-secondary-600 dark:text-secondary-400">Your Rank</p>
                    </div>
                    <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                      #{(userRank as any)?.rank || 'N/A'}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">Streak</p>
                  </div>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {(studentAnalytics as any)?.weeklyLearningStreak || 0} days
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">Badges</p>
                  </div>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {user?.badges?.length || 0}
                  </p>
                </div>
              </div>

              {/* Recent Badges */}
              <div>
                <h3 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-3">
                  Recent Achievements
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user?.badges && user.badges.length > 0 ? (
                    user.badges.slice(0, 3).map((badge, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg text-white text-xs font-medium shadow-md"
                      >
                        <Star className="w-4 h-4" />
                        {badge.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                      No badges yet. Keep learning!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Learning Goals & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Learning Goals */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Weekly Goals
              </h2>
            </div>

            <div className="space-y-4">
              {/* Goal 1: Learning Hours */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                      10 Hours Learning
                    </span>
                  </div>
                  <span className="text-sm font-bold text-secondary-900 dark:text-white">
                    {Math.min((studentAnalytics as any)?.totalLearningHours || 0, 10)}/10h
                  </span>
                </div>
                <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((studentAnalytics as any)?.totalLearningHours || 0) / 10 * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Goal 2: Complete Courses */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                      Complete 2 Courses
                    </span>
                  </div>
                  <span className="text-sm font-bold text-secondary-900 dark:text-white">
                    {Math.min((myCourses as any[])?.filter((c: any) => c.enrollment?.completed).length || 0, 2)}/2
                  </span>
                </div>
                <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((myCourses as any[])?.filter((c: any) => c.enrollment?.completed).length || 0) / 2 * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Goal 3: Daily Streak */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                      7 Day Streak
                    </span>
                  </div>
                  <span className="text-sm font-bold text-secondary-900 dark:text-white">
                    {Math.min((studentAnalytics as any)?.weeklyLearningStreak || 0, 7)}/7
                  </span>
                </div>
                <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((studentAnalytics as any)?.weeklyLearningStreak || 0) / 7 * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Recommended Actions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Recommended for You
              </h2>
            </div>

            <div className="space-y-3">
              {(myCourses as any[])?.filter((c: any) => !c.enrollment?.completed && c.enrollment?.progress > 0)
                .slice(0, 3)
                .map((course: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/courses/${course.id}/learn`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-secondary-900 dark:text-white text-sm">
                        {course.title}
                      </h3>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(course.enrollment?.progress || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-1.5 mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${course.enrollment?.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">
                      Continue where you left off
                    </p>
                  </div>
                ))}

              {(!myCourses || (myCourses as any[]).filter((c: any) => !c.enrollment?.completed && c.enrollment?.progress > 0).length === 0) && (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Start a new course to see recommendations
                  </p>
                  <button
                    onClick={() => navigateToView(View.COURSES)}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Browse Courses
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigateToView(View.COURSES)}
              className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <BookOpen className="w-6 h-6 mb-2" />
              <p className="font-semibold">Browse Courses</p>
            </button>
            <button
              onClick={() => navigateToView(View.CERTIFICATES)}
              className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Award className="w-6 h-6 mb-2" />
              <p className="font-semibold">My Certificates</p>
            </button>
            <button
              onClick={() => navigateToView(View.LEADERBOARD)}
              className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Trophy className="w-6 h-6 mb-2" />
              <p className="font-semibold">Leaderboard</p>
            </button>
            <button
              onClick={() => navigateToView(View.COMMUNITY)}
              className="p-4 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Users className="w-6 h-6 mb-2" />
              <p className="font-semibold">Community</p>
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Educator Dashboard
  if (isEducator) {
    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-display font-bold mb-2">
            Welcome back, {user?.name}! 👨‍🏫
          </h1>
          <p className="text-white/90 text-lg">
            Ready to inspire and educate students today?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm font-medium">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-white mt-1">
                  {(educatorAnalytics as any)?.metrics?.totalStudents || 0}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {(educatorAnalytics as any)?.metrics?.activeStudents || 0} active
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm font-medium">
                  Total Courses
                </p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-white mt-1">
                  {(educatorAnalytics as any)?.metrics?.totalCourses || 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Published courses
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm font-medium">
                  Enrollments
                </p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-white mt-1">
                  {(educatorAnalytics as any)?.metrics?.totalEnrollments || 0}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Total sign-ups
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm font-medium">
                  Completion Rate
                </p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-white mt-1">
                  {(educatorAnalytics as any)?.metrics?.avgCompletionRate || 0}%
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Average rate
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enrollment Growth Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Enrollment Trends
              </h2>
            </div>

            <div className="space-y-4">
              {/* Growth Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(educatorAnalytics as any)?.metrics?.totalLearningTime || 0}h
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    Learning Hours
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(educatorAnalytics as any)?.metrics?.avgRating || 0}
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    Avg. Rating
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {(educatorAnalytics as any)?.metrics?.totalReviews || 0}
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    Reviews
                  </p>
                </div>
              </div>

              {/* Enrollment Growth Graph */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-3">
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
                        <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-t-lg relative" style={{ height: '100%' }}>
                          <div 
                            className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-300"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-xs text-secondary-600 dark:text-secondary-400">{dayLabel}</span>
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
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Student Progress
              </h2>
            </div>

            <div className="flex flex-col items-center justify-center">
              {/* Donut Chart */}
              <div className="relative w-40 h-40 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-secondary-200 dark:text-secondary-700"
                  />
                  {/* Completed segment */}
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
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                      {(educatorAnalytics as any)?.metrics?.totalStudents || 0}
                    </p>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">Students</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
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
                        <span className="text-sm text-secondary-700 dark:text-secondary-300">{item.name}</span>
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

          {/* Course Popularity */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
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
                  <div key={index} className="p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 bg-gradient-to-br ${colors[index]} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">
                          {course.name}
                        </p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">
                          {course.studentCount} students
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
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

        {/* Quiz Performance & Student Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quiz Performance */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Quiz Performance
              </h2>
            </div>

            <div className="space-y-4">
              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {(educatorAnalytics as any)?.metrics?.totalQuizAttempts || 0}
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    Attempts
                  </p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(educatorAnalytics as any)?.metrics?.avgQuizScore || 0}%
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    Avg. Score
                  </p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(educatorAnalytics as any)?.metrics?.avgRating || 0}
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    Rating
                  </p>
                </div>
              </div>

              {/* Score Distribution */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-3">
                  Score Distribution
                </h3>
                <div className="space-y-2">
                  {[
                    { range: '90-100%', color: 'from-green-500 to-green-600', value: 35 },
                    { range: '70-89%', color: 'from-blue-500 to-blue-600', value: 45 },
                    { range: '50-69%', color: 'from-yellow-500 to-yellow-600', value: 15 },
                    { range: 'Below 50%', color: 'from-red-500 to-red-600', value: 5 }
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
                          {item.range}
                        </span>
                        <span className="text-xs font-bold text-secondary-900 dark:text-white">
                          {item.value}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${item.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Student Engagement */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                Student Engagement
              </h2>
            </div>

            <div className="space-y-4">
              {/* Engagement Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">Active Today</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(educatorAnalytics as any)?.metrics?.activeStudents || 0}
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">Avg. Streak</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round((educatorAnalytics as any)?.metrics?.avgStreak || 0)} days
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">Avg. Session</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round((educatorAnalytics as any)?.metrics?.avgSessionTime || 0)}m
                  </p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-orange-600" />
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">Completion</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {(educatorAnalytics as any)?.metrics?.avgCompletionRate || 0}%
                  </p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-3">
                  Activity Heatmap (Last 7 Days)
                </h3>
                <div className="flex items-end justify-between gap-2 h-24">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                    const heights = [60, 80, 75, 90, 85, 40, 30];
                    const height = heights[index];
                    
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-t-lg relative" style={{ height: '100%' }}>
                          <div 
                            className="absolute bottom-0 w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg transition-all duration-300"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-xs text-secondary-600 dark:text-secondary-400">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigateToView(View.CREATOR)}
              className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Play className="w-6 h-6 mb-2" />
              <p className="font-semibold">Create Course</p>
            </button>
            <button
              onClick={() => navigateToView(View.ANALYTICS)}
              className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <BarChart3 className="w-6 h-6 mb-2" />
              <p className="font-semibold">View Analytics</p>
            </button>
            <button
              onClick={() => navigateToView(View.COURSES)}
              className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <BookOpen className="w-6 h-6 mb-2" />
              <p className="font-semibold">My Courses</p>
            </button>
            <button
              onClick={() => navigateToView(View.COMMUNITY)}
              className="p-4 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Users className="w-6 h-6 mb-2" />
              <p className="font-semibold">Community</p>
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
