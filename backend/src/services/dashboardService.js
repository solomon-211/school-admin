const Student = require('../models/Student');
const ClientUser = require('../models/ClientUser');
const Class = require('../models/Class');
const AdminUser = require('../models/AdminUser');
const FeeTransaction = require('../models/FeeTransaction');

/**
 * Aggregate dashboard statistics for the admin overview.
 */
const getDashboardStats = async () => {
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalParents,
    pendingDevices,
    feeStats,
    attendanceStats,
  ] = await Promise.all([
    Student.countDocuments({ isActive: true }),
    AdminUser.countDocuments({ role: 'teacher', isActive: true }),
    Class.countDocuments({ isActive: true }),
    ClientUser.countDocuments({ role: 'parent', isActive: true }),
    // Count users with at least one unverified device
    ClientUser.countDocuments({ 'devices.verified': false }),
    FeeTransaction.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id:   '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    // Attendance rate: present / total records
    Student.aggregate([
      { $unwind: '$attendance' },
      {
        $group: {
          _id:     '$attendance.status',
          count:   { $sum: 1 },
        },
      },
    ]),
  ]);

  // Process fee stats
  const feeDeposits    = feeStats.find((f) => f._id === 'deposit')    || { total: 0, count: 0 };
  const feeWithdrawals = feeStats.find((f) => f._id === 'withdrawal') || { total: 0, count: 0 };

  // Process attendance stats
  const attendanceMap = {};
  attendanceStats.forEach((a) => { attendanceMap[a._id] = a.count; });
  const totalAttendance = Object.values(attendanceMap).reduce((s, v) => s + v, 0);
  const attendanceRate  = totalAttendance
    ? Math.round(((attendanceMap.present || 0) / totalAttendance) * 100)
    : 0;

  return {
    totalStudents,
    totalTeachers,
    totalClasses,
    totalParents,
    pendingDeviceVerifications: pendingDevices,
    fees: {
      totalCollected: feeDeposits.total,
      totalRefunded:  feeWithdrawals.total,
      depositCount:   feeDeposits.count,
    },
    attendanceRate,
  };
};

module.exports = { getDashboardStats };
