const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const { limit = 50, period = 'all' } = req.query;

    let dateFilter = {};
    
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { updatedAt: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { updatedAt: { $gte: monthAgo } };
    }

    const users = await User.find({ 
      ...dateFilter,
      points: { $gt: 0 },
      isActive: true 
    })
      .select('name avatar points coursesCompleted badges')
      .sort({ points: -1 })
      .limit(parseInt(limit));

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      points: user.points,
      coursesCompleted: user.coursesCompleted.length,
      badges: user.badges.length
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's rank
router.get('/rank', auth, async (req, res) => {
  try {
    const userPoints = req.user.points;
    
    const higherRankedUsers = await User.countDocuments({
      points: { $gt: userPoints },
      isActive: true
    });

    const rank = higherRankedUsers + 1;

    const totalUsers = await User.countDocuments({
      points: { $gt: 0 },
      isActive: true
    });

    res.json({
      rank,
      totalUsers,
      points: userPoints,
      percentile: Math.round(((totalUsers - rank) / totalUsers) * 100)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $match: { isActive: true, points: { $gt: 0 } }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          averagePoints: { $avg: '$points' },
          maxPoints: { $max: '$points' },
          totalPoints: { $sum: '$points' }
        }
      }
    ]);

    const topPerformers = await User.find({ isActive: true })
      .select('name points coursesCompleted')
      .sort({ points: -1 })
      .limit(3);

    res.json({
      stats: stats[0] || {
        totalUsers: 0,
        averagePoints: 0,
        maxPoints: 0,
        totalPoints: 0
      },
      topPerformers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;