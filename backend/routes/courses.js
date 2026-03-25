const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const QuizAttempt = require('../models/QuizAttempt');
const { auth, requireRole } = require('../middleware/auth');
const { requireOnboardingComplete } = require('../middleware/onboarding');
const PDFDocument = require('pdfkit');

const router = express.Router();

// Get all courses with advanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      level, 
      search, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      instructor,
      minRating = 0,
      maxPrice = 10000
    } = req.query;
    
    const query = { isPublished: true, visibility: 'Public' };

    // Apply filters
    if (category && category !== 'all') query.category = category;
    if (level && level !== 'all') query.level = level;
    if (instructor) query.instructor = instructor;
    if (minRating > 0) query['rating.average'] = { $gte: parseFloat(minRating) };
    if (maxPrice < 10000) query.pointsRequired = { $lte: parseInt(maxPrice) };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { instructorName: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const courses = await Course.find(query)
      .populate('instructor', 'name avatar bio')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Course.countDocuments(query);

    // Get categories for filtering
    const categories = await Course.distinct('category', { isPublished: true });
    const levels = await Course.distinct('level', { isPublished: true });

    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      filters: {
        categories,
        levels
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's certificates (MUST be before /:id route)
router.get('/certificates', auth, async (req, res) => {
  try {
    console.log('Fetching certificates for user:', req.user._id);
    
    const certificates = await Certificate.find({ userId: req.user._id })
      .sort({ issuedAt: -1 });

    console.log('Found certificates:', certificates.length);
    
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's enrolled courses with progress (MUST be before /:id route)
router.get('/my-courses', auth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user._id })
      .populate('courseId', 'title description thumbnail instructor instructorName category level totalDuration')
      .sort({ enrolledAt: -1 });

    const coursesWithProgress = enrollments.map(enrollment => ({
      ...enrollment.courseId.toObject(),
      enrollment: {
        progress: enrollment.progress,
        lastWatchedTime: enrollment.lastWatchedTime,
        completed: enrollment.completed,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        totalWatchTime: enrollment.totalWatchTime
      }
    }));

    res.json(coursesWithProgress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get educator's own courses (MUST be before /:id route)
router.get('/educator/my-courses', auth, requireRole(['EDUCATOR']), async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .sort({ createdAt: -1 });

    const coursesWithStats = await Promise.all(courses.map(async (course) => {
      const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });
      const completedCount = await Enrollment.countDocuments({ courseId: course._id, completed: true });
      return {
        ...course.toObject(),
        enrollmentCount,
        completedCount,
        completionRate: enrollmentCount > 0 ? Math.round((completedCount / enrollmentCount) * 100) : 0
      };
    }));

    res.json(coursesWithStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's learning analytics (MUST be before /:id route)
router.get('/analytics/learning', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const progressRecords = await UserProgress.find({ user: userId })
      .populate('course', 'title category level');

    const totalCoursesEnrolled = user.coursesEnrolled.length + user.coursesCompleted.length;
    const totalCoursesCompleted = user.coursesCompleted.length;
    const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.totalTimeSpent, 0);
    const averageProgress = progressRecords.length > 0
      ? progressRecords.reduce((sum, p) => sum + p.totalProgress, 0) / progressRecords.length
      : 0;

    const categoryStats = {};
    progressRecords.forEach(progress => {
      const category = progress.course.category;
      if (!categoryStats[category]) categoryStats[category] = { enrolled: 0, completed: 0, timeSpent: 0 };
      categoryStats[category].enrolled += 1;
      if (progress.isCompleted) categoryStats[category].completed += 1;
      categoryStats[category].timeSpent += progress.totalTimeSpent;
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivity = progressRecords.filter(p => p.lastAccessedAt >= thirtyDaysAgo).length;

    res.json({
      overview: {
        totalCoursesEnrolled,
        totalCoursesCompleted,
        completionRate: totalCoursesEnrolled > 0 ? Math.round((totalCoursesCompleted / totalCoursesEnrolled) * 100) : 0,
        totalTimeSpent: Math.round(totalTimeSpent / 60),
        averageProgress: Math.round(averageProgress),
        totalPoints: user.points,
        totalBadges: user.badges.length
      },
      categoryStats,
      recentActivity,
      progressRecords: progressRecords.map(p => ({
        courseId: p.course._id,
        courseName: p.course.title,
        category: p.course.category,
        level: p.course.level,
        progress: p.totalProgress,
        timeSpent: Math.round(p.totalTimeSpent / 60),
        lastAccessed: p.lastAccessedAt,
        isCompleted: p.isCompleted
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course by ID with detailed information
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar bio')
      .populate('reviews.user', 'name avatar')
      .populate('enrolledStudents', 'name avatar');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // If user is authenticated, check enrollment status
    let enrollmentStatus = null;
    if (req.user) {
      const user = await User.findById(req.user._id);
      const enrolled = user.coursesEnrolled.find(
        enrollment => enrollment.courseId.toString() === course._id.toString()
      );
      const completed = user.coursesCompleted.find(
        completion => completion.courseId.toString() === course._id.toString()
      );

      if (completed) {
        enrollmentStatus = { status: 'completed', progress: 100 };
      } else if (enrolled) {
        enrollmentStatus = { status: 'enrolled', progress: enrolled.progress };
      } else {
        enrollmentStatus = { status: 'not_enrolled', progress: 0 };
      }
    }

    res.json({
      ...course.toObject(),
      enrollmentStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get students enrolled in a course (educator only)
router.get('/:id/students', auth, requireRole(['EDUCATOR']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const enrollments = await Enrollment.find({ courseId: req.params.id })
      .populate('userId', 'name email avatar')
      .sort({ enrolledAt: -1 });

    const students = enrollments.map(e => ({
      id: e.userId._id,
      name: e.userId.name,
      email: e.userId.email,
      avatar: e.userId.avatar,
      progress: e.progress,
      completed: e.completed,
      enrolledAt: e.enrolledAt,
      lastActive: e.updatedAt,
      totalWatchTime: e.totalWatchTime
    }));

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Create course (Educators only)
router.post('/', auth, requireOnboardingComplete, requireRole(['EDUCATOR']), [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3-200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10-2000 characters'),
  body('category').notEmpty().withMessage('Category is required'),
  body('level').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level'),
  body('thumbnail').notEmpty().withMessage('Thumbnail is required'),
  // Tags can be array or will be converted
  body('pointsRequired').optional().isInt({ min: 0 }).withMessage('Points required must be a positive integer')
], async (req, res) => {
  try {
    console.log('=== BACKEND: Creating course ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user.name, req.user._id);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('=== VALIDATION ERRORS ===');
      console.error(JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    // Ensure tags is an array
    let tags = req.body.tags || [];
    if (typeof tags === 'string') {
      tags = tags.split(',').map(t => t.trim()).filter(Boolean);
    } else if (!Array.isArray(tags)) {
      tags = [];
    }

    const courseData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      level: req.body.level || 'Beginner',
      thumbnail: req.body.thumbnail,
      tags: tags,
      pointsRequired: req.body.pointsRequired || 0,
      instructor: req.user._id,
      instructorName: req.user.name,
      instructorSignatureUrl: req.body.instructorSignatureUrl || '',
      isPublished: req.body.isPublished || false,
      visibility: req.body.visibility || 'Public',
      chapters: req.body.chapters || [],
      lessons: req.body.lessons || []
    };

    console.log('=== PROCESSED COURSE DATA ===');
    console.log(JSON.stringify(courseData, null, 2));

    const course = new Course(courseData);
    await course.save();

    console.log('=== SUCCESS: Course saved ===');
    console.log('Course ID:', course._id);

    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'name avatar bio');

    res.status(201).json(populatedCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ 
      message: 'Server error. Please try again later.',
      error: error.message 
    });
  }
});

// Update course
router.put('/:id', auth, requireRole(['EDUCATOR']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('instructor', 'name avatar bio');

    res.json(updatedCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete course
router.delete('/:id', auth, requireRole(['EDUCATOR']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll in course
router.post('/:id/enroll', auth, requireOnboardingComplete, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: course._id
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Check if user has enough points
    if (course.pointsRequired > user.points) {
      return res.status(400).json({ 
        message: 'Insufficient points',
        required: course.pointsRequired,
        available: user.points
      });
    }

    // Deduct points and create enrollment
    user.points -= course.pointsRequired;
    await user.save();

    const enrollment = new Enrollment({
      userId: req.user._id,
      courseId: course._id,
      progress: 0,
      lastWatchedTime: 0,
      completed: false
    });

    await enrollment.save();

    // Add to course enrolled students
    course.enrolledStudents.push(user._id);
    await course.save();

    // Create notification
    await Notification.create({
      recipient: user._id,
      type: 'course_enrollment',
      title: 'Course Enrollment Successful',
      message: `You've successfully enrolled in "${course.title}". Start learning now!`,
      data: { courseId: course._id, courseName: course.title }
    });

    res.json({ 
      message: 'Successfully enrolled in course',
      remainingPoints: user.points,
      enrollment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update course progress
router.put('/:id/progress', auth, [
  body('currentTime').isNumeric().withMessage('Current time must be a number'),
  body('totalDuration').optional().isNumeric().withMessage('Total duration must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentTime, totalDuration } = req.body;
    const courseId = req.params.id;
    const userId = req.user._id;

    // Find enrollment
    const enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      return res.status(400).json({ message: 'Not enrolled in this course' });
    }

    // Update last watched time
    enrollment.lastWatchedTime = currentTime;
    enrollment.totalWatchTime = Math.max(enrollment.totalWatchTime, currentTime);

    // Calculate progress if total duration is provided
    if (totalDuration && totalDuration > 0) {
      const progress = Math.min(Math.round((currentTime / totalDuration) * 100), 100);
      enrollment.progress = progress;

      // Check for course completion (90% threshold)
      if (progress >= 90 && !enrollment.completed) {
        enrollment.completed = true;
        enrollment.completedAt = new Date();

        // Generate certificate
        const course = await Course.findById(courseId);
        const user = await User.findById(userId);

        const certificate = new Certificate({
          userId,
          courseId,
          userName: user.name,
          courseName: course.title,
          instructorName: course.instructorName,
          completionDate: new Date(),
          instructorSignatureUrl: course.instructorSignatureUrl || ''
        });

        await certificate.save();
        console.log('Certificate generated on completion:', certificate.certificateId);

        // Award completion points
        const bonusPoints = course.level === 'Advanced' ? 200 : 
                           course.level === 'Intermediate' ? 150 : 100;
        user.points += bonusPoints;
        await user.save();

        // Create completion notification
        await Notification.create({
          recipient: userId,
          type: 'course_completion',
          title: 'Course Completed!',
          message: `Congratulations! You've completed "${course.title}" and earned ${bonusPoints} bonus points!`,
          data: { courseId, courseName: course.title, bonusPoints, certificateId: certificate.certificateId }
        });

        await enrollment.save();

        return res.json({
          message: 'Course completed! Certificate generated.',
          progress: enrollment.progress,
          completed: true,
          certificateId: certificate.certificateId,
          bonusPoints
        });
      }
    }

    await enrollment.save();

    res.json({
      message: 'Progress updated successfully',
      progress: enrollment.progress,
      lastWatchedTime: enrollment.lastWatchedTime,
      completed: enrollment.completed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add course review
router.post('/:id/review', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, comment } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user completed the course
    const user = await User.findById(req.user._id);
    const hasCompleted = user.coursesCompleted.some(
      completion => completion.courseId.toString() === course._id.toString()
    );

    if (!hasCompleted) {
      return res.status(400).json({ message: 'You must complete the course before reviewing' });
    }

    // Check if user already reviewed
    const existingReview = course.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
    } else {
      // Add new review
      course.reviews.push({
        user: req.user._id,
        rating,
        comment
      });
    }

    // Update average rating
    const totalRating = course.reviews.reduce((sum, review) => sum + review.rating, 0);
    course.rating.average = totalRating / course.reviews.length;
    course.rating.count = course.reviews.length;

    await course.save();

    const updatedCourse = await Course.findById(course._id)
      .populate('reviews.user', 'name avatar');

    res.json({ 
      message: existingReview ? 'Review updated successfully' : 'Review added successfully',
      reviews: updatedCourse.reviews,
      rating: course.rating
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course analytics (for instructors)
router.get('/:id/analytics', auth, requireRole(['EDUCATOR']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view analytics' });
    }

    // Get enrollment analytics
    const totalEnrolled = course.enrolledStudents.length;
    const completedCount = await User.countDocuments({
      'coursesCompleted.courseId': course._id
    });

    // Get progress distribution
    const enrolledUsers = await User.find({
      'coursesEnrolled.courseId': course._id
    }, 'coursesEnrolled');

    const progressDistribution = {
      '0-25': 0,
      '26-50': 0,
      '51-75': 0,
      '76-99': 0,
      '100': completedCount
    };

    enrolledUsers.forEach(user => {
      const enrollment = user.coursesEnrolled.find(
        e => e.courseId.toString() === course._id.toString()
      );
      if (enrollment) {
        const progress = enrollment.progress;
        if (progress <= 25) progressDistribution['0-25']++;
        else if (progress <= 50) progressDistribution['26-50']++;
        else if (progress <= 75) progressDistribution['51-75']++;
        else if (progress < 100) progressDistribution['76-99']++;
      }
    });

    res.json({
      totalEnrolled,
      completedCount,
      completionRate: totalEnrolled > 0 ? (completedCount / totalEnrolled * 100).toFixed(1) : 0,
      progressDistribution,
      averageRating: course.rating.average,
      totalReviews: course.rating.count,
      revenue: course.pointsRequired * totalEnrolled
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed course progress
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user._id;

    const progress = await UserProgress.findOne({ 
      user: userId, 
      course: courseId 
    }).populate('course', 'title chapters');

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found. Please enroll in the course first.' });
    }

    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update chapter completion
router.post('/:id/chapters/:chapterId/complete', auth, async (req, res) => {
  try {
    const { id: courseId, chapterId } = req.params;
    const { timeSpent = 0 } = req.body;
    const userId = req.user._id;

    const progress = await UserProgress.findOne({ 
      user: userId, 
      course: courseId 
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    // Check if chapter already completed
    const existingChapter = progress.chaptersCompleted.find(
      ch => ch.chapterId === chapterId
    );

    if (!existingChapter) {
      progress.chaptersCompleted.push({
        chapterId,
        completedAt: new Date(),
        timeSpent
      });
    }

    // Update total time spent
    progress.totalTimeSpent += timeSpent;
    progress.lastAccessedAt = new Date();

    // Calculate total progress
    const course = await Course.findById(courseId);
    const totalChapters = course.chapters.length;
    const completedChapters = progress.chaptersCompleted.length;
    progress.totalProgress = Math.round((completedChapters / totalChapters) * 100);

    // Check if course is completed
    if (progress.totalProgress === 100 && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();

      // Update user's course lists
      const user = await User.findById(userId);
      const enrollmentIndex = user.coursesEnrolled.findIndex(
        enrollment => enrollment.courseId.toString() === courseId
      );

      if (enrollmentIndex !== -1) {
        // Move from enrolled to completed
        const completedCourse = {
          courseId: user.coursesEnrolled[enrollmentIndex].courseId,
          completedAt: new Date(),
          progress: 100
        };

        user.coursesCompleted.push(completedCourse);
        user.coursesEnrolled.splice(enrollmentIndex, 1);

        // Award completion points
        const bonusPoints = course.level === 'Advanced' ? 200 : 
                           course.level === 'Intermediate' ? 150 : 100;
        user.points += bonusPoints;

        await user.save();

        // Create completion notification
        await Notification.create({
          recipient: userId,
          type: 'course_completion',
          title: 'Course Completed!',
          message: `Congratulations! You've completed "${course.title}" and earned ${bonusPoints} bonus points!`,
          data: { courseId, courseName: course.title, bonusPoints }
        });
      }
    }

    await progress.save();

    res.json({
      message: 'Chapter completed successfully',
      progress: progress.totalProgress,
      isCompleted: progress.isCompleted,
      totalTimeSpent: progress.totalTimeSpent
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get enrollment status for a course
router.get('/:id/enrollment', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: req.params.id
    });

    if (!enrollment) {
      return res.json({ enrolled: false });
    }

    let certificate = enrollment.completed 
      ? await Certificate.findOne({ userId: req.user._id, courseId: req.params.id }) 
      : null;

    // Self-healing: If completed but no certificate found, create one
    if (enrollment.completed && !certificate) {
      try {
        console.log('Self-healing: Generating missing certificate for completed course');
        const course = await Course.findById(req.params.id);
        const user = await User.findById(req.user._id);
        
        if (course && user) {
          certificate = new Certificate({
            userId: user._id,
            courseId: course._id,
            userName: user.name || 'Student',
            courseName: course.title || 'Course',
            instructorName: course.instructorName || 'Instructor',
            completionDate: enrollment.completedAt || new Date(),
            instructorSignatureUrl: course.instructorSignatureUrl || ''
          });
          await certificate.save();
          console.log('Self-healing: Certificate generated successfully:', certificate.certificateId);
        }
      } catch (certError) {
        console.error('Self-healing failed to generate certificate:', certError.message);
        console.error('Full error:', certError);
        // We don't throw here - just proceed without the certificateId so the page still loads
      }
    }

    // Get quiz status
    const course = await Course.findById(req.params.id);
    const quizAttempts = await QuizAttempt.find({
      userId: req.user._id,
      courseId: req.params.id
    }).sort({ createdAt: -1 });

    const bestAttempt = quizAttempts.length > 0 
      ? quizAttempts.reduce((best, current) => current.score > best.score ? current : best)
      : null;

    const quizStatus = {
      available: course.quizQuestions && course.quizQuestions.length > 0,
      unlocked: enrollment.progress >= 100 || enrollment.videoCompleted,
      passed: bestAttempt ? bestAttempt.passed : false,
      bestScore: bestAttempt ? bestAttempt.score : null,
      attempts: quizAttempts.length
    };

    res.json({
      enrolled: true,
      progress: enrollment.progress,
      lastWatchedTime: enrollment.lastWatchedTime,
      videoCompleted: enrollment.videoCompleted || false,
      completed: enrollment.completed,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      certificateId: certificate ? certificate.certificateId : null,
      quizStatus
    });
  } catch (error) {
    console.error('Error in enrollment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate and download certificate
router.get('/certificates/:courseId', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      userId: req.user._id,
      courseId: req.params.courseId
    });

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found. Complete the course first.' });
    }

    // Create PDF certificate
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateId}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Certificate design
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const centerX = pageWidth / 2;

    // Background
    doc.rect(0, 0, pageWidth, pageHeight).fill('#f8f9fa');
    
    // Border
    doc.rect(40, 40, pageWidth - 80, pageHeight - 80)
       .stroke('#4F46E5', 3);

    // Header
    doc.fillColor('#4F46E5')
       .fontSize(48)
       .font('Helvetica-Bold')
       .text('CERTIFICATE OF COMPLETION', 60, 120, { align: 'center' });

    // EduX Logo text
    doc.fillColor('#6366F1')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('EduX Learning Platform', 60, 80, { align: 'center' });

    // Certificate content
    doc.fillColor('#374151')
       .fontSize(18)
       .font('Helvetica')
       .text('This certificate is awarded to', 60, 220, { align: 'center' });

    // User name
    doc.fillColor('#1F2937')
       .fontSize(36)
       .font('Helvetica-Bold')
       .text(certificate.userName, 60, 260, { align: 'center' });

    // Course completion text
    doc.fillColor('#374151')
       .fontSize(18)
       .font('Helvetica')
       .text('for successfully completing the course', 60, 320, { align: 'center' });

    // Course name
    doc.fillColor('#4F46E5')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text(certificate.courseName, 60, 360, { align: 'center' });

    // Instructor
    doc.fillColor('#374151')
       .fontSize(16)
       .font('Helvetica')
       .text(`Instructor: ${certificate.instructorName}`, 60, 420, { align: 'center' });

    // Date and Certificate ID
    const completionDate = certificate.completionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.fillColor('#6B7280')
       .fontSize(14)
       .font('Helvetica')
       .text(`Completion Date: ${completionDate}`, 100, 480)
       .text(`Certificate ID: ${certificate.certificateId}`, 100, 500);

    // Signature line
    doc.moveTo(centerX + 100, 520)
       .lineTo(centerX + 300, 520)
       .stroke('#9CA3AF');
    
    doc.fillColor('#6B7280')
       .fontSize(12)
       .text('EduX Academy Director', centerX + 120, 530);

    // Footer
    doc.fillColor('#9CA3AF')
       .fontSize(10)
       .text('This certificate verifies successful completion of the online course on EduX Learning Platform', 
             60, pageHeight - 80, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
