const mongoose = require('mongoose');

// Tracks parent/student requests to link their account to a student record.
// Admin reviews and approves or rejects each request.
const linkingRequestSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'ClientUser', required: true },
  student:         { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentCode:     { type: String, required: true, trim: true, uppercase: true },
  status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  message:         { type: String, trim: true },
  rejectionReason: { type: String, trim: true },
  rejectionFeedback:{ type: String, trim: true },
  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  reviewedAt:      { type: Date },
}, { timestamps: true });

linkingRequestSchema.index({ user: 1, status: 1 });
linkingRequestSchema.index({ studentCode: 1 });
linkingRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LinkingRequest', linkingRequestSchema);
