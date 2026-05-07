// Fee service — transaction listing, approval/rejection, and stats aggregation.
const FeeTransaction = require('../models/FeeTransaction');
const Student        = require('../models/Student');
const ClientUser     = require('../models/ClientUser');
const { toTransaction } = require('../dtos/adminDto');
const { log }        = require('./auditService');
const { notify }     = require('./emailService');

// Returns transactions filtered by studentId, status, or type (max 200).
const getAllTransactions = async (query = {}) => {
  const filter = {};
  if (query.studentId) filter.student = query.studentId;
  if (query.status)    filter.status  = query.status;
  if (query.type)      filter.type    = query.type;

  const txs = await FeeTransaction.find(filter)
    .populate('student', 'firstName lastName studentCode')
    .sort({ createdAt: -1 })
    .limit(200);

  return txs.map(toTransaction);
};

// Approves or rejects a pending transaction, updates student balance, and notifies the user.
const processTransaction = async (txId, action, adminId) => {
  const tx = await FeeTransaction.findById(txId);
  if (!tx) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }

  if (tx.status !== 'pending') {
    const err = new Error('Transaction has already been processed');
    err.statusCode = 400;
    throw err;
  }

  const student = await Student.findById(tx.student);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  if (action === 'approve') {
    if (tx.type === 'deposit') {
      // When a deposit is approved, also mark any matching pending charge as paid
      student.feeBalance += tx.amount;
      tx.balanceAfter = student.feeBalance;

      // Find a pending charge with the same or similar amount and mark it approved
      const matchingCharge = await FeeTransaction.findOne({
        student: tx.student,
        type:    'charge',
        status:  'pending',
        amount:  tx.amount,
      });
      if (matchingCharge) {
        matchingCharge.status      = 'approved';
        matchingCharge.processedBy = adminId;
        matchingCharge.processedAt = new Date();
        await matchingCharge.save();
      }
    } else if (tx.type === 'withdrawal') {
      if (student.feeBalance < tx.amount) {
        const err = new Error('Insufficient balance to approve withdrawal');
        err.statusCode = 400;
        throw err;
      }
      student.feeBalance -= tx.amount;
      tx.balanceAfter = student.feeBalance;
    }

    tx.status = 'approved';
    await student.save();
  } else {
    tx.status = 'rejected';
  }

  tx.processedBy = adminId;
  tx.processedAt = new Date();
  await tx.save();

  await log({
    actor: adminId, actorModel: 'AdminUser',
    action: `fee.${action}`,
    target: `FeeTransaction:${txId}`,
    after: { type: tx.type, amount: tx.amount, status: tx.status },
  });

  // Send email notification to the user who initiated the transaction
  try {
    const user = await ClientUser.findById(tx.initiatedBy).select('email firstName');
    if (user) {
      if (tx.type === 'deposit') {
        action === 'approve'
          ? await notify.paymentApproved(user, tx.amount)
          : await notify.paymentRejected(user, tx.amount);
      } else {
        if (action === 'approve') await notify.refundApproved(user, tx.amount);
      }
    }
  } catch (e) { console.error('Email notification error:', e.message); }

  return toTransaction(tx);
};

// Returns total deposited, total withdrawn, and count of pending withdrawals.
const getFeeStats = async () => {
  const [totalDeposited, totalWithdrawn, pendingCount] = await Promise.all([
    FeeTransaction.aggregate([
      { $match: { type: 'deposit', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    FeeTransaction.aggregate([
      { $match: { type: 'withdrawal', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    FeeTransaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
  ]);

  return {
    totalDeposited:    totalDeposited[0]?.total  || 0,
    totalWithdrawn:    totalWithdrawn[0]?.total  || 0,
    pendingWithdrawals: pendingCount,
  };
};

// Admin-initiated fee charge — creates a pending 'charge' transaction.
// The student sees this as an outstanding amount they owe.
// Balance is NOT updated until the student pays and admin approves.
const chargeStudent = async (studentId, amount, description, adminId) => {
  const student = await Student.findById(studentId);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  const tx = await FeeTransaction.create({
    student:       studentId,
    type:          'charge',
    amount,
    description:   description || 'Fee charged by admin',
    status:        'pending',
    balanceBefore: student.feeBalance,
    balanceAfter:  student.feeBalance,  // unchanged until student pays
    processedBy:   adminId,
    processedAt:   new Date(),
    initiatedBy:   adminId,
  });

  await log({
    actor: adminId, actorModel: 'AdminUser',
    action: 'fee.charge',
    target: `Student:${studentId}`,
    after: { amount, description },
  });

  return toTransaction(tx);
};

// Admin updates a pending charge — can change amount or description before student pays.
const updateCharge = async (txId, data, adminId) => {
  const tx = await FeeTransaction.findById(txId);
  if (!tx) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }
  if (tx.type !== 'charge') {
    const err = new Error('Only charge transactions can be edited');
    err.statusCode = 400;
    throw err;
  }
  if (tx.status !== 'pending') {
    const err = new Error('Cannot edit a charge that has already been paid or cancelled');
    err.statusCode = 400;
    throw err;
  }

  if (data.amount !== undefined) tx.amount = Number(data.amount);
  if (data.description !== undefined) tx.description = data.description;
  await tx.save();

  await log({
    actor: adminId, actorModel: 'AdminUser',
    action: 'fee.charge.update',
    target: `FeeTransaction:${txId}`,
    after: { amount: tx.amount, description: tx.description },
  });

  return toTransaction(tx);
};

// Admin deletes a pending charge — removes it entirely so student no longer owes it.
const deleteCharge = async (txId, adminId) => {
  const tx = await FeeTransaction.findById(txId);
  if (!tx) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }
  if (tx.type !== 'charge') {
    const err = new Error('Only charge transactions can be deleted this way');
    err.statusCode = 400;
    throw err;
  }
  if (tx.status !== 'pending') {
    const err = new Error('Cannot delete a charge that has already been paid or cancelled');
    err.statusCode = 400;
    throw err;
  }

  await FeeTransaction.findByIdAndDelete(txId);

  await log({
    actor: adminId, actorModel: 'AdminUser',
    action: 'fee.charge.delete',
    target: `FeeTransaction:${txId}`,
    after: { deleted: true },
  });

  return { deleted: true };
};

module.exports = { getAllTransactions, processTransaction, getFeeStats, chargeStudent, updateCharge, deleteCharge };
