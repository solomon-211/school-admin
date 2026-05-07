// Password reset routes — public endpoints (no auth required).
const express = require('express');
const { body } = require('express-validator');
const { requestReset, resetPassword } = require('../services/passwordResetService');
const validate = require('../middlewares/validate');

const router = express.Router();

// Sends a reset link to the email if it belongs to a registered admin/teacher.
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  async (req, res, next) => {
    try {
      await requestReset(req.body.email);
      res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    } catch (err) { next(err); }
  }
);

// Validates the token and sets a new password.
router.post('/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 8 })],
  validate,
  async (req, res, next) => {
    try {
      await resetPassword(req.body.token, req.body.password);
      res.json({ success: true, message: 'Password reset successfully.' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
