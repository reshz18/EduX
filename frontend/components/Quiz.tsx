import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Award, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

interface QuizQuestion {
  index: number;
  question: string;
  options: string[];
}

interface QuizResult {
  questionIndex: number;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
}

interface QuizProps {
  courseId: string;
  courseTitle: string;
  questions: QuizQuestion[];
  passingScore: number;
  totalQuestions: number;
  onSubmit: (answers: { questionIndex: number; selectedOption: number }[]) => Promise<any>;
  onClose: () => void;
}

export default function Quiz({ 
  courseId, 
  courseTitle, 
  questions, 
  passingScore, 
  totalQuestions,
  onSubmit,
  onClose 
}: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const handleSelectOption = (optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = questions.filter((_, idx) => answers[idx] === undefined);
    if (unanswered.length > 0) {
      alert(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionIndex, selectedOption]) => ({
        questionIndex: parseInt(questionIndex),
        selectedOption
      }));

      const result = await onSubmit(formattedAnswers);
      setResults(result);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setResults(null);
    setShowResults(false);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  if (showResults && results) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            {results.passed ? (
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            )}
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {results.passed ? 'Congratulations!' : 'Keep Trying!'}
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              {results.message}
            </p>

            <div className="flex items-center justify-center gap-8 mb-6">
              <div>
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {results.score}%
                </div>
                <div className="text-sm text-gray-500">Your Score</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {results.correctAnswers}/{results.totalQuestions}
                </div>
                <div className="text-sm text-gray-500">Correct Answers</div>
              </div>
            </div>

            {results.passed && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  🎉 You've earned your certificate! You can download it from the course page.
                </p>
              </div>
            )}
          </div>

          {/* Detailed Results */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Review Your Answers</h3>
            {results.results.map((result: QuizResult, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  result.isCorrect
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white mb-2">
                      Question {idx + 1}: {questions[idx].question}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your answer: <span className={result.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {questions[idx].options[result.selectedOption]}
                      </span>
                    </p>
                    {!result.isCorrect && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Correct answer: {questions[idx].options[result.correctOption]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {!results.passed && (
              <Button onClick={handleRetry} variant="outline" className="flex-1" icon={<RefreshCw className="w-4 h-4" />}>
                Try Again
              </Button>
            )}
            <Button onClick={onClose} className="flex-1">
              {results.passed ? 'View Certificate' : 'Back to Course'}
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {courseTitle} - Final Quiz
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Answer all {totalQuestions} questions. You need {passingScore}% to pass and earn your certificate.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{answeredCount}/{questions.length} answered</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {currentQ.question}
              </h3>

              <div className="space-y-3">
                {currentQ.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      answers[currentQuestion] === idx
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        answers[currentQuestion] === idx
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {answers[currentQuestion] === idx && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="text-gray-900 dark:text-white">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            variant="outline"
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  idx === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[idx] !== undefined
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || answeredCount < questions.length}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={currentQuestion === questions.length - 1}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
