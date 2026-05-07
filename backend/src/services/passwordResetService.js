// Password reset service — generates reset tokens and applies new passwords.
const crypto = require('crypto');
const AdminUser = require('../models/AdminUser');
const PasswordReset = require('../models/PasswordReset');
const { notify } = require('./emailService');

// Creates a 1-hour reset token and emails the link. Silent if email not found (prevents enumeration).
const requestReset = async (email) => {
  const user = await AdminUser.findOne({ email: email.toLowerCase().trim() });
  if (!user) return;

  // Remove any existing tokens before creating a new one
  await PasswordReset.deleteMany({ userId: user._id });

  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await PasswordReset.create({ userId: user._id, userModel: 'AdminUser', token, expiresAt });

  const resetUrl = `${process.env.ADMIN_ORIGIN || 'http://localhost:3001'}/reset-password?token=${token}`;
  await notify.staffPasswordReset(user, resetUrl);
};

// Validates the token, updates the password hash, and marks the token as used.
const resetPassword = async (token, newPassword) => {
  const record = await PasswordReset.findOne({ token, used: false });
  if (!record || record.expiresAt < new Date()) {
    const err = new Error('Reset link is invalid or has expired');
    err.statusCode = 400;
    throw err;
  }

  const user = await AdminUser.findById(record.userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  user.passwordHash = AdminUser.hashPassword(newPassword);
  await user.save();

  record.used = true;
  await record.save();
};

module.exports = { requestReset, resetPassword };
