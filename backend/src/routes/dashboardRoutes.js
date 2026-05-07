const express = require('express');
const { getStats } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middlewares/auth');

const router = express.Router();

// Admin-only: returns aggregated stats for the dashboard (students, fees, devices, etc.)
router.get('/', protect, adminOnly, getStats);

module.exports = router;
