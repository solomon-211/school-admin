const mongoose = require('mongoose');
const crypto = require('crypto');

// Schema for admin and teacher accounts.
// Passwords are stored as SHA-512 hashes — never plain text.
const adminUserSchema = new mongoose.Schema(
  {
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
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true 
    },

    passwordHash: { 
      type: String, 
      required: true
    },

    role: {
      type: String,
      enum: ['admin', 'teacher'],
      default: 'teacher',
    },

    // Classes the teacher is assigned to — used for RBAC scope checks.
    assignedClasses: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Class' 
    }],

    isActive: { 
      type: Boolean, 
      default: true
    },
  },
  { 
    timestamps: true
  }
);

// Hash a plain-text password using SHA-512.
adminUserSchema.statics.hashPassword = function (password) {
  return crypto.createHash('sha512').update(password).digest('hex');
};

// Compare a plain-text password against the stored hash.
adminUserSchema.methods.verifyPassword = function (password) {
  const hash = crypto.createHash('sha512').update(password).digest('hex');
  return hash === this.passwordHash;
};

module.exports = mongoose.model('AdminUser', adminUserSchema);
