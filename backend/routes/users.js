const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Save avatar selection
router.post('/avatar', auth, [
  body('avatar').isString().withMessage('Avatar is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Avatar updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isOnboarded: user.isOnboarded
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete profile onboarding
router.post('/complete-profile', auth, [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('bio').optional().isLength({ max: 150 }).withMessage('Bio must be less than 150 characters'),
  body('interests').optional().isArray().withMessage('Interests must be an array'),
  body('educationLevel').optional().isIn(['High School', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Professional', 'Other'])
    .withMessage('Invalid education level'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('institution').optional().isString(),
  body('teachingExperience').optional().isString(),
  body('subjectsTaught').optional().isArray(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, bio, interests, educationLevel, skills, socialLinks, location, institution, teachingExperience, subjectsTaught } = req.body;

    const updateData = {
      name: fullName,
      bio,
      interests: interests || [],
      educationLevel: educationLevel || 'Other',
      skills: skills || [],
      socialLinks: socialLinks || {},
      location,
      institution,
      teachingExperience,
      subjectsTaught: subjectsTaught || [],
      isOnboarded: true
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile completed successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        username: user.username,
        bio: user.bio,
        interests: user.interests,
        educationLevel: user.educationLevel,
        skills: user.skills,
        socialLinks: user.socialLinks,
        location: user.location,
        points: user.points,
        isOnboarded: user.isOnboarded
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check username availability
router.get('/check-username/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    const existingUser = await User.findOne({ 
      username: username.toLowerCase(),
      _id: { $ne: req.user._id }
    });

    res.json({ 
      available: !existingUser,
      message: existingUser ? 'Username is already taken' : 'Username is available'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone(),
  body('bio').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, bio, avatar } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (bio) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add points to user
router.post('/points', auth, [
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { points, reason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { points: points } },
      { new: true }
    ).select('-password');

    res.json({
      message: `${points} points added successfully`,
      newPoints: user.points,
      reason
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add badge to user
router.post('/badges', auth, [
  body('name').isString().withMessage('Badge name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    const user = await User.findById(req.user._id);
    
    // Check if badge already exists
    const existingBadge = user.badges.find(badge => badge.name === name);
    if (existingBadge) {
      return res.status(400).json({ message: 'Badge already earned' });
    }

    user.badges.push({ name });
    await user.save();

    res.json({
      message: 'Badge earned successfully',
      badge: { name, earnedAt: new Date() }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('coursesCompleted.courseId', 'title category')
      .populate('coursesEnrolled.courseId', 'title category');

    const stats = {
      totalPoints: user.points,
      coursesCompleted: user.coursesCompleted.length,
      coursesEnrolled: user.coursesEnrolled.length,
      badgesEarned: user.badges.length,
      completionRate: user.coursesEnrolled.length > 0 
        ? Math.round((user.coursesCompleted.length / user.coursesEnrolled.length) * 100)
        : 0
    };

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;