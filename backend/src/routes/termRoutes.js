const express = require('express');
const { body, param } = require('express-validator');
const AcademicTerm = require('../models/AcademicTerm');
const { protect, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();
router.use(protect);

// GET all terms — sorted newest first
router.get('/', async (req, res, next) => {
  try {
    const terms = await AcademicTerm.find({}).sort({ startDate: -1 });
    res.json({ success: true, data: terms });
  } catch (err) { next(err); }
});

// GET current term — the one marked isCurrent: true
router.get('/current', async (req, res, next) => {
  try {
    const term = await AcademicTerm.findOne({ isCurrent: true });
    res.json({ success: true, data: term });
  } catch (err) { next(err); }
});

// POST create term (admin only)
// Only one term should be marked isCurrent at a time — use PATCH /set-current to switch.
router.post('/', adminOnly,
  [
    body('name').trim().notEmpty(),
    body('academicYear').trim().notEmpty(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const term = await AcademicTerm.create(req.body);
      res.status(201).json({ success: true, data: term });
    } catch (err) { next(err); }
  }
);

// PATCH set as current term
router.patch('/:id/set-current', adminOnly,
  [param('id').isMongoId()],
  validate,
  async (req, res, next) => {
    try {
      const term = await AcademicTerm.findById(req.params.id);
      if (!term) return res.status(404).json({ success: false, message: 'Term not found' });
      term.isCurrent = true;
      await term.save();
      res.json({ success: true, message: `${term.name} is now the current term.`, data: term });
    } catch (err) { next(err); }
  }
);

// DELETE term
router.delete('/:id', adminOnly,
  [param('id').isMongoId()], validate,
  async (req, res, next) => {
    try {
      await AcademicTerm.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Term deleted.' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
