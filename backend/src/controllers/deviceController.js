// Handles device verification management: list pending, verify, and revoke devices.
const deviceService = require('../services/deviceService');

// GET /api/devices/pending — users with at least one unverified device
const getPendingDevices = async (req, res, next) => {
  try {
    const data = await deviceService.getPendingDevices();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/devices/:userId/:deviceId/verify — approve a device for login
const verifyDevice = async (req, res, next) => {
  try {
    const { userId, deviceId } = req.params;
    const data = await deviceService.verifyDevice(userId, deviceId, req.user._id);
    res.json({ success: true, message: 'Device verified successfully', data });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/devices/:userId/:deviceId/revoke — block a device from login
const revokeDevice = async (req, res, next) => {
  try {
    const { userId, deviceId } = req.params;
    const data = await deviceService.revokeDevice(userId, deviceId);
    res.json({ success: true, message: 'Device revoked', data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPendingDevices, verifyDevice, revokeDevice };
