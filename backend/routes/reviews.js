const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @route   GET /api/reviews/:courseId
// @desc    Get all reviews for a course
// @access  Public
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    
    // Convert courseId to ObjectId for consistent querying
    const courseObjectId = new mongoose.Types.ObjectId(courseId);
    
    let sortOption = { createdAt: -1 }; // Default: most recent
    if (sort === 'helpful') {
      sortOption = { 'helpful.length': -1, createdAt: -1 };
    } else if (sort === 'rating-high') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === 'rating-low') {
      sortOption = { rating: 1, createdAt: -1 };
    }
    
    const reviews = await Review.find({ courseId: courseObjectId })
      .populate('userId', 'name avatar')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments({ courseId: courseObjectId });
    
    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { courseId: courseObjectId } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingDistribution.forEach(item => {
      distribution[item._id] = item.count;
    });
    
    // Calculate average rating
    const avgRating = await Review.aggregate([
      { $match: { courseId: courseObjectId } },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);
    
    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      averageRating: avgRating.length > 0 ? avgRating[0].average : 0,
      ratingDistribution: distribution
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews/:courseId
// @desc    Add or update a review for a course
// @access  Private
router.post('/:courseId', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    
    // Convert to ObjectId for consistency
    const courseObjectId = new mongoose.Types.ObjectId(courseId);
    
    // Check if user has completed the course
    const enrollment = await Enrollment.findOne({ userId, courseId: courseObjectId });
    if (!enrollment || !enrollment.completed) {
      return res.status(403).json({ 
        message: 'You must complete the course before leaving a review' 
      });
    }
    
    // Check if review already exists
    let review = await Review.findOne({ userId, courseId: courseObjectId });
    
    let isNewReview = false;
    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment;
      review.updatedAt = new Date();
      await review.save();
    } else {
      // Create new review
      isNewReview = true;
      review = new Review({
        userId,
        courseId: courseObjectId,
        rating,
        comment
      });
      await review.save();
    }
    
    // Update course rating
    const allReviews = await Review.find({ courseId: courseObjectId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await Course.findByIdAndUpdate(courseObjectId, {
      'rating.average': avgRating,
      'rating.count': allReviews.length
    });
    
    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'name avatar');
    
    res.json({
      message: isNewReview ? 'Review added successfully' : 'Review updated successfully',
      review: populatedReview
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns the review
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    
    const courseId = review.courseId;
    await Review.findByIdAndDelete(reviewId);
    
    // Update course rating
    const allReviews = await Review.find({ courseId });
    const avgRating = allReviews.length > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
      : 0;
    
    await Course.findByIdAndUpdate(courseId, {
      'rating.average': avgRating,
      'rating.count': allReviews.length
    });
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews/:reviewId/helpful
// @desc    Mark a review as helpful
// @access  Private
router.post('/:reviewId/helpful', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const helpfulIndex = review.helpful.indexOf(userId);
    if (helpfulIndex > -1) {
      // Remove from helpful
      review.helpful.splice(helpfulIndex, 1);
    } else {
      // Add to helpful
      review.helpful.push(userId);
    }
    
    await review.save();
    
    res.json({
      message: helpfulIndex > -1 ? 'Removed from helpful' : 'Marked as helpful',
      helpfulCount: review.helpful.length
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
