const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Course = require('../models/Course');
const QuizAttempt = require('../models/QuizAttempt');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// @route   GET /api/quiz/:courseId
// @desc    Get quiz questions for a course (without correct answers)
// @access  Private
router.get('/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if user has completed the course
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: courseId
    });
    
    if (!enrollment) {
      return res.status(403).json({ message: 'You must enroll in this course first' });
    }
    
    if (enrollment.progress < 100) {
      return res.status(403).json({ 
        message: 'You must complete the entire course before taking the quiz',
        progress: enrollment.progress
      });
    }
    
    // Get course with quiz questions
    const course = await Course.findById(courseId).select('quizQuestions quizPassingScore title');
    
    if (!course || !course.quizQuestions || course.quizQuestions.length === 0) {
      return res.status(404).json({ message: 'No quiz available for this course' });
    }
    
    // Return questions without correct answers
    const questions = course.quizQuestions.map((q, index) => ({
      index,
      question: q.question,
      options: q.options
    }));
    
    // Get previous attempts
    const attempts = await QuizAttempt.find({
      userId: req.user._id,
      courseId: courseId
    }).sort({ createdAt: -1 }).limit(5);
    
    res.json({
      courseTitle: course.title,
      questions,
      passingScore: course.quizPassingScore || 80,
      totalQuestions: questions.length,
      previousAttempts: attempts
    });
    
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/quiz/:courseId/submit
// @desc    Submit quiz answers and generate certificate if passed
// @access  Private
router.post('/:courseId/submit', auth, [
  body('answers').isArray().withMessage('Answers must be an array'),
  body('answers.*.questionIndex').isNumeric().withMessage('Question index must be a number'),
  body('answers.*.selectedOption').isNumeric().withMessage('Selected option must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { courseId } = req.params;
    const { answers } = req.body;
    
    // Check enrollment
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: courseId
    });
    
    if (!enrollment || enrollment.progress < 100) {
      return res.status(403).json({ message: 'You must complete the course first' });
    }
    
    // Get course with correct answers
    const course = await Course.findById(courseId);
    
    if (!course || !course.quizQuestions || course.quizQuestions.length === 0) {
      return res.status(404).json({ message: 'No quiz available for this course' });
    }
    
    // Calculate score
    let correctAnswers = 0;
    const results = answers.map(answer => {
      const question = course.quizQuestions[answer.questionIndex];
      const isCorrect = question && question.correctAnswer === answer.selectedOption;
      if (isCorrect) correctAnswers++;
      
      return {
        questionIndex: answer.questionIndex,
        selectedOption: answer.selectedOption,
        correctOption: question ? question.correctAnswer : null,
        isCorrect
      };
    });
    
    const score = Math.round((correctAnswers / course.quizQuestions.length) * 100);
    const passed = score >= (course.quizPassingScore || 80);
    
    // Get attempt number
    const previousAttempts = await QuizAttempt.countDocuments({
      userId: req.user._id,
      courseId: courseId
    });
    
    // Save quiz attempt
    const quizAttempt = new QuizAttempt({
      userId: req.user._id,
      courseId: courseId,
      answers: answers,
      score: score,
      totalQuestions: course.quizQuestions.length,
      passed: passed,
      attemptNumber: previousAttempts + 1
    });
    
    await quizAttempt.save();
    
    // If passed and no certificate exists, generate certificate
    let certificate = null;
    if (passed) {
      certificate = await Certificate.findOne({
        userId: req.user._id,
        courseId: courseId
      });
      
      if (!certificate) {
        const user = await User.findById(req.user._id);
        
        certificate = new Certificate({
          userId: req.user._id,
          courseId: courseId,
          userName: user.name || 'Student',
          courseName: course.title || 'Course',
          instructorName: course.instructorName || 'Instructor',
          instructorSignatureUrl: course.instructorSignatureUrl || '',
          completionDate: new Date()
        });
        
        await certificate.save();
        
        // Mark enrollment as completed with certificate
        enrollment.completed = true;
        enrollment.completedAt = new Date();
        await enrollment.save();
      }
    }
    
    res.json({
      success: true,
      passed: passed,
      score: score,
      correctAnswers: correctAnswers,
      totalQuestions: course.quizQuestions.length,
      passingScore: course.quizPassingScore || 80,
      results: results,
      certificateId: certificate ? certificate.certificateId : null,
      attemptNumber: quizAttempt.attemptNumber,
      message: passed 
        ? 'Congratulations! You passed the quiz and earned your certificate!' 
        : `You scored ${score}%. You need ${course.quizPassingScore || 80}% to pass. Please try again.`
    });
    
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
