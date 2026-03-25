const User = require('../models/User');

const requireOnboardingComplete = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isOnboarded) {
      return res.status(403).json({ 
        message: 'Onboarding required',
        requiresOnboarding: true 
      });
    }

    next();
  } catch (error) {
    console.error('Onboarding middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { requireOnboardingComplete };