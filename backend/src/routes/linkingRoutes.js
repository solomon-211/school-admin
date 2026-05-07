const express = require('express');
const { param, body } = require('express-validator');
const LinkingRequest = require('../models/LinkingRequest');
const Student        = require('../models/Student');
const ClientUser     = require('../models/ClientUser');
const { protect, adminOnly } = require('../middlewares/auth');
const { notify }     = require('../services/emailService');
const validate       = require('../middlewares/validate');

const router = express.Router();
router.use(protect, adminOnly);

// Normalize student codes to uppercase before lookup to avoid case mismatches.
const normalizeStudentCode = (studentCode) => studentCode.trim().toUpperCase();

// GET all pending linking requests
router.get('/', async (req, res, next) => {
  try {
    const requests = await LinkingRequest.find({ status: 'pending' })
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
});

// PATCH approve or reject a linking request.
// On approval, the student record is linked to the user account bidirectionally.
router.patch('/:id',
  [
    param('id').isMongoId(),
    body('action').isIn(['approve', 'reject']),
    body('rejectionReason').optional().trim().isLength({ min: 3, max: 500 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const request = await LinkingRequest.findById(req.params.id)
        .populate('user', 'firstName lastName email role');

      if (!request || request.status !== 'pending') {
        return res.status(404).json({ success: false, message: 'Request not found or already processed' });
      }

      if (req.body.action === 'approve') {
        const studentCode = normalizeStudentCode(request.studentCode);
        const student = await Student.findOne({ studentCode });
        if (!student) {
          return res.status(404).json({ success: false, message: `No student found with code: ${studentCode}` });
        }

        if (student.userId && String(student.userId) !== String(request.user._id)) {
          return res.status(409).json({ success: false, message: 'Student is already linked to another account' });
        }

        const user = await ClientUser.findById(request.user._id);
        if (!user) {
          return res.status(404).json({ success: false, message: 'Linked user account not found' });
        }

        // Link student to user
        student.userId = user._id;
        if (user.role === 'student') {
          user.studentProfile = student._id;
        } else {
          user.children = user.children || [];
          if (!user.children.map(String).includes(String(student._id))) {
            user.children.push(student._id);
          }
        }

        await Promise.all([student.save(), user.save()]);

        try {
          await notify.linkingApproved(user, `${student.firstName} ${student.lastName}`);
        } catch (e) { console.error('Email error:', e.message); }

        request.status = 'approved';
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();
        request.student = student._id;
        await request.save();

        return res.json({ success: true, message: 'Request approved and account linked.' });
      }

      request.status = 'rejected';
      request.rejectionReason = req.body.rejectionReason || 'Student code could not be verified';
      request.reviewedBy = req.user._id;
      request.reviewedAt = new Date();
      await request.save();

      try {
        await notify.linkingRejected(request.user, request.studentCode, request.rejectionReason);
      } catch (e) { console.error('Email error:', e.message); }

      return res.json({ success: true, message: 'Request rejected.' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
