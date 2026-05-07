// Returns aggregated stats for the admin dashboard (students, fees, devices, attendance).
const { getDashboardStats } = require('../services/dashboardService');

const getStats = async (req, res, next) => {
  try {
    const data = await getDashboardStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
