const ActivityLog = require('../models/ActivityLog');

/**
 * Logs a user activity to the database
 * @param {string} userId - ID of the user performing the action
 * @param {string} actionType - Type of action (from enum in ActivityLog model)
 * @param {object} metadata - Optional metadata related to the action
 */
const logActivity = async (userId, actionType, metadata = {}) => {
  try {
    const log = new ActivityLog({
      userId,
      actionType,
      metadata
    });
    await log.save();
    return log;
  } catch (error) {
    // Log error but don't crash the main request if logging fails
    console.error('Failed to log activity:', error);
    return null;
  }
};

module.exports = { logActivity };
