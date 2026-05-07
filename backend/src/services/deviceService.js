// Device verification service — manages client user device approval and revocation.
// ClientUser is a shared collection; changes are immediately visible to the client app.
const ClientUser = require('../models/ClientUser');
const { toClientUser } = require('../dtos/adminDto');
const { notify } = require('./emailService');

// Returns active users who have at least one unverified device pending approval.
const getPendingDevices = async () => {
  const users = await ClientUser.find({ isActive: true });
  return users
    .map((u) => ({
      userId: u._id, firstName: u.firstName, lastName: u.lastName,
      email: u.email, role: u.role,
      pendingDevices: u.devices
        .filter((d) => !d.verified)
        .map((d) => ({ deviceId: d.deviceId, deviceName: d.deviceName, registeredAt: d.registeredAt })),
    }))
    .filter((u) => u.pendingDevices.length > 0);
};

// Returns all active client users with their full device list (verified and unverified).
const getAllUsers = async () => {
  const users = await ClientUser.find({ isActive: true }).sort({ createdAt: -1 });
  return users.map(toClientUser);
};

// Marks a device as verified so the user can log in from it; sends a notification email.
const verifyDevice = async (userId, deviceId, adminId) => {
  const user = await ClientUser.findById(userId);
  if (!user) { const err = new Error('User not found'); err.statusCode = 404; throw err; }

  const device = user.devices.find((d) => d.deviceId === deviceId);
  if (!device) { const err = new Error('Device not found for this user'); err.statusCode = 404; throw err; }

  device.verified = true;
  device.verifiedAt = new Date();
  device.verifiedBy = adminId;
  await user.save();

  notify.deviceVerified(user).catch(() => {});
  return toClientUser(user);
};

// Clears a device's verified status so the user can no longer log in from it.
const revokeDevice = async (userId, deviceId) => {
  const user = await ClientUser.findById(userId);
  if (!user) { const err = new Error('User not found'); err.statusCode = 404; throw err; }

  const device = user.devices.find((d) => d.deviceId === deviceId);
  if (!device) { const err = new Error('Device not found'); err.statusCode = 404; throw err; }

  device.verified = false;
  device.verifiedAt = undefined;
  device.verifiedBy = undefined;
  await user.save();

  return toClientUser(user);
};

module.exports = { getPendingDevices, getAllUsers, verifyDevice, revokeDevice };
