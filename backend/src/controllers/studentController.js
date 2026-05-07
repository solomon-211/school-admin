// Handles student management HTTP requests. Passes req.user to services for RBAC and audit logging.
const studentService = require('../services/studentService');

// GET /api/students — returns students; teachers are scoped to their assigned classes.
const getAllStudents = async (req, res, next) => {
  try {
    const data = await studentService.getAllStudents(req.query, req.user);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/students/:id — returns full student profile including grades and attendance.
const getStudent = async (req, res, next) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    res.json({ success: true, data: student });
  } catch (err) { next(err); }
};

// POST /api/students — creates a new student record (admin only).
const createStudent = async (req, res, next) => {
  try {
    const data = await studentService.createStudent(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

// PUT /api/students/:id — updates student info such as name, class, or status (admin only).
const updateStudent = async (req, res, next) => {
  try {
    const data = await studentService.updateStudent(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// PUT /api/students/:id/grades — updates grades; teachers limited to their own class students.
const updateGrades = async (req, res, next) => {
  try {
    const data = await studentService.updateGrades(req.params.id, req.body.grades, req.user);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// PUT /api/students/:id/attendance — marks attendance records for a single student.
const markAttendance = async (req, res, next) => {
  try {
    const data = await studentService.markAttendance(req.params.id, req.body.records, req.user);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// POST /api/students/bulk-attendance — marks attendance for all students in a class at once.
const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { classId, date, defaultStatus, overrides } = req.body;
    const data = await studentService.bulkMarkAttendance(classId, date, defaultStatus, overrides, req.user);
    res.json({ success: true, message: `Attendance marked for ${data.marked} students.`, data });
  } catch (err) { next(err); }
};

// POST /api/students/promote — moves all active students from one class to another (admin only).
const promoteStudents = async (req, res, next) => {
  try {
    const { fromClassId, toClassId } = req.body;
    const data = await studentService.promoteStudents(fromClassId, toClassId, req.user);
    res.json({ success: true, message: `${data.promoted} students promoted from ${data.fromClass} to ${data.toClass}.`, data });
  } catch (err) { next(err); }
};

// PATCH /api/students/:id/link-account — links a student record to a client user account by email.
const linkUserAccount = async (req, res, next) => {
  try {
    const data = await studentService.linkUserAccount(req.params.id, req.body.email);
    res.json({ success: true, message: 'Account linked successfully', data });
  } catch (err) { next(err); }
};

// POST /api/students/:id/send-invite — sends a registration invite that auto-links to the student.
const sendRegistrationInvite = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const data = await studentService.createRegistrationInvite(req.params.id, email, role, req.user);
    res.json({ success: true, message: 'Registration invite created and sent.', data });
  } catch (err) { next(err); }
};

// GET /api/students/unlinked-users — returns client users not yet linked to a student record.
const getUnlinkedUsers = async (req, res, next) => {
  try {
    const data = await studentService.getUnlinkedUsers();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = {
  getAllStudents, getStudent, createStudent, updateStudent,
  updateGrades, markAttendance, bulkMarkAttendance, promoteStudents,
  linkUserAccount, sendRegistrationInvite, getUnlinkedUsers,
};
