// Handles fee transaction listing, approval/rejection, and stats.
const feeService = require('../services/feeService');

// GET /api/fees — list transactions; supports query filters: studentId, status, type
const getAllTransactions = async (req, res, next) => {
  try {
    const data = await feeService.getAllTransactions(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// PATCH /api/fees/:txId/process — approve or reject a pending transaction
const processTransaction = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const data = await feeService.processTransaction(req.params.txId, action, req.user._id);
    res.json({ success: true, message: `Transaction ${action}d`, data });
  } catch (err) { next(err); }
};

// GET /api/fees/stats — total deposited, total withdrawn, pending withdrawal count
const getFeeStats = async (req, res, next) => {
  try {
    const data = await feeService.getFeeStats();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// POST /api/fees/charge — admin directly charges a fee to a student (auto-approved)
const chargeStudent = async (req, res, next) => {
  try {
    const { studentId, amount, description } = req.body;
    const data = await feeService.chargeStudent(studentId, Number(amount), description, req.user._id);
    res.status(201).json({ success: true, message: 'Fee charged successfully.', data });
  } catch (err) { next(err); }
};

// PATCH /api/fees/charge/:txId — admin updates a pending charge (amount or description)
const updateCharge = async (req, res, next) => {
  try {
    const data = await feeService.updateCharge(req.params.txId, req.body, req.user._id);
    res.json({ success: true, message: 'Charge updated.', data });
  } catch (err) { next(err); }
};

// DELETE /api/fees/charge/:txId — admin cancels/deletes a pending charge
const deleteCharge = async (req, res, next) => {
  try {
    const data = await feeService.deleteCharge(req.params.txId, req.user._id);
    res.json({ success: true, message: 'Charge deleted.', data });
  } catch (err) { next(err); }
};

module.exports = { getAllTransactions, processTransaction, getFeeStats, chargeStudent, updateCharge, deleteCharge };
