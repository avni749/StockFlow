const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { ROLES } = require('../constants');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Account is suspended' });
    }

    if (user.role !== ROLES.SUPER_ADMIN) {
      if (!user.tenantId) {
        return res.status(403).json({ message: 'User does not belong to a tenant' });
      }
      const tenant = await Tenant.findById(user.tenantId);
      if (!tenant) {
        return res.status(403).json({ message: 'Tenant not found' });
      }
      if (tenant.status === 'SUSPENDED') {
        return res.status(403).json({ message: 'Business is suspended' });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
