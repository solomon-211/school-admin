const express = require('express');
const { body, param } = require('express-validator');
const FeeSchedule = require('../models/FeeSchedule');
const { protect, adminOnly, staffOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();
router.use(protect);

// GET all active fee schedules — visible to all staff
router.get('/', staffOnly, async (req, res, next) => {
  try {
    const schedules = await FeeSchedule.find({ isActive: true })
      .populate('classes', 'name')
      .sort({ dueDate: 1 });
    res.json({ success: true, data: schedules });
  } catch (err) { next(err); }
});

router.post('/', adminOnly,
  [
    body('name').trim().notEmpty(),
    body('amount').isFloat({ min: 0 }),
    body('dueDate').isISO8601(),
    body('academicYear').trim().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const schedule = await FeeSchedule.create(req.body);
      res.status(201).json({ success: true, data: schedule });
    } catch (err) { next(err); }
  }
);

router.put('/:id', adminOnly,
  [
    param('id').isMongoId(),
    body().custom((value) => {
      const allowed = ['name', 'amount', 'dueDate', 'academicYear', 'term', 'classes', 'description', 'isActive'];
      const keys = Object.keys(value || {});
      const invalid = keys.filter((k) => !allowed.includes(k));
      if (invalid.length) {
        throw new Error(`Invalid update field(s): ${invalid.join(', ')}`);
      }
      if (!keys.length) {
        throw new Error('At least one field must be provided for update');
      }
      return true;
    }),
    body('name').optional().trim().notEmpty().isLength({ max: 120 }),
    body('amount').optional().isFloat({ min: 0 }),
    body('dueDate').optional().isISO8601().toDate(),
    body('academicYear').optional().trim().notEmpty().isLength({ max: 50 }),
    body('term').optional().trim().isLength({ max: 50 }),
    body('classes').optional().isArray(),
    body('classes.*').optional().isMongoId(),
    body('description').optional().trim().isLength({ max: 300 }),
    body('isActive').optional().isBoolean().toBoolean(),
  ],
  validate, async (req, res, next) => {
  try {
    const s = await FeeSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!s) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
});

// Soft-delete: sets isActive to false rather than removing the record.
router.delete('/:id', adminOnly, [param('id').isMongoId()], validate, async (req, res, next) => {
  try {
    await FeeSchedule.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Fee schedule removed.' });
  } catch (err) { next(err); }
});

module.exports = router;
