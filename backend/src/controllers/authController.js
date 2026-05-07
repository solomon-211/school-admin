// Handles authentication HTTP requests: login, staff creation, and current user profile.
const { login, createStaff } = require('../services/authService');
const { toAdminUser } = require('../dtos/adminDto');

// POST /api/auth/login — verifies credentials and returns a JWT token.
const loginAdmin = async (req, res, next) => {
  try {
    const { user, token } = await login(req.body);
    res.json({ success: true, data: { user: toAdminUser(user), token } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/staff — creates a new admin or teacher account (admin only).
const createStaffMember = async (req, res, next) => {
  try {
    const user = await createStaff(req.body);
    res.status(201).json({ success: true, data: toAdminUser(user) });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me — returns the profile of the currently authenticated user.
const getMe = (req, res) => {
  res.json({ success: true, data: toAdminUser(req.user) });
};

module.exports = { loginAdmin, createStaffMember, getMe };
