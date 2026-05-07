const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Mirror of the client-side User model.
 * The admin app manages device verification for these users.
 */
const clientUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:     { type: String },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'parent'],
      default: 'parent',
    },
    devices: [
      {
        deviceId:     { type: String, required: true },
        deviceName:   { type: String },
        verified:     { type: Boolean, default: false },
        registeredAt: { type: Date, default: Date.now },
        verifiedAt:   { type: Date },
        verifiedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
      },
    ],
    studentProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    children:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

clientUserSchema.statics.hashPassword = function (password) {
  return crypto.createHash('sha512').update(password).digest('hex');
};

// Use the same collection name ('users') as the client app's User model
// so both apps read/write the same documents in the shared database.
module.exports = mongoose.model('ClientUser', clientUserSchema, 'users');
