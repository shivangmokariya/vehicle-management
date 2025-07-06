const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Account is not active.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (req.user.role !== 'Super Admin') {
      return res.status(403).json({ message: 'Super Admin access required.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const requireAdminOrSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!['Super Admin', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Admin or Super Admin access required.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  auth,
  requireSuperAdmin,
  requireAdminOrSuperAdmin
}; 