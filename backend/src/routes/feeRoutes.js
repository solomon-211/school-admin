// Fee routes — all endpoints require admin authentication.
const express = require('express');
const { body, param } = require('express-validator');
const { getAllTransactions, processTransaction, getFeeStats, chargeStudent, updateCharge, deleteCharge } = require('../controllers/feeController');
const { protect, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/',      getAllTransactions);
router.get('/stats', getFeeStats);

// Admin direct fee charge — creates a pending charge for a student
router.post('/charge',
  [
    body('studentId').isMongoId().withMessage('Valid student ID required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('description').optional().trim().isLength({ max: 200 }),
  ],
  validate,
  chargeStudent
);

// Admin edits a pending charge (amount or description) before student pays
router.patch('/charge/:txId',
  [
    param('txId').isMongoId(),
    body('amount').optional().isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('description').optional().trim().isLength({ max: 200 }),
  ],
  validate,
  updateCharge
);

// Admin deletes a pending charge entirely
router.delete('/charge/:txId',
  [param('txId').isMongoId()],
  validate,
  deleteCharge
);

// Approve or reject a pending deposit or withdrawal
router.patch(
  '/:txId/process',
  [
    param('txId').isMongoId(),
    body('action').isIn(['approve', 'reject']),
  ],
  validate,
  processTransaction
);

module.exports = router;
