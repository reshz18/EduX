const express = require('express');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const SpinHistory = require('../models/SpinHistory');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

const REWARDS = [
  { type: 'points', points: 10,  probability: 0.30, label: '10 Points',  color: '#22C55E' },
  { type: 'points', points: 20,  probability: 0.25, label: '20 Points',  color: '#3B82F6' },
  { type: 'points', points: 30,  probability: 0.20, label: '30 Points',  color: '#8B5CF6' },
  { type: 'points', points: 50,  probability: 0.15, label: '50 Points',  color: '#F59E0B' },
  { type: 'points', points: 100, probability: 0.07, label: '100 Points', color: '#EF4444' },
  { type: 'bonus_xp',      points: 25, probability: 0.02, label: 'Bonus XP',  color: '#06B6D4' },
  { type: 'mystery_reward', points: 0, probability: 0.01, label: 'Mystery!',  color: '#EC4899' }
];

const MYSTERY_REWARDS = [
  { points: 200, label: '200 Bonus Points!' },
  { points: 150, label: '150 Surprise Points!' },
  { points: 75,  label: 'Mystery Badge + 75 Points!' },
  { points: 300, label: 'MEGA BONUS - 300 Points!' }
];

const isSameDay = (d1, d2) => d1.toDateString() === d2.toDateString();

// POST /spin
router.post('/spin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const today = new Date();

    if (user.lastSpinAt && isSameDay(user.lastSpinAt, today)) {
      return res.status(400).json({
        message: 'You have already spun today. Come back tomorrow!',
        canSpin: false
      });
    }

    // Weighted random selection — store the index too
    const random = Math.random();
    let cumulative = 0;
    let selectedIndex = 0;
    let selectedReward = REWARDS[0];

    for (let i = 0; i < REWARDS.length; i++) {
      cumulative += REWARDS[i].probability;
      if (random <= cumulative) {
        selectedIndex = i;
        selectedReward = REWARDS[i];
        break;
      }
    }

    // Resolve mystery reward
    let pointsAwarded = selectedReward.points;
    let actualLabel = selectedReward.label;
    let isMystery = false;

    if (selectedReward.type === 'mystery_reward') {
      isMystery = true;
      const mystery = MYSTERY_REWARDS[Math.floor(Math.random() * MYSTERY_REWARDS.length)];
      pointsAwarded = mystery.points;
      actualLabel = mystery.label;
    }

    // Award points
    user.points += pointsAwarded;
    user.lastSpinAt = today;
    user.totalSpins = (user.totalSpins || 0) + 1;

    await new SpinHistory({
      userId: user._id,
      rewardType: selectedReward.type,
      pointsAwarded,
      rewardLabel: actualLabel,
      spinDate: today,
      streakDay: 0
    }).save();

    await user.save();

    // Spin-count badges (no streak badges)
    const achievements = [
      { spins: 1,   badge: 'First Spin',   message: 'Welcome to Spin & Win!' },
      { spins: 7,   badge: 'Lucky Seven',  message: 'Seven spins completed!' },
      { spins: 30,  badge: 'Spin Master',  message: 'Thirty spins completed!' },
      { spins: 100, badge: 'Spin Legend',  message: 'One hundred spins completed!' }
    ];

    const newBadges = [];
    for (const a of achievements) {
      if (user.totalSpins === a.spins && !user.badges.some(b => b.name === a.badge)) {
        user.badges.push({ name: a.badge });
        newBadges.push(a.badge);
        await Notification.create({
          recipient: user._id,
          type: 'badge_earned',
          title: 'New Badge Earned!',
          message: `You earned the "${a.badge}" badge! ${a.message}`,
          data: { badgeName: a.badge }
        });
      }
    }
    if (newBadges.length > 0) await user.save();

    res.json({
      success: true,
      // segmentIndex tells the frontend exactly which wheel segment to land on
      segmentIndex: selectedIndex,
      reward: {
        type: selectedReward.type,
        points: pointsAwarded,
        label: selectedReward.label,
        color: selectedReward.color,
        isMystery,
        actualLabel
      },
      totalPointsAwarded: pointsAwarded,
      newBalance: user.points,
      totalSpins: user.totalSpins,
      newBadges,
      canSpin: false
    });
  } catch (err) {
    console.error('Spin error:', err);
    res.status(500).json({ message: 'Server error during spin' });
  }
});

// GET /can-spin
router.get('/can-spin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const today = new Date();
    const canSpin = !user.lastSpinAt || !isSameDay(user.lastSpinAt, today);

    let remainingTime = null;
    if (!canSpin) {
      const nextMidnight = new Date(today);
      nextMidnight.setDate(nextMidnight.getDate() + 1);
      nextMidnight.setHours(0, 0, 0, 0);
      const diff = nextMidnight.getTime() - today.getTime();
      remainingTime = {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      };
    }

    res.json({ canSpin, remainingTime, totalSpins: user.totalSpins || 0 });
  } catch (err) {
    console.error('Can spin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /rewards-config
router.get('/rewards-config', (_req, res) => {
  res.json({ rewards: REWARDS });
});

// GET /spin-history
router.get('/spin-history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const history = await SpinHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    const total = await SpinHistory.countDocuments({ userId: req.user._id });

    const stats = await SpinHistory.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, totalPointsEarned: { $sum: '$pointsAwarded' }, averagePoints: { $avg: '$pointsAwarded' } } }
    ]);

    res.json({
      history,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      stats: stats[0] || { totalPointsEarned: 0, averagePoints: 0 }
    });
  } catch (err) {
    console.error('Spin history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /challenges
router.get('/challenges', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const today = new Date();
    const challenges = await Challenge.find({
      isActive: true,
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: today } }]
    });
    const result = challenges.map(c => {
      const up = c.completedBy.find(x => x.user.toString() === user._id.toString());
      return {
        id: c._id, title: c.title, description: c.description,
        reward: c.reward, type: c.type, requirements: c.requirements,
        completed: up ? up.progress >= c.requirements.target : false,
        progress: up ? up.progress : 0, target: c.requirements.target
      };
    });
    res.json({ daily: result.filter(c => c.type === 'daily'), weekly: result.filter(c => c.type === 'weekly'), monthly: result.filter(c => c.type === 'monthly'), total: result.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /challenges/:id/complete
router.post('/challenges/:challengeId/complete', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    const user = await User.findById(req.user._id);
    const existing = challenge.completedBy.find(c => c.user.toString() === user._id.toString());
    if (existing && existing.progress >= challenge.requirements.target)
      return res.status(400).json({ message: 'Challenge already completed' });
    if (existing) {
      existing.progress += 1;
      if (existing.progress >= challenge.requirements.target) existing.completedAt = new Date();
    } else {
      challenge.completedBy.push({ user: user._id, progress: 1, completedAt: challenge.requirements.target === 1 ? new Date() : undefined });
    }
    await challenge.save();
    const completion = challenge.completedBy.find(c => c.user.toString() === user._id.toString());
    if (completion.progress >= challenge.requirements.target) {
      if (challenge.reward.points) user.points += challenge.reward.points;
      if (challenge.reward.badge && !user.badges.some(b => b.name === challenge.reward.badge))
        user.badges.push({ name: challenge.reward.badge });
      await user.save();
      await Notification.create({ recipient: user._id, type: 'challenge_completed', title: 'Challenge Completed!', message: `You completed "${challenge.title}" and earned ${challenge.reward.points} points!`, data: { challengeId: challenge._id, reward: challenge.reward } });
      res.json({ message: 'Challenge completed!', reward: challenge.reward, newPoints: user.points });
    } else {
      res.json({ message: 'Progress updated', progress: completion.progress, target: challenge.requirements.target });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
