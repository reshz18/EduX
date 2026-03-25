const express = require('express');
const UserSettings = require('../models/UserSettings');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get user settings
router.get('/', auth, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user._id });
    
    // Create default settings if none exist
    if (!settings) {
      settings = new UserSettings({ user: req.user._id });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notification settings
router.put('/notifications', auth, [
  body('email').optional().isObject(),
  body('push').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, push } = req.body;
    
    let settings = await UserSettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = new UserSettings({ user: req.user._id });
    }

    if (email) {
      settings.notifications.email = { ...settings.notifications.email, ...email };
    }
    
    if (push) {
      settings.notifications.push = { ...settings.notifications.push, ...push };
    }

    await settings.save();
    res.json({ message: 'Notification settings updated', settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update privacy settings
router.put('/privacy', auth, [
  body('profileVisibility').optional().isIn(['public', 'private', 'friends']),
  body('showProgress').optional().isBoolean(),
  body('showBadges').optional().isBoolean(),
  body('allowMessages').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { profileVisibility, showProgress, showBadges, allowMessages } = req.body;
    
    let settings = await UserSettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = new UserSettings({ user: req.user._id });
    }

    if (profileVisibility !== undefined) settings.privacy.profileVisibility = profileVisibility;
    if (showProgress !== undefined) settings.privacy.showProgress = showProgress;
    if (showBadges !== undefined) settings.privacy.showBadges = showBadges;
    if (allowMessages !== undefined) settings.privacy.allowMessages = allowMessages;

    await settings.save();
    res.json({ message: 'Privacy settings updated', settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update preferences
router.put('/preferences', auth, [
  body('theme').optional().isIn(['light', 'dark', 'auto']),
  body('language').optional().isString(),
  body('timezone').optional().isString(),
  body('autoplay').optional().isBoolean(),
  body('playbackSpeed').optional().isFloat({ min: 0.5, max: 2.0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { theme, language, timezone, autoplay, playbackSpeed } = req.body;
    
    let settings = await UserSettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = new UserSettings({ user: req.user._id });
    }

    if (theme !== undefined) settings.preferences.theme = theme;
    if (language !== undefined) settings.preferences.language = language;
    if (timezone !== undefined) settings.preferences.timezone = timezone;
    if (autoplay !== undefined) settings.preferences.autoplay = autoplay;
    if (playbackSpeed !== undefined) settings.preferences.playbackSpeed = playbackSpeed;

    await settings.save();
    res.json({ message: 'Preferences updated', settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset settings to default
router.post('/reset', auth, async (req, res) => {
  try {
    await UserSettings.findOneAndDelete({ user: req.user._id });
    
    const defaultSettings = new UserSettings({ user: req.user._id });
    await defaultSettings.save();

    res.json({ message: 'Settings reset to default', settings: defaultSettings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;