import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { coursesAPI, quizAPI } from '@/utils/api';
import { Course } from '@/types';
import { ArrowLeft, Award, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import Quiz from '@/components/Quiz';
import { toast } from 'react-hot-toast';

interface EnrollmentStatus {
  enrolled: boolean;
  progress: number;
  completed: boolean;
  videoCompleted?: boolean;
  quizStatus?: {
    available: boolean;
    unlocked: boolean;
    passed: boolean;
    bestScore: number | null;
    attempts: number;
  };
}

export default function QuizPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const queryClient = useQueryClient();
  const [showQuiz, setShowQuiz] = useState(false);

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery(
    ['course', courseId],
    () => coursesAPI.getCourse(courseId as string),
    { enabled: !!courseId }
  ) as { data: Course | undefined, isLoading: boolean };

  // Fetch enrollment status
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery<EnrollmentStatus>(
    ['enrollment', courseId],
    () => coursesAPI.getEnrollmentStatus(courseId as string) as Promise<EnrollmentStatus>,
    { enabled: !!courseId }
  );

  // Fetch quiz data
  const { data: quizData, isLoading: quizLoading } = useQuery(
    ['quiz', courseId],
    () => quizAPI.getQuiz(courseId as string),
    { 
      enabled: !!courseId && enrollment?.quizStatus?.unlocked,
      retry: false
    }
  );

  // Quiz submission mutation
  const submitQuizMutation = useMutation(
    (answers: { questionIndex: number; selectedOption: number }[]) =>
      quizAPI.submitQuiz(courseId as string, answers),
    {
      onSuccess: (data: any) => {
        queryClient.invalidateQueries(['enrollment', courseId]);
        
        if (data.passed) {
          toast.success('Congratulations! You passed the quiz!');
          // Redirect to certificates page after 2 seconds
          setTimeout(() => {
            router.push('/dashboard?tab=certificates');
          }, 2000);
        } else {
          toast.error(`You scored ${data.score}%. You need 80% to pass. Please try again.`);
          setShowQuiz(false);
        }
      },
      onError: (error: any) => {
        console.error('Quiz submission failed:', error);
        toast.error('Failed to submit quiz. Please try again.');
      }
    }
  );

  if (courseLoading || enrollmentLoading) {
    return <LoadingSpinner />;
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course not found</h2>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!enrollment?.enrolled) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            You need to enroll in this course to access the quiz.
          </p>
          <Button onClick={() => router.push(`/courses/${courseId}`)} className="mt-4">
            Go to Course Page
          </Button>
        </div>
      </div>
    );
  }

  // Quiz not unlocked yet
  if (!enrollment.quizStatus?.unlocked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => router.push(`/courses/${courseId}/learn`)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Course</span>
          </button>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Quiz Locked
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete the entire course video to unlock the final assessment quiz.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Your Progress</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {enrollment.progress}% / 100%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${enrollment.progress}%` }}
                  />
                </div>
              </div>
              <Button onClick={() => router.push(`/courses/${courseId}/learn`)}>
                Continue Learning
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz already passed
  if (enrollment.quizStatus?.passed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => router.push(`/courses/${courseId}/learn`)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Course</span>
          </button>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Quiz Completed!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Congratulations! You've passed the quiz with {enrollment.quizStatus.bestScore}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Total attempts: {enrollment.quizStatus.attempts}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/courses/${courseId}/learn`)}
                >
                  Back to Course
                </Button>
                <Button
                  onClick={() => router.push('/dashboard?tab=certificates')}
                  icon={<Award className="w-4 h-4" />}
                >
                  View Certificate
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz
  if (showQuiz && quizData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <Quiz
            courseId={courseId as string}
            courseTitle={(quizData as any).courseTitle}
            questions={(quizData as any).questions}
            passingScore={(quizData as any).passingScore}
            totalQuestions={(quizData as any).totalQuestions}
            onSubmit={async (answers) => {
              const result = await submitQuizMutation.mutateAsync(answers);
              return result;
            }}
            onClose={() => {
              setShowQuiz(false);
              router.push(`/courses/${courseId}/learn`);
            }}
          />
        </div>
      </div>
    );
  }

  // Quiz start page
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => router.push(`/courses/${courseId}/learn`)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course</span>
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {course.title} - Final Assessment
            </h1>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-3">Quiz Instructions:</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Total Questions: 10</li>
                <li>• Passing Score: 80% (8 out of 10 correct)</li>
                <li>• You can retake the quiz unlimited times</li>
                <li>• Each question has 4 options with only one correct answer</li>
                <li>• Review your answers before submitting</li>
                <li>• Certificate will be generated upon passing</li>
              </ul>
            </div>

            {enrollment.quizStatus && enrollment.quizStatus.attempts > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Previous Attempts
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Attempts: {enrollment.quizStatus.attempts}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Best Score: {enrollment.quizStatus.bestScore}%
                  </span>
                </div>
                {enrollment.quizStatus.bestScore && enrollment.quizStatus.bestScore < 80 && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                    You need {80 - enrollment.quizStatus.bestScore}% more to pass
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/courses/${courseId}/learn`)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowQuiz(true)}
                disabled={quizLoading}
                className="flex-1"
              >
                {quizLoading ? 'Loading Quiz...' : enrollment.quizStatus?.attempts > 0 ? 'Retake Quiz' : 'Start Quiz'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
