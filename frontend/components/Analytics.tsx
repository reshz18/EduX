import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { analyticsAPI } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import LoadingSpinner from './LoadingSpinner';
import Card from './ui/Card';
import Button from './ui/Button';
import { 
  Users, BookOpen, Award, TrendingUp, Clock, 
  ArrowRight, Search, Filter, Calendar, ChevronRight,
  ArrowLeft, MousePointer2, User as UserIcon
} from 'lucide-react';
import { 
  MetricCard 
} from './analytics/AnalyticsCards';
import { 
  EnrollmentGrowthChart, 
  CoursePopularityChart, 
  CompletionPieChart, 
  DailyActiveUsersChart,
  WeeklyActivityChart
} from './analytics/AnalyticsCharts';

export default function Analytics() {
  const { user } = useAuth();
  const [view, setView] = useState<'overview' | 'course-detail' | 'student-track'>('overview');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const isEducator = user?.role === UserRole.EDUCATOR;

  if (isEducator) {
    if (view === 'course-detail' && selectedId) {
      return <CourseDetailAnalytics courseId={selectedId} onBack={() => setView('overview')} />;
    }
    if (view === 'student-track' && selectedId) {
      return <StudentTracking studentId={selectedId} onBack={() => { setSelectedId(null); setView('overview'); }} />;
    }
    return (
      <EducatorOverview 
        onSelectCourse={(id) => { setSelectedId(id); setView('course-detail'); }} 
        onSelectStudent={(id) => { setSelectedId(id); setView('student-track'); }}
      />
    );
  }
  return <StudentAnalytics />;
}

// ─── EDUCATOR OVERVIEW ────────────────────────────────────────────────────────
function EducatorOverview({ 
  onSelectCourse, 
  onSelectStudent 
}: { 
  onSelectCourse: (id: string) => void,
  onSelectStudent: (id: string) => void 
}) {
  const { data, isLoading, refetch } = useQuery(
    'educatorOverview', 
    analyticsAPI.getOverview,
    {
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
      refetchIntervalInBackground: true,
      staleTime: 20000 // Consider data stale after 20 seconds
    }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const results = await analyticsAPI.searchStudents(searchQuery);
          setSearchResults(results as any[]);
        } catch (error) {
          console.error(error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (isLoading) return <LoadingSpinner />;

  const { metrics, charts } = data as any;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Educator Analytics</h1>
          <p className="text-secondary-500 dark:text-secondary-400 mt-1">
            Track your platform performance and student engagement.
            <span className="ml-2 text-xs text-green-600 dark:text-green-400">● Live</span>
          </p>
        </div>
        
        {/* Student Search */}
        <div className="relative w-full lg:w-96">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input 
              type="text"
              placeholder="Search students by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Search Results Dropdown */}
          {(isSearching || searchResults.length > 0) && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-secondary-500">Searching...</div>
              ) : (
                searchResults.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => onSelectStudent(s._id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors border-b last:border-0 border-secondary-100 dark:border-secondary-800"
                  >
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                      {s.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-secondary-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-secondary-500">{s.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <MetricCard icon={Users} label="Total Students" value={metrics.totalStudents} color="bg-blue-600" trend="+5.2%" />
        <MetricCard icon={TrendingUp} label="Active Students" value={metrics.activeStudents} color="bg-green-600" trend="+12.4%" />
        <MetricCard icon={BookOpen} label="Total Courses" value={metrics.totalCourses} color="bg-purple-600" />
        <MetricCard icon={Award} label="Total Enrollments" value={metrics.totalEnrollments} color="bg-amber-500" trend="+8.1%" />
        <MetricCard icon={TrendingUp} label="Completion Rate" value={`${metrics.avgCompletionRate}%`} color="bg-cyan-600" trend="+2.5%" />
        <MetricCard icon={Clock} label="Learning Time" value={`${metrics.totalLearningTime}h`} color="bg-rose-600" trend="+15.2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="font-bold text-secondary-900 dark:text-white mb-6">Enrollment Growth</h3>
          <EnrollmentGrowthChart data={charts.enrollmentGrowth} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-secondary-900 dark:text-white">Popular Courses</h3>
            <span className="text-xs text-secondary-400">Click to view details</span>
          </div>
          <div className="space-y-4">
            {charts.coursePopularity.map((c: any) => (
              <button 
                key={c._id}
                onClick={() => onSelectCourse(c._id)}
                className="w-full flex items-center justify-between p-3 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-secondary-900 dark:text-white group-hover:text-blue-600 transition-colors">{c.name}</p>
                    <p className="text-xs text-secondary-500">{c.studentCount} enrollments</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-secondary-300 group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="p-6 col-span-1">
          <h3 className="font-bold text-secondary-900 dark:text-white mb-6">Completion Distribution</h3>
          <CompletionPieChart data={charts.completionDistribution} />
        </Card>

        <Card className="p-6 col-span-2">
          <h3 className="font-bold text-secondary-900 dark:text-white mb-6">Daily Active Users</h3>
          <DailyActiveUsersChart data={charts.dailyActiveUsers} />
        </Card>
      </div>
    </div>
  );
}

// ─── COURSE DETAIL ANALYTICS ────────────────────────────────────────────────
function CourseDetailAnalytics({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'enrolled' | 'completed'>('overview');
  const { data, isLoading } = useQuery(
    ['courseAnalytics', courseId], 
    () => analyticsAPI.getCourseAnalytics(courseId),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchIntervalInBackground: true,
      staleTime: 20000
    }
  );

  if (isLoading) return <LoadingSpinner />;

  const stats = data as any;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Course Performance</h1>
          <p className="text-secondary-500 dark:text-secondary-400 mt-1">
            Detailed insights for this course.
            <span className="ml-2 text-xs text-green-600 dark:text-green-400">● Live</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-secondary-200 dark:border-secondary-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-secondary-600 dark:text-secondary-400 border-transparent hover:text-secondary-900 dark:hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('enrolled')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'enrolled'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-secondary-600 dark:text-secondary-400 border-transparent hover:text-secondary-900 dark:hover:text-white'
          }`}
        >
          Enrolled Students ({stats.enrolledStudents?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'completed'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-secondary-600 dark:text-secondary-400 border-transparent hover:text-secondary-900 dark:hover:text-white'
          }`}
        >
          Completed Students ({stats.completedStudents?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard icon={Users} label="Total Enrolled" value={stats.totalEnrollments} color="bg-blue-600" />
            <MetricCard icon={TrendingUp} label="Completion Rate" value={`${stats.completionRate}%`} color="bg-green-600" />
            <MetricCard icon={Clock} label="Avg Watch Time" value={`${stats.avgWatchTime}m`} color="bg-amber-500" />
            <MetricCard icon={MousePointer2} label="Most Watched" value={stats.mostWatchedLesson} color="bg-purple-600" />
          </div>

          <Card className="p-8">
            <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-6">Engagement Funnel</h3>
            <p className="text-secondary-500 mb-8 text-sm">Drop-off points across the course duration</p>
            <div className="space-y-6">
              {stats.dropOffPoints.map((point: any) => (
                <div key={point.range} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-secondary-700 dark:text-secondary-300">Progress: {point.range}</span>
                    <span className="text-secondary-500">{point.count} students ({Math.round((point.count / stats.totalEnrollments) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-secondary-100 dark:bg-secondary-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${(point.count / stats.totalEnrollments) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {activeTab === 'enrolled' && (
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-secondary-100 dark:border-secondary-800">
            <h3 className="font-bold text-secondary-900 dark:text-white">All Enrolled Students</h3>
            <p className="text-sm text-secondary-500 mt-1">Complete list of students enrolled in this course</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 dark:bg-secondary-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Watch Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Quiz</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                {stats.enrolledStudents && stats.enrolledStudents.length > 0 ? (
                  stats.enrolledStudents.map((student: any) => (
                    <tr key={student._id} className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-secondary-900 dark:text-white">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-secondary-100 dark:bg-secondary-800 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${student.progress}%` }} />
                          </div>
                          <span className="text-sm font-medium">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{student.totalWatchTime} mins</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {student.quizAttempts ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            student.quizPassed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {student.quizPassed ? `Passed (${student.quizScore}%)` : `${student.quizAttempts} attempts`}
                          </span>
                        ) : (
                          <span className="text-secondary-400">Not taken</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          student.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                          student.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-secondary-100 text-secondary-700'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {new Date(student.enrolledAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-secondary-500">
                      No students enrolled yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'completed' && (
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-secondary-100 dark:border-secondary-800">
            <h3 className="font-bold text-secondary-900 dark:text-white">Completed Students</h3>
            <p className="text-sm text-secondary-500 mt-1">Students who have successfully completed this course</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 dark:bg-secondary-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Watch Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Quiz Score</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Certificate</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                {stats.completedStudents && stats.completedStudents.length > 0 ? (
                  stats.completedStudents.map((student: any) => (
                    <tr key={student._id} className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-secondary-900 dark:text-white">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{student.totalWatchTime} mins</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.quizPassed ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            {student.quizScore}% (Passed)
                          </span>
                        ) : (
                          <span className="text-secondary-400 text-sm">Not passed</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.certificateGenerated ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <Award className="w-4 h-4" />
                            Generated
                          </span>
                        ) : (
                          <span className="text-secondary-400 text-sm">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {new Date(student.lastActive).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-secondary-500">
                      No students have completed this course yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── STUDENT TRACKING ──────────────────────────────────────────────────────
function StudentTracking({ studentId, onBack }: { studentId: string; onBack: () => void }) {
  const { data, isLoading } = useQuery(
    ['studentTrack', studentId], 
    () => analyticsAPI.getStudentAnalytics(studentId),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchIntervalInBackground: true,
      staleTime: 20000
    }
  );

  if (isLoading) return <LoadingSpinner />;

  const { studentInfo, learningStats, courseTable } = data as any;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6 text-secondary-600" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{studentInfo.name}</h1>
            <p className="text-secondary-500 dark:text-secondary-400 mt-1">
              {studentInfo.email} • Joined {new Date(studentInfo.joinDate).toLocaleDateString()}
              <span className="ml-2 text-xs text-green-600 dark:text-green-400">● Live</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={BookOpen} label="Courses Enrolled" value={learningStats.coursesEnrolled} color="bg-blue-600" />
        <MetricCard icon={Award} label="Courses Completed" value={learningStats.coursesCompleted} color="bg-green-600" />
        <MetricCard icon={Clock} label="Total Learning Hours" value={learningStats.totalLearningTime} color="bg-amber-500" />
        <MetricCard icon={TrendingUp} label="Avg Progress" value={`${learningStats.averageProgress}%`} color="bg-purple-600" />
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-secondary-100 dark:border-secondary-800">
          <h3 className="font-bold text-secondary-900 dark:text-white">Detailed Course Progress</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Course Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Watch Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
              {courseTable.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-secondary-900 dark:text-white">{row.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-secondary-100 dark:bg-secondary-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${row.progress}%` }} />
                      </div>
                      <span className="text-sm font-medium">{row.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{row.totalWatchTime} mins</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      row.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                      row.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-secondary-100 text-secondary-700'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(row.lastWatchedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── STUDENT PERSONAL ANALYTICS ──────────────────────────────────────────────
function StudentAnalytics() {
  const { data, isLoading } = useQuery(
    'studentAnalytics', 
    analyticsAPI.getPersonalAnalytics,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchIntervalInBackground: true,
      staleTime: 20000
    }
  );

  if (isLoading) return <LoadingSpinner />;

  const stats = data as any;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Your Learning Journey</h1>
        <p className="text-secondary-500 dark:text-secondary-400 mt-1">
          Monitor your progress and stay motivated.
          <span className="ml-2 text-xs text-green-600 dark:text-green-400">● Live</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard icon={Clock} label="Learning Hours" value={stats.totalLearningHours} color="bg-blue-600" />
        <MetricCard icon={BookOpen} label="In Progress" value={stats.coursesInProgress} color="bg-amber-500" />
        <MetricCard icon={Award} label="Completed" value={stats.coursesCompleted} color="bg-green-600" />
        <MetricCard icon={Clock} label="Avg. Session" value={`${stats.avgSessionDuration}m`} color="bg-cyan-600" />
        <MetricCard icon={TrendingUp} label="Weekly Streak" value={`${stats.weeklyLearningStreak} days`} color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="p-8 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-secondary-900 dark:text-white">Weekly Activity</h3>
              <p className="text-secondary-500 text-sm">Your learning interactions this week</p>
            </div>
          </div>
          <WeeklyActivityChart data={stats.weeklyActivity} />
        </Card>

        <Card className="p-8">
          <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-6">Learning Insights</h3>
          <div className="space-y-6">
             <div className="flex items-start gap-3">
               <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                 <TrendingUp className="w-5 h-5 text-green-600" />
               </div>
               <div>
                 <p className="font-semibold text-secondary-900 dark:text-white">Great job!</p>
                 <p className="text-sm text-secondary-500 mt-1">You've reached {stats.weeklyLearningStreak} days of learning this week. Keep it up!</p>
               </div>
             </div>
             
             <div className="p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-xl border border-secondary-100 dark:border-secondary-700">
                <p className="text-xs font-bold text-secondary-400 uppercase tracking-wider mb-2">Next Chapter to Watch</p>
                <p className="font-bold text-secondary-900 dark:text-white">Continue where you left off</p>
                <Button size="sm" className="mt-3 w-full" icon={<ArrowRight className="w-4 h-4" />}>
                  Resume Latest
                </Button>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
