const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Invalidate if password changed after token issue
    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(401).json({ message: 'User not found' });
    }

    if (user.lastPasswordResetAt) {
        const lastReset = parseInt(user.lastPasswordResetAt.getTime() / 1000, 10);
        if (decoded.iat < lastReset) {
            return res.status(401).json({ message: 'Password recently reset. Please login again.' });
        }
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

module.exports = { auth, authorize };
