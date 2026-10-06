const mongoose = require('mongoose');
const User = require('../models/User');
const { ROLES } = require('../constants');
require('dotenv').config();

const seedSuperAdmin = async () => {
  try {
    const { SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } = process.env;

    if (!SUPER_ADMIN_NAME || !SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
      console.error('Super Admin environment variables are missing');
      return;
    }

    const existingAdmin = await User.findOne({ role: ROLES.SUPER_ADMIN });
    if (existingAdmin) {
      console.log('Super Admin already exists.');
      return;
    }

    await User.create({
      name: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      role: ROLES.SUPER_ADMIN,
      tenantId: null
    });

    console.log('Super Admin successfully seeded.');
  } catch (error) {
    console.error('Error seeding Super Admin:', error.message);
  }
};

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await seedSuperAdmin();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

if (require.main === module) {
  runSeed();
}

module.exports = seedSuperAdmin;
