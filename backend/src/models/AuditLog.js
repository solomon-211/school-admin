const mongoose = require('mongoose');

/**
 * Audit log — records every significant action in the system.
 */
const auditLogSchema = new mongoose.Schema({
  actor:      { type: mongoose.Schema.Types.ObjectId, required: true }, // who did it
  actorModel: { type: String, enum: ['AdminUser', 'ClientUser'], required: true },
  actorName:  { type: String },
  action:     { type: String, required: true }, // e.g. 'grade.update', 'fee.approve'
  target:     { type: String },                 // e.g. 'Student:abc123'
  before:     { type: mongoose.Schema.Types.Mixed }, // previous value
  after:      { type: mongoose.Schema.Types.Mixed },  // new value
  ip:         { type: String },
}, { timestamps: true });

// Auto-delete logs older than 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
