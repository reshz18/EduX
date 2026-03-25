const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const Course = require('../models/Course');
const UserProgress = require('../models/UserProgress');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const { body, validationResult } = require('express-validator');
const { generateQuizWithGrok } = require('../services/quizGenerator');

// @route   PUT /api/progress/update
// @desc    Update course and lesson progress
// @access  Private
router.put('/update', auth, [
  body('courseId').notEmpty().withMessage('Course ID is required'),
  body('lessonId').notEmpty().withMessage('Lesson ID is required'),
  body('watchedTime').isNumeric().withMessage('Watched time must be a number'),
  body('totalDuration').isNumeric().withMessage('Total duration must be a number'),
  body('isLessonCompleted').isBoolean().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, lessonId, watchedTime, totalDuration, isLessonCompleted } = req.body;
    const userId = req.user._id;

    // 1. Update LessonProgress using atomic operations
    // - lastWatchedTime is the current position (using $set or just simple update if it's the latest)
    // - totalWatchTime is accumulated (we'll calculate the delta if we want precision, or just use the ping interval)
    // For simplicity and to follow requested batching (every 10-15s):
    // We increment totalWatchTime by 15s (or actual delta if preferred)
    
    // Calculate completion 
    const completionThreshold = 0.90; // 90% as requested
    const isActuallyCompleted = isLessonCompleted || (watchedTime >= totalDuration * completionThreshold);

    const lessonUpdate = {
      $set: { 
        lastWatchedTime: watchedTime,
        lastWatchedAt: new Date()
      },
      $inc: { totalWatchTime: 15 } // Assuming a 15s ping interval as per VideoPlayer.tsx
    };

    if (isActuallyCompleted) {
      lessonUpdate.$set.completed = true;
    }

    const lessonProgress = await LessonProgress.findOneAndUpdate(
      { userId, courseId, lessonId },
      lessonUpdate,
      { upsert: true, new: true }
    );

    if (isActuallyCompleted && !lessonProgress.completed) {
      await logActivity(userId, 'lesson_completed', { courseId, lessonId });
    } else if (watchedTime > 0 && watchedTime < 20) {
      // Log started if just beginning (first couple of pings)
      await logActivity(userId, 'lesson_started', { courseId, lessonId });
    } else {
      // Regular heartbeat for engagement tracking
      await logActivity(userId, 'video_engagement_heartbeat', { 
        courseId, 
        lessonId, 
        watchedTime, 
        isTabActive: req.body.isTabActive !== false 
      });
    }

    // 2. Update overall Course Progress (Enrollment/UserProgress)
    const enrollment = await Enrollment.findOneAndUpdate(
      { userId, courseId },
      { 
        $set: { lastWatchedTime: watchedTime },
        $inc: { totalWatchTime: 15 }
      },
      { new: true }
    );

    if (enrollment) {
      // Recalculate progress percentage based on completed lessons + current lesson progress
      const course = await Course.findById(courseId);
      if (course) {
        // Support both 'lessons' and 'chapters' arrays
        const lessonsArray = course.lessons && course.lessons.length > 0 
          ? course.lessons 
          : (course.chapters || []);
        
        const totalLessons = lessonsArray.length;
        
        if (totalLessons === 0) {
          console.warn(`Course ${courseId} has no lessons or chapters`);
          return res.json({
            message: 'Progress updated successfully',
            lessonProgress,
            enrollmentProgress: enrollment ? enrollment.progress : 0
          });
        }
        
        const completedLessonsCount = await LessonProgress.countDocuments({ 
          userId, 
          courseId, 
          completed: true 
        });
        
        // Calculate progress including partial progress of current lesson
        let progressPct = 0;
        
        if (totalLessons === 1) {
          // For single-lesson courses, show progress based on watch time
          if (totalDuration > 0) {
            progressPct = Math.min(Math.round((watchedTime / totalDuration) * 100), 100);
          }
        } else {
          // For multi-lesson courses, calculate based on completed lessons + current lesson progress
          const completedProgress = (completedLessonsCount / totalLessons) * 100;
          const currentLessonProgress = totalDuration > 0 
            ? ((watchedTime / totalDuration) * (100 / totalLessons))
            : 0;
          progressPct = Math.min(Math.round(completedProgress + currentLessonProgress), 100);
        }
        
        enrollment.progress = progressPct;
        
        // Check if we should generate quiz at 50% progress
        if (progressPct >= 50 && !course.quizQuestions?.length) {
          console.log(`Progress reached 50% for course ${courseId}, generating quiz...`);
          try {
            const quizQuestions = await generateQuizWithGrok(
              course.title,
              course.description,
              course.category,
              course.level || 'Beginner',
              course.tags || [],
              10
            );
            
            course.quizQuestions = quizQuestions;
            await course.save();
            console.log(`Quiz generated successfully for course ${courseId}`);
          } catch (quizError) {
            console.error('Failed to generate quiz:', quizError);
            // Don't fail the progress update if quiz generation fails
          }
        }
        
        if (progressPct >= 100 && !enrollment.completed) {
          // Mark as video completed but NOT course completed
          // Course completion requires passing the quiz
          enrollment.videoCompleted = true;
          await logActivity(userId, 'course_video_completed', { courseId });

          // DO NOT create certificate here - only after quiz is passed
          // Certificate will be generated in quiz submission route
        }
        await enrollment.save();

        // Sync with UserProgress if it exists
        await UserProgress.findOneAndUpdate(
          { user: userId, course: courseId },
          { 
            $set: { 
              progress: progressPct,
              completed: enrollment.completed,
              lastWatchedTime: watchedTime
            },
            $inc: { totalWatchTime: 15 }
          },
          { upsert: true }
        );
      }
    }

    res.json({
      message: 'Progress updated successfully',
      lessonProgress,
      enrollmentProgress: enrollment ? enrollment.progress : null
    });


  } catch (error) {
    console.error('Progress Update Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
