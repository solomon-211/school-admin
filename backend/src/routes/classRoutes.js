// Class routes — all endpoints require authentication; write operations are admin-only.
const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllClasses, getClass, createClass, updateClass,
  assignTeacher, removeTeacher, updateTimetable, getTeachers,
} = require('../controllers/classController');
const { protect, adminOnly, staffOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

// Read — accessible to all staff
router.get('/',           staffOnly, getAllClasses);
router.get('/teachers',   staffOnly, getTeachers);
router.get('/:id',        staffOnly, [param('id').isMongoId()], validate, getClass);

// Write — admin only
router.post('/',          adminOnly, [body('name').trim().notEmpty()], validate, createClass);
router.put('/:id',        adminOnly,
  [
    param('id').isMongoId(),
    body().custom((value) => {
      const allowed = ['name', 'grade', 'section', 'academicYear', 'isActive'];
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
    body('grade').optional().trim().isLength({ max: 50 }),
    body('section').optional().trim().isLength({ max: 50 }),
    body('academicYear').optional().trim().isLength({ max: 50 }),
    body('isActive').optional().isBoolean().toBoolean(),
  ],
  validate, updateClass);

// Assign a teacher to a subject in this class
router.patch(
  '/:id/assign-teacher',
  adminOnly,
  [
    param('id').isMongoId(),
    body('teacherId').isMongoId().withMessage('Valid teacher ID required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
  ],
  validate,
  assignTeacher
);

// Remove a teacher from a subject
router.patch(
  '/:id/remove-teacher',
  adminOnly,
  [
    param('id').isMongoId(),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
  ],
  validate,
  removeTeacher
);

router.put(
  '/:id/timetable',
  adminOnly,
  [param('id').isMongoId(), body('timetable').isArray()],
  validate,
  updateTimetable
);

module.exports = router;
