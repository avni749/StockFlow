const User = require('../models/User');
const { ROLES } = require('../constants');

const mapUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  tenantId: u.tenantId,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt
});

const getStaffList = async (req, res, next) => {
  try {
    const staff = await User.find({ tenantId: req.user.tenantId, role: ROLES.STAFF });
    res.json({ staff: staff.map(mapUser) });
  } catch (error) {
    next(error);
  }
};

const createStaff = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('Email already registered');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: ROLES.STAFF,
      tenantId: req.user.tenantId,
    });

    res.status(201).json({ staff: mapUser(user) });
  } catch (error) {
    next(error);
  }
};

const getStaff = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, tenantId: req.user.tenantId, role: ROLES.STAFF });
    if (!user) {
      res.status(404);
      throw new Error('Staff not found');
    }
    res.json({ staff: mapUser(user) });
  } catch (error) {
    next(error);
  }
};

const updateStaff = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findOne({ _id: req.params.userId, tenantId: req.user.tenantId, role: ROLES.STAFF });
    
    if (!user) {
      res.status(404);
      throw new Error('Staff not found');
    }

    if (name) user.name = name;
    if (email) {
      if (email !== user.email) {
        const emailTaken = await User.findOne({ email });
        if (emailTaken) {
          res.status(400);
          throw new Error('Email already taken');
        }
      }
      user.email = email;
    }

    await user.save();
    res.json({ staff: mapUser(user) });
  } catch (error) {
    next(error);
  }
};

const suspendStaff = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, tenantId: req.user.tenantId, role: ROLES.STAFF });
    if (!user) {
      res.status(404);
      throw new Error('Staff not found');
    }
    user.status = 'SUSPENDED';
    await user.save();
    res.json({ staff: mapUser(user) });
  } catch (error) {
    next(error);
  }
};

const reactivateStaff = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, tenantId: req.user.tenantId, role: ROLES.STAFF });
    if (!user) {
      res.status(404);
      throw new Error('Staff not found');
    }
    user.status = 'ACTIVE';
    await user.save();
    res.json({ staff: mapUser(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStaffList,
  createStaff,
  getStaff,
  updateStaff,
  suspendStaff,
  reactivateStaff
};
