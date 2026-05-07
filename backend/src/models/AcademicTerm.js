const mongoose = require('mongoose');

/**
 * Academic term — defines the start/end dates for each term.
 * Grades and attendance are associated with a term.
 */
const academicTermSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true }, // e.g. "Term 1"
  academicYear: { type: String, required: true },             // e.g. "2024-2025"
  startDate:    { type: Date, required: true },
  endDate:      { type: Date, required: true },
  isActive:     { type: Boolean, default: true },
  isCurrent:    { type: Boolean, default: false },            // only one can be current
}, { timestamps: true });

// Ensure only one term is marked as current
academicTermSchema.pre('save', async function (next) {
  if (this.isCurrent && this.isModified('isCurrent')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
  next();
});

module.exports = mongoose.model('AcademicTerm', academicTermSchema);
