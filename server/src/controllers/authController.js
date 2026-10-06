const jwt = require('jsonwebtoken');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { ROLES } = require('../constants');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

const registerBusiness = async (req, res, next) => {
  try {
    const { businessName, slug, name, email, password } = req.body;

    if (!businessName || !slug || !name || !email || !password) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    const tenantExists = await Tenant.findOne({ slug });
    if (tenantExists) {
      res.status(400);
      throw new Error('Tenant slug already exists');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('Email already registered');
    }

    // Create business tenant
    const tenant = await Tenant.create({
      name: businessName,
      slug,
    });

    // Create initial business admin
    const user = await User.create({
      name,
      email,
      password,
      role: ROLES.BUSINESS_ADMIN,
      tenantId: tenant._id,
    });

    res.status(201).json({
      message: 'Business registered successfully',
      tenantId: tenant._id,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerBusiness, login };
