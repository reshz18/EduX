const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { requireOnboardingComplete } = require('../middleware/onboarding');

const router = express.Router();

// Get all posts with advanced filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      author,
      tag
    } = req.query;
    
    const query = {};

    // Apply filters
    if (category && category !== 'All') query.category = category;
    if (author) query.author = author;
    if (tag) query.tags = { $in: [tag] };
    
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort options
    const sortOptions = {};
    if (sortBy === 'popularity') {
      sortOptions.likes = -1;
    } else if (sortBy === 'comments') {
      sortOptions['comments.length'] = -1;
    } else {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const posts = await Post.find(query)
      .populate('author', 'name avatar role')
      .populate('comments.author', 'name avatar role')
      .populate('likes', 'name avatar')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    // Get categories and tags for filtering
    const categories = await Post.distinct('category');
    const tags = await Post.distinct('tags');

    // Add user interaction status if authenticated
    let postsWithUserStatus = posts;
    if (req.user) {
      postsWithUserStatus = posts.map(post => {
        const postObj = post.toObject();
        postObj.isLiked = post.likes.some(like => like._id.toString() === req.user._id.toString());
        postObj.isAuthor = post.author._id.toString() === req.user._id.toString();
        return postObj;
      });
    }

    res.json({
      posts: postsWithUserStatus,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      filters: {
        categories,
        tags: tags.flat().filter((tag, index, arr) => arr.indexOf(tag) === index)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post with detailed information
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar role bio')
      .populate('comments.author', 'name avatar role')
      .populate('likes', 'name avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add user interaction status if authenticated
    let postWithUserStatus = post.toObject();
    if (req.user) {
      postWithUserStatus.isLiked = post.likes.some(like => like._id.toString() === req.user._id.toString());
      postWithUserStatus.isAuthor = post.author._id.toString() === req.user._id.toString();
    }

    res.json(postWithUserStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create post
router.post('/', auth, requireOnboardingComplete, [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content must be between 1 and 2000 characters'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be boolean'),
  body('image').optional().isURL().withMessage('Image must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const postData = {
      ...req.body,
      author: req.user._id,
      category: req.body.category || 'General',
      tags: req.body.tags || []
    };

    const post = new Post(postData);
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name avatar role');

    // Award points for creating post
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10 } });

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post
router.put('/:id', auth, [
  body('content').optional().trim().isLength({ min: 1, max: 2000 }),
  body('category').optional().isString(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('author', 'name avatar role');

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);
    let action = '';

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
      action = 'unliked';
    } else {
      // Like
      post.likes.push(req.user._id);
      action = 'liked';
      
      // Award points to post author (but not self-likes)
      if (post.author.toString() !== req.user._id.toString()) {
        await User.findByIdAndUpdate(post.author, { $inc: { points: 2 } });
      }
    }

    await post.save();

    res.json({
      action,
      likes: post.likes.length,
      isLiked: action === 'liked'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to post
router.post('/:id/comment', auth, [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      author: req.user._id,
      content,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name avatar role')
      .populate('comments.author', 'name avatar role');

    // Award points for commenting
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 5 } });
    
    // Award points to post author for engagement
    if (post.author.toString() !== req.user._id.toString()) {
      await User.findByIdAndUpdate(post.author, { $inc: { points: 3 } });
    }

    res.json({
      message: 'Comment added successfully',
      post: populatedPost,
      newComment: populatedPost.comments[populatedPost.comments.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike comment
router.post('/:postId/comment/:commentId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const likeIndex = comment.likes.indexOf(req.user._id);
    let action = '';

    if (likeIndex > -1) {
      // Unlike
      comment.likes.splice(likeIndex, 1);
      action = 'unliked';
    } else {
      // Like
      comment.likes.push(req.user._id);
      action = 'liked';
      
      // Award points to comment author
      if (comment.author.toString() !== req.user._id.toString()) {
        await User.findByIdAndUpdate(comment.author, { $inc: { points: 1 } });
      }
    }

    await post.save();

    res.json({
      action,
      likes: comment.likes.length,
      isLiked: action === 'liked'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment
router.delete('/:postId/comment/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is comment author or post author
    if (comment.author.toString() !== req.user._id.toString() && 
        post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.remove();
    await post.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trending posts
router.get('/trending/posts', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get posts from last 7 days, sorted by engagement score
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const posts = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: weekAgo }
        }
      },
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $multiply: [{ $size: "$likes" }, 2] },
              { $multiply: [{ $size: "$comments" }, 3] }
            ]
          }
        }
      },
      {
        $sort: { engagementScore: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    const populatedPosts = await Post.populate(posts, [
      { path: 'author', select: 'name avatar role' },
      { path: 'comments.author', select: 'name avatar role' }
    ]);

    res.json(populatedPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'name avatar role')
      .populate('comments.author', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ author: req.params.userId });

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report post
router.post('/:id/report', auth, [
  body('reason').isString().withMessage('Reason is required'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // In a real app, you'd save this to a reports collection
    // For now, we'll just acknowledge the report
    res.json({ 
      message: 'Post reported successfully. Our team will review it.',
      reportId: `RPT-${Date.now()}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;