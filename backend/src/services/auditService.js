const AuditLog = require('../models/AuditLog');

// Audit logging service — records system actions for accountability and compliance.
// Uses fire-and-forget: errors are logged but never thrown to avoid breaking main flow.

// Writes an audit entry. Accepts actor, action, target, before/after values, and optional IP.
const log = async ({ actor, actorModel = 'AdminUser', actorName, action, target, before, after, ip }) => {
  try {
    await AuditLog.create({ actor, actorModel, actorName, action, target, before, after, ip });
  } catch (e) {
    console.error('[AuditLog] Failed to write:', e.message);
  }
};

// Returns the most recent audit logs, newest first. Defaults to 100 entries.
const { toAuditLog } = require('../dtos/adminDto');
const getRecentLogs = async (limit = 100) => {
  const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(limit);
  return logs.map(toAuditLog);
};

module.exports = { log, getRecentLogs };
