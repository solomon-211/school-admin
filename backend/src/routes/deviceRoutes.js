const express = require('express');
const { getPendingDevices, getAllUsers, verifyDevice, revokeDevice } = require('../services/deviceService');
const { protect, adminOnly } = require('../middlewares/auth');

const router = express.Router();
router.use(protect, adminOnly);

/**
 * @swagger
 * /api/devices/pending:
 *   get:
 *     summary: List all users with unverified devices
 *     tags: [Devices]
 *     responses:
 *       200:
 *         description: List of users with pending device approvals
 */
router.get('/pending', async (req, res, next) => {
  try { res.json({ success: true, data: await getPendingDevices() }); } catch(e) { next(e); }
});

/**
 * @swagger
 * /api/devices/users:
 *   get:
 *     summary: List all client app users with device status
 *     tags: [Devices]
 *     responses:
 *       200:
 *         description: All client users
 */
router.get('/users', async (req, res, next) => {
  try { res.json({ success: true, data: await getAllUsers() }); } catch(e) { next(e); }
});

/**
 * @swagger
 * /api/devices/{userId}/{deviceId}/verify:
 *   patch:
 *     summary: Verify a user's device (grants login access)
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device verified — user can now log in
 *       404:
 *         description: User or device not found
 */
router.patch('/:userId/:deviceId/verify', async (req, res, next) => {
  try {
    const data = await verifyDevice(req.params.userId, req.params.deviceId, req.user._id);
    res.json({ success: true, message: 'Device verified', data });
  } catch(e) { next(e); }
});

/**
 * @swagger
 * /api/devices/{userId}/{deviceId}/revoke:
 *   patch:
 *     summary: Revoke a user's device access
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device revoked
 */
router.patch('/:userId/:deviceId/revoke', async (req, res, next) => {
  try {
    const data = await revokeDevice(req.params.userId, req.params.deviceId);
    res.json({ success: true, message: 'Device revoked', data });
  } catch(e) { next(e); }
});

module.exports = router;
