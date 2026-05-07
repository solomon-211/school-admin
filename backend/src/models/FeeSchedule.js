const mongoose = require('mongoose');

/**
 * Fee schedule — defines what fees are due, when, and for which class/year.
 */
const feeScheduleSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true }, // e.g. "Term 1 Tuition"
  amount:       { type: Number, required: true, min: 0 },
  dueDate:      { type: Date, required: true },
  academicYear: { type: String, required: true },
  term:         { type: String },                             // e.g. "Term 1"
  // Optional: apply only to specific classes (empty = all classes)
  classes:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  description:  { type: String, trim: true },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('FeeSchedule', feeScheduleSchema);
