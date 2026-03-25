import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { coursesAPI, progressAPI, certificatesAPI, quizAPI, reviewsAPI } from '@/utils/api';
import { getYouTubeVideoId } from '@/utils/helpers';
import { Course } from '@/types';
import { Play, Pause, Volume2, VolumeX, Maximize, Clock, BookOpen, CheckCircle, Award, ArrowLeft, FileText, Star, ThumbsUp, MessageSquare } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import VideoPlayer from '@/components/VideoPlayer';
import Quiz from '@/components/Quiz';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface EnrollmentStatus {
  enrolled: boolean;
  progress: number;
  completed: boolean;
  videoCompleted?: boolean;
  lastWatchedTime: number;
  certificateId?: string;
  quizStatus?: {
    available: boolean;
    unlocked: boolean;
    passed: boolean;
    bestScore: number | null;
    attempts: number;
  };
}

interface ReviewData {
  reviews: any[];
  total: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export default function CourseLearning() {
  const router = useRouter();
  const { courseId } = router.query;
  const queryClient = useQueryClient();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [liveProgress, setLiveProgress] = useState(0); // Live progress based on current watch time
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'reviews' | 'quiz' | 'resources'>('overview');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  
  const progressUpdateRef = useRef<NodeJS.Timeout>();

  // Handle tab query parameter
  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab as any);
    }
  }, [router.query.tab]);

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
    { 
      enabled: !!courseId,
      retry: 1,
      onError: (error: any) => {
        console.error('Failed to fetch enrollment status:', error);
      }
    }
  );

  const [generatedCertId, setGeneratedCertId] = useState<string | null>(null);

  // Fetch reviews
  const { data: reviewsData, refetch: refetchReviews, isLoading: reviewsLoading } = useQuery<ReviewData>(
    ['reviews', courseId],
    () => {
      console.log('Fetching reviews for course:', courseId);
      return reviewsAPI.getReviews(courseId as string, { page: 1, limit: 10 }) as Promise<ReviewData>;
    },
    { 
      enabled: !!courseId,
      retry: 1,
      onSuccess: (data) => {
        console.log('Reviews fetched successfully:', data);
      },
      onError: (error: any) => {
        console.error('Failed to fetch reviews:', error);
      }
    }
  );

  // Add review mutation
  const addReviewMutation = useMutation(
    () => reviewsAPI.addReview(courseId as string, reviewRating, reviewComment),
    {
      onSuccess: () => {
        toast.success('Review submitted successfully!');
        setReviewComment('');
        setReviewRating(5);
        // Invalidate and refetch reviews
        queryClient.invalidateQueries(['reviews', courseId]);
        queryClient.invalidateQueries(['course', courseId]);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to submit review');
      }
    }
  );

  // Progress update mutation
  const updateProgressMutation = useMutation<any, any, { currentTime: number; totalDuration?: number }>(
    (data) =>
      coursesAPI.updateProgress(courseId as string, data),
    {
      onSuccess: (data) => {
        if (data.completed && data.certificateId) {
          setGeneratedCertId(data.certificateId);
          setShowCertificate(true);
          queryClient.invalidateQueries(['enrollment', courseId]);
          toast.success('Congratulations! Course completed and certificate generated!');
        }
      },
      onError: (error: any) => {
        console.error('Progress update failed:', error);
      }
    }
  );

  const [isTabActive, setIsTabActive] = useState(true);
  const lastSyncTimeRef = useRef<number>(0);

  // Tab visibility listener for engagement tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      const active = document.visibilityState === 'visible';
      setIsTabActive(active);
      if (!active) {
        console.log('User switched tab - pausing engagement tracking');
      } else {
        console.log('User returned to tab - resuming engagement tracking');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Throttled progress update for the backend
  const handleProgressUpdate = async (time: number) => {
    // 1. Update UI immediately (1s resolution from VideoPlayer)
    setCurrentTime(time);
    
    // 2. Calculate and update live progress percentage
    const actualDuration = duration || lesson?.duration || 0;
    if (actualDuration > 0) {
      const calculatedProgress = Math.min(Math.round((time / actualDuration) * 100), 100);
      setLiveProgress(calculatedProgress);
    }
    
    // 3. Engagement tracking: only sync if tab is active
    if (!isTabActive) return;

    // 4. Decide if we should sync to backend (every 15s or on large jumps)
    const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
    const shouldSync = timeSinceLastSync >= 15000 || Math.abs(time - lastSyncTimeRef.current / 1000) > 30;

    if (shouldSync && courseId && lesson?._id) {
       lastSyncTimeRef.current = Date.now();
       try {
         const response: any = await progressAPI.updateProgress({
           courseId: courseId as string,
           lessonId: lesson._id,
           watchedTime: time,
           totalDuration: actualDuration,
           isLessonCompleted: actualDuration > 0 && time >= actualDuration * 0.90,
           isTabActive
         });
         
         // Update enrollment progress from backend response if available
         if (response?.enrollmentProgress !== undefined) {
           queryClient.setQueryData(['enrollment', courseId], (old: any) => ({
             ...old,
             progress: response.enrollmentProgress
           }));
         }
         
         if (actualDuration > 0 && time >= actualDuration * 0.90) {
           queryClient.invalidateQueries(['enrollment', courseId]);
         }
       } catch (error) {
         console.error('Failed to sync progress:', error);
       }
    }
  };

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

  if (!enrollment?.enrolled) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          You need to enroll in this course to access the content.
        </p>
        <Button 
          className="mt-4"
          onClick={() => router.push(`/courses/${courseId}`)}
        >
          Go to Course Page
        </Button>
      </div>
    );
  }

  // Support both new 'lessons' array and legacy 'chapters' array
  const lesson = (course.lessons && course.lessons.length > 0) 
    ? {
        ...course.lessons[0],
        videoId: getYouTubeVideoId(course.lessons[0].videoId)
      } 
    : (course.chapters && course.chapters.length > 0)
      ? {
          _id: course.chapters[0]._id || 'intro',
          title: course.chapters[0].title,
          videoId: getYouTubeVideoId(course.chapters[0].videoId || course.chapters[0].videoUrl),
          duration: (() => {
            const raw = course.chapters[0].duration;
            if (typeof raw === 'number') return raw;
            if (typeof raw !== 'string') return 0;
            const parts = raw.split(':');
            if (parts.length === 2) {
              return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
            }
            return parseInt(raw) || 0;
          })()
        }
      : null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = liveProgress || enrollment?.progress || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Certificate Modal */}
      {showCertificate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Congratulations!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You've completed the course and earned your certificate!
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCertificate(false)}
                className="flex-1"
              >
                Continue Learning
              </Button>
              <Button
                onClick={async () => {
                  const certId = generatedCertId || enrollment?.certificateId;
                  console.log('Attempting to download certificate:', certId);
                  if (certId) {
                    try {
                      await certificatesAPI.downloadCertificate(certId);
                      toast.success('Certificate downloaded successfully!');
                    } catch (error: any) {
                      console.error('Download error:', error);
                      toast.error(error.message || 'Failed to download certificate');
                    }
                  } else {
                    console.error('No certificate ID found. Enrollment:', enrollment);
                    toast.error('Certificate ID not found. Please refresh the page.');
                  }
                }}
                className="flex-1"
              >
                Download Certificate
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => router.push(`/courses/${courseId}`)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors group"
        >
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium">Back to Course</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-0 overflow-hidden">
              {/* Video Player */}
              <VideoPlayer
                videoId={lesson?.videoId || ''}
                title={lesson?.title || course.title}
                courseId={courseId as string}
                lessonId={lesson?._id}
                startTime={enrollment?.lastWatchedTime || 0}
                totalDuration={duration || lesson?.duration}
                onProgress={handleProgressUpdate}
                onDurationLoaded={(dur) => {
                  console.log('Video duration loaded:', dur);
                  setDuration(dur);
                }}
                onComplete={() => handleProgressUpdate(duration || lesson?.duration || 0)}
              />

              {/* Video Controls Info */}
              <div className="p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {lesson?.title || course.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    {enrollment.lastWatchedTime > 10 && !enrollment.completed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast.success(`Resumed from ${formatTime(enrollment.lastWatchedTime)}`);
                        }}
                        className="text-xs py-1 h-8"
                      >
                        Resume from {formatTime(enrollment.lastWatchedTime)}
                      </Button>
                    )}
                    <Badge variant={enrollment.completed ? "success" : "primary"}>
                      {enrollment.completed ? "Completed" : `${progressPercentage}% Complete`}
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Video Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{(duration || lesson?.duration) ? formatTime(duration || lesson?.duration || 0) : 'Loading...'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>1 Lesson</span>
                  </div>
                  {enrollment.completed && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Tabs Section */}
            <Card className="p-0 overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'reviews'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Reviews ({reviewsData?.total || 0})
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'quiz'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Quiz
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                        About This Course
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                        {course.description}
                      </p>
                      
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 mt-6">
                        Instructor
                      </h3>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {course.instructorName?.charAt(0) || 'I'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {course.instructorName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Course Instructor
                          </p>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 mt-6">
                        What You'll Learn
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {course.tags?.map((tag, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300 capitalize">
                              {tag.replace('-', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'reviews' && (
                    <motion.div
                      key="reviews"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Course Reviews
                          </h3>
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                              {reviewsData?.averageRating?.toFixed(1) || '0.0'}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              ({reviewsData?.total || 0} reviews)
                            </span>
                          </div>
                        </div>

                        {/* Add Review Form (only if completed) */}
                        {enrollment?.completed && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                              Share Your Experience
                            </h4>
                            <div className="flex items-center gap-2 mb-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setReviewRating(star)}
                                  className="transition-transform hover:scale-110"
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      star <= reviewRating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Write your review here... (minimum 10 characters)"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              rows={4}
                            />
                            <Button
                              onClick={() => addReviewMutation.mutate()}
                              disabled={addReviewMutation.isLoading || reviewComment.length < 10}
                              className="mt-3"
                              size="sm"
                            >
                              {addReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                            </Button>
                          </div>
                        )}

                        {/* Reviews List */}
                        <div className="space-y-4">
                          {reviewsLoading ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                              <p className="text-gray-500 dark:text-gray-400 mt-2">Loading reviews...</p>
                            </div>
                          ) : reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                            reviewsData.reviews.map((review: any) => (
                              <div
                                key={review._id}
                                className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                                      {review.userId?.name?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {review.userId?.name || 'Anonymous'}
                                      </p>
                                      <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-4 h-4 ${
                                              i < review.rating
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                                      {review.comment}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                      <span>
                                        {new Date(review.createdAt).toLocaleDateString()}
                                      </span>
                                      <button 
                                        onClick={async () => {
                                          try {
                                            await reviewsAPI.markHelpful(review._id);
                                            refetchReviews();
                                            toast.success('Thank you for your feedback!');
                                          } catch (error: any) {
                                            toast.error(error.response?.data?.message || 'Failed to mark as helpful');
                                          }
                                        }}
                                        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                      >
                                        <ThumbsUp className="w-3 h-3" />
                                        <span>Helpful ({review.helpful?.length || 0})</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                              No reviews yet. Be the first to review this course!
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'quiz' && (
                    <motion.div
                      key="quiz"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Final Assessment
                      </h3>
                      
                      {!enrollment?.quizStatus?.unlocked ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            Complete the course to unlock the final assessment
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            Progress: {progressPercentage}% / 100%
                          </p>
                        </div>
                      ) : !enrollment?.quizStatus?.passed ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Ready to Test Your Knowledge?
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Take the final quiz to earn your certificate. You need 80% to pass.
                          </p>
                          {enrollment.quizStatus?.attempts > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              Previous attempts: {enrollment.quizStatus.attempts} | Best score: {enrollment.quizStatus.bestScore}%
                            </p>
                          )}
                          <Button
                            onClick={() => router.push(`/courses/${courseId}/quiz`)}
                            icon={<FileText className="w-4 h-4" />}
                          >
                            {enrollment.quizStatus?.attempts > 0 ? 'Retake Quiz' : 'Start Quiz'}
                          </Button>
                        </div>
                      ) : (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
                          </div>
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                            Congratulations!
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            You passed the quiz with {enrollment.quizStatus.bestScore}%
                          </p>
                          <Button
                            onClick={() => router.push('/dashboard?tab=certificates')}
                            icon={<Award className="w-4 h-4" />}
                          >
                            View Certificate
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </div>

          {/* Course Details Section */}
          <div className="space-y-6">
            {/* Course Info */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Course Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {course.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Instructor</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {course.instructorName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Level</span>
                  <Badge variant="outline">{course.level}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Category</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {course.category}
                  </span>
                </div>
              </div>
            </Card>

            {/* Lesson List */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Course Content
              </h2>
              
              <div className="space-y-3">
                {(lesson ? (course.lessons?.length ? course.lessons : course.chapters) : []).map((lessonItem: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        {enrollment.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {lessonItem.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {lessonItem.duration 
                            ? (typeof lessonItem.duration === 'string' ? lessonItem.duration : formatTime(lessonItem.duration)) 
                            : 'Duration loading...'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Take Quiz Button */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {!enrollment?.quizStatus?.unlocked ? (
                  <div className="text-center">
                    <Button
                      disabled
                      className="w-full opacity-50 cursor-not-allowed"
                      icon={<FileText className="w-4 h-4" />}
                    >
                      Take Quiz (Complete course to unlock)
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Progress: {progressPercentage}% / 100%
                    </p>
                  </div>
                ) : enrollment?.quizStatus?.passed ? (
                  <Button
                    onClick={() => router.push('/dashboard?tab=certificates')}
                    className="w-full bg-green-600 hover:bg-green-700"
                    icon={<Award className="w-4 h-4" />}
                  >
                    Quiz Passed - View Certificate
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push(`/courses/${courseId}/quiz`)}
                    className="w-full"
                    icon={<FileText className="w-4 h-4" />}
                  >
                    {enrollment.quizStatus?.attempts > 0 ? 'Retake Quiz' : 'Take Quiz'}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}