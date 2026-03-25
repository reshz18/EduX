const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const UserProgress = require('../models/UserProgress');
const LessonProgress = require('../models/LessonProgress');
const ActivityLog = require('../models/ActivityLog');
const QuizAttempt = require('../models/QuizAttempt');
const Review = require('../models/Review');

// @route   GET /api/analytics/overview
// @desc    Get platform/educator overview stats
// @access  Private (Educator)
router.get('/overview', auth, requireRole(['EDUCATOR']), async (req, res) => {
  try {
    const instructorId = req.user._id;
    console.log('📊 Analytics Overview Request');
    console.log('   Instructor ID:', instructorId);
    console.log('   Instructor Name:', req.user.name);
    console.log('   Instructor Email:', req.user.email);

    // 1. Basic counts for instructor's courses
    const courses = await Course.find({ instructor: instructorId });
    console.log('   Courses found:', courses.length);
    const courseIds = courses.map(c => c._id);

    const totalCourses = courses.length;
    const totalEnrollments = await Enrollment.countDocuments({ courseId: { $in: courseIds } });
    console.log('   Total Enrollments:', totalEnrollments);
    
    // 2. Active Students (last 7 days activity)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeStudentsCount = await Enrollment.distinct('userId', {
      courseId: { $in: courseIds },
      updatedAt: { $gte: sevenDaysAgo }
    }).then(users => users.length);

    const totalStudents = await Enrollment.distinct('userId', {
      courseId: { $in: courseIds }
    }).then(users => users.length);

    // 3. Completion Rate
    const completedCount = await Enrollment.countDocuments({
      courseId: { $in: courseIds },
      completed: true
    });
    const avgCompletionRate = totalEnrollments > 0 
      ? Math.round((completedCount / totalEnrollments) * 100) 
      : 0;

    // 4. Total Learning Time (in hours)
    const totalWatchTimeData = await Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: null, total: { $sum: "$totalWatchTime" } } }
    ]);
    const totalLearningTime = totalWatchTimeData.length > 0 
      ? Math.round(totalWatchTimeData[0].total / 3600) 
      : 0;

    // 5. Enrollment Growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const enrollmentGrowth = await Enrollment.aggregate([
      { 
        $match: { 
          courseId: { $in: courseIds },
          enrolledAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$enrolledAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 6. Course Popularity
    const coursePopularity = await Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: "$courseId", studentCount: { $sum: 1 } } },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: "$course" },
      { $project: { name: "$course.title", studentCount: 1 } },
      { $sort: { studentCount: -1 } },
      { $limit: 5 }
    ]);

    // 7. Completion Distribution
    const completed = await Enrollment.countDocuments({ courseId: { $in: courseIds }, completed: true });
    const inProgress = await Enrollment.countDocuments({ courseId: { $in: courseIds }, completed: false, progress: { $gt: 0 } });
    const notStarted = await Enrollment.countDocuments({ courseId: { $in: courseIds }, progress: 0 });

    // 8. Daily Active Users (Unique users who had progress updates in last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const dailyActiveUsers = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: fourteenDaysAgo },
          // Filter for actions that indicate learning activity
          actionType: { $in: ['lesson_started', 'lesson_completed'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          users: { $addToSet: "$userId" }
        }
      },
      {
        $project: {
          date: "$_id",
          count: { $size: "$users" }
        }
      },
      { $sort: { "date": 1 } }
    ]);

    // 9. Quiz Performance
    const quizAttempts = await QuizAttempt.find({ courseId: { $in: courseIds } });
    const totalQuizAttempts = quizAttempts.length;
    const passedQuizzes = quizAttempts.filter(q => q.passed).length;
    const avgQuizScore = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((sum, q) => sum + q.score, 0) / quizAttempts.length)
      : 0;

    // 10. Reviews Summary
    const reviews = await Review.find({ courseId: { $in: courseIds } });
    const totalReviews = reviews.length;
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    console.log('   Completed Count:', completedCount);
    console.log('   In Progress:', inProgress);
    console.log('   Not Started:', notStarted);
    console.log('   Sending response with totalEnrollments:', totalEnrollments);

    res.json({
      metrics: {
        totalStudents,
        activeStudents: activeStudentsCount,
        totalCourses,
        totalEnrollments,
        avgCompletionRate,
        totalLearningTime,
        totalQuizAttempts,
        avgQuizScore,
        totalReviews,
        avgRating
      },
      charts: {
        enrollmentGrowth,
        coursePopularity,
        completionDistribution: [
          { name: 'Completed', value: completed },
          { name: 'In Progress', value: inProgress },
          { name: 'Not Started', value: notStarted }
        ],
        dailyActiveUsers
      }
    });

  } catch (error) {
    console.error('Overview Analytics Error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// @route   GET /api/analytics/course/:courseId
// @desc    Get detailed analytics for a specific course
// @access  Private (Educator)
router.get('/course/:courseId', auth, requireRole(['EDUCATOR']), async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log('📊 Course Analytics Request');
    console.log('   Course ID:', courseId);
    console.log('   Instructor:', req.user.name);
    
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Ensure instructor owns the course
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const totalEnrollments = await Enrollment.countDocuments({ courseId });
    const completedCount = await Enrollment.countDocuments({ courseId, completed: true });
    const completionRate = totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0;

    const watchTimeData = await Enrollment.aggregate([
      { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
      { $group: { _id: null, avg: { $avg: "$totalWatchTime" } } }
    ]);
    const avgWatchTime = watchTimeData.length > 0 ? Math.round(watchTimeData[0].avg / 60) : 0; // in minutes

    // Most watched lesson
    const lessonEngagement = await LessonProgress.aggregate([
      { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
      { $group: { _id: "$lessonId", count: { $sum: 1 }, totalTime: { $sum: "$watchedTime" } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    let mostWatchedLesson = 'N/A';
    if (lessonEngagement.length > 0) {
      // Find lesson title from course
      const lessonId = lessonEngagement[0]._id;
      const lesson = course.lessons.find(l => l._id.toString() === lessonId) || 
                     course.chapters.find(c => c._id.toString() === lessonId);
      mostWatchedLesson = lesson ? lesson.title : 'Lesson ' + lessonId;
    }

    // Drop-off points (Progress buckets)
    const dropOffBuckets = await Enrollment.aggregate([
      { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
      {
        $bucket: {
          groupBy: "$progress",
          boundaries: [0, 10, 25, 50, 75, 90, 101],
          default: "Other",
          output: {
            "count": { $sum: 1 }
          }
        }
      }
    ]);

    // Quiz Analytics
    const quizAttempts = await QuizAttempt.find({ courseId: new mongoose.Types.ObjectId(courseId) });
    const quizStats = {
      totalAttempts: quizAttempts.length,
      passRate: quizAttempts.length > 0 
        ? Math.round((quizAttempts.filter(q => q.passed).length / quizAttempts.length) * 100)
        : 0,
      avgScore: quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, q) => sum + q.score, 0) / quizAttempts.length)
        : 0
    };

    // Reviews Analytics
    const reviews = await Review.find({ courseId: new mongoose.Types.ObjectId(courseId) })
      .populate('userId', 'name avatar');
    const reviewStats = {
      totalReviews: reviews.length,
      avgRating: reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0,
      ratingDistribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      },
      recentReviews: reviews.slice(0, 5).map(r => ({
        userName: r.userId?.name || 'Anonymous',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt
      }))
    };

    // Enrolled Students List with Full Details
    const enrolledStudents = await Enrollment.find({ courseId: new mongoose.Types.ObjectId(courseId) })
      .populate('userId', 'name email avatar createdAt')
      .sort({ enrolledAt: -1 })
      .lean();

    const enrolledStudentsList = enrolledStudents.map(e => ({
      _id: e.userId?._id,
      name: e.userId?.name || 'Unknown',
      email: e.userId?.email || 'N/A',
      avatar: e.userId?.avatar,
      progress: e.progress,
      completed: e.completed,
      enrolledAt: e.enrolledAt,
      lastActive: e.updatedAt,
      totalWatchTime: Math.round(e.totalWatchTime / 60), // minutes
      status: e.completed ? 'Completed' : (e.progress > 0 ? 'In Progress' : 'Not Started'),
      quizPassed: false, // Will be updated below
      certificateGenerated: e.completed && e.certificateId ? true : false
    }));

    // Add quiz status for each student
    for (let student of enrolledStudentsList) {
      const studentQuizAttempts = await QuizAttempt.find({
        userId: student._id,
        courseId: new mongoose.Types.ObjectId(courseId)
      }).sort({ createdAt: -1 });
      
      if (studentQuizAttempts.length > 0) {
        const bestAttempt = studentQuizAttempts.reduce((best, current) => 
          current.score > best.score ? current : best
        );
        student.quizPassed = bestAttempt.passed;
        student.quizScore = bestAttempt.score;
        student.quizAttempts = studentQuizAttempts.length;
      }
    }

    // Completed Students List (subset of enrolled)
    const completedStudentsList = enrolledStudentsList.filter(s => s.completed);

    res.json({
      totalEnrollments,
      completionRate,
      avgWatchTime,
      mostWatchedLesson,
      dropOffPoints: dropOffBuckets.map(b => ({
        range: b._id === 101 ? '100%' : `${b._id}%`,
        count: b.count
      })),
      quizStats,
      reviewStats,
      enrolledStudents: enrolledStudentsList,
      completedStudents: completedStudentsList
    });

  } catch (error) {
    console.error('Course Analytics Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/student/:studentId
// @desc    Get tracking info for a specific student
// @access  Private (Educator)
router.get('/student/:studentId', auth, requireRole(['EDUCATOR']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId).select('name email createdAt');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const enrollments = await Enrollment.find({ userId: studentId })
      .populate('courseId', 'title category thumbnail totalDuration');

    const totalCoursesEnrolled = enrollments.length;
    const totalCoursesCompleted = enrollments.filter(e => e.completed).length;
    
    const totalTimeData = await Enrollment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(studentId) } },
      { $group: { _id: null, total: { $sum: "$totalWatchTime" } } }
    ]);
    const totalLearningTime = totalTimeData.length > 0 ? Math.round(totalTimeData[0].total / 3600) : 0;

    const avgProgress = enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0;

    const courseTableData = enrollments.map(e => ({
      name: e.courseId.title,
      progress: e.progress,
      lastWatchedAt: e.updatedAt,
      status: e.completed ? 'Completed' : (e.progress > 0 ? 'In Progress' : 'Not Started'),
      totalWatchTime: Math.round(e.totalWatchTime / 60) // in minutes
    }));

    res.json({
      studentInfo: {
        name: student.name,
        email: student.email,
        joinDate: student.createdAt
      },
      learningStats: {
        coursesEnrolled: totalCoursesEnrolled,
        coursesCompleted: totalCoursesCompleted,
        totalLearningTime,
        averageProgress: avgProgress
      },
      courseTable: courseTableData
    });

  } catch (error) {
    console.error('Student Tracking Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/me
// @desc    Get personal learning analytics for current student
// @access  Private (Student)
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const enrollments = await Enrollment.find({ userId });
    
    const totalLearningTimeData = await Enrollment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$totalWatchTime" } } }
    ]);
    const totalLearningHours = totalLearningTimeData.length > 0 ? Math.round(totalLearningTimeData[0].total / 3600) : 0;
    
    const coursesInProgress = enrollments.filter(e => !e.completed && e.progress > 0).length;
    const coursesCompleted = enrollments.filter(e => e.completed).length;

    // Weekly Streak (Check last lesson completions/starts)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await ActivityLog.find({
      userId,
      createdAt: { $gte: sevenDaysAgo },
      actionType: { $in: ['lesson_started', 'lesson_completed'] }
    });

    const activeDays = new Set(recentActivity.map(a => new Date(a.createdAt).toDateString()));
    const weeklyLearningStreak = activeDays.size;

    // Average Session Duration
    // Sessions = number of 'lesson_started' events in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sessionCount = await ActivityLog.countDocuments({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
      actionType: 'lesson_started'
    });
    
    const avgSessionDuration = sessionCount > 0 
      ? Math.round((totalLearningHours * 3600) / sessionCount / 60) // in minutes
      : 0;

    // Weekly Activity Graph
    const weeklyActivity = await ActivityLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: sevenDaysAgo },
          actionType: 'lesson_completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json({
      totalLearningHours,
      coursesInProgress,
      coursesCompleted,
      weeklyLearningStreak,
      avgSessionDuration,
      weeklyActivity
    });


  } catch (error) {
    console.error('Me Analytics Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/students/search
// @desc    Search students by name or email
// @access  Private (Educator)
router.get('/students/search', auth, requireRole(['EDUCATOR']), async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json([]);
    }

    const students = await User.find({
      role: 'student',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name email avatar createdAt')
    .limit(10);

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
