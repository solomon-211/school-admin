const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    grade:   { type: String, trim: true },
    section: { type: String, trim: true },

    /**
     * Multiple teachers can be assigned to a class, each for a specific subject.
     * e.g. [{ teacher: ObjectId, subject: 'Mathematics' }, { teacher: ObjectId, subject: 'English' }]
     */
    teachers: [
      {
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
        subject: { type: String, required: true, trim: true },
      },
    ],

    timetable: [
      {
        day:       { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
        subject:   { type: String },
        startTime: { type: String },
        endTime:   { type: String },
        room:      { type: String },
        teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }, // which teacher takes this slot
      },
    ],

    academicYear: { type: String },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
