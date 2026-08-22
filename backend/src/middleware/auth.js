const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Strict authentication middleware: Requires a valid JWT bearer token.
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token required.',
        },
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'carwise-dev-secret-key-change-in-prod');

    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User account not found or deactivated.',
        },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication token.',
      },
    });
  }
};

/**
 * Optional authentication middleware: Attaches user if token is valid, continues as guest otherwise.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'carwise-dev-secret-key-change-in-prod');
      const user = await User.findById(decoded.id);
      if (user && !user.isDeleted) {
        req.user = user;
      }
    }
  } catch (err) {
    // Ignore invalid token in optional auth and treat as guest
    req.user = null;
  }
  next();
};

module.exports = {
  auth,
  optionalAuth,
};
