// Authentication service — login verification and staff account creation.
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

// Signs a JWT containing the user's id and role.
const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

// Verifies email/password and returns the user + signed token.
const login = async ({ email, password }) => {
  const user = await AdminUser.findOne({ email });

  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  if (!user.verifyPassword(password)) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user);
  return { user, token };
};

// Creates a new admin or teacher account; rejects duplicate emails.
const createStaff = async ({ firstName, lastName, email, password, role }) => {
  const existing = await AdminUser.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = AdminUser.hashPassword(password);

  const user = await AdminUser.create({
    firstName,
    lastName,
    email,
    passwordHash,
    role,
  });

  return user;
};

module.exports = { login, createStaff, generateToken };
