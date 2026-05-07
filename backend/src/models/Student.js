/**
 * ============================================================================
 * STUDENT MODEL
 * ============================================================================
 * 
 * Mongoose schema for student academic records.
 * 
 * Stores:
 * - Personal information (name, DOB, gender, class)
 * - Academic performance (grades, subjects)
 * - Attendance records (daily tracking)
 * - Financial information (fee balance)
 * 
 * Relationships:
 * - Links to User model (parent/student account)
 * - Links to Class model (current class assignment)
 * - Links to AdminUser (grades marked by teachers)
 */

const mongoose = require('mongoose');

/**
 * Student Schema
 * 
 * Represents student academic profile and records.
 * Separate from User model for better data organization.
 */
const studentSchema = new mongoose.Schema(
  {
    // ────────────────────────────────────────────────────────────────────────
    // PERSONAL INFORMATION
    // ────────────────────────────────────────────────────────────────────────
    
    // Link to parent/student account
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ClientUser'  // References the ClientUser model (parent/student portal accounts)
    },
    // Registration invite metadata for parent/student onboarding.
    invite: {
      tokenHash: { type: String },
      email: { type: String, lowercase: true, trim: true },
      role: { type: String, enum: ['student', 'parent'], default: 'parent' },
      expiresAt: { type: Date },
      usedAt: { type: Date },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
      createdAt: { type: Date },
    },

    // Unique student identifier
    studentCode: { 
      type: String, 
      unique: true, 
      required: true     // E.g., "STU001", "STU002"
    },

    firstName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    lastName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    dateOfBirth: { 
      type: Date         // For age calculation and records
    },
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other'] 
    },

    // ────────────────────────────────────────────────────────────────────────
    // ACADEMIC INFORMATION
    // ────────────────────────────────────────────────────────────────────────
    
    // Current class assignment
    class: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Class'       // Reference to Class model
    },

    // ────────────────────────────────────────────────────────────────────────
    // GRADES & ACADEMIC PERFORMANCE
    // ────────────────────────────────────────────────────────────────────────
    grades: [
      {
        subject: { 
          type: String   // E.g., "Mathematics", "English"
        },
        score: { 
          type: Number   // 0-100 scale
        },
        grade: { 
          type: String   // A, B, C, D, F (or similar grading scale)
        },
        term: { 
          type: String   // Term 1, Term 2, Term 3
        },
        updatedBy: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'AdminUser'  // Teacher who recorded this grade
        },
        updatedAt: { 
          type: Date, 
          default: Date.now // When grade was recorded
        },
      },
    ],

    // ────────────────────────────────────────────────────────────────────────
    // ATTENDANCE TRACKING
    // ────────────────────────────────────────────────────────────────────────
    attendance: [
      {
        date: { 
          type: Date     // Attendance date
        },
        status: { 
          type: String, 
          enum: ['present', 'absent', 'late', 'excused']  // Attendance status
        },
        markedBy: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'AdminUser'  // Teacher/admin who marked attendance
        },
      },
    ],

    // ────────────────────────────────────────────────────────────────────────
    // FINANCIAL INFORMATION
    // ────────────────────────────────────────────────────────────────────────
    feeBalance: { 
      type: Number, 
      default: 0        // Current outstanding balance in currency units
    },

    // Account Status
    isActive: { 
      type: Boolean, 
      default: true     // Inactive students don't appear in active lists
    },
  },
  { 
    timestamps: true    // Adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Student', studentSchema);
