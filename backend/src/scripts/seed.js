/**
 * Seed script — creates the initial super admin account.
 * Run once: node src/scripts/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await AdminUser.findOne({ email: 'admin@school.rw' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const passwordHash = AdminUser.hashPassword('Admin@1234');
  const admin = await AdminUser.create({
    firstName:    'Super',
    lastName:     'Admin',
    email:        'admin@school.rw',
    passwordHash,
    role:         'admin',
    isActive:     true,
  });

  console.log('Admin created:', admin.email);
  console.log('Password: Admin@1234');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
