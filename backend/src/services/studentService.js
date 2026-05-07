// Student service — core business logic for student CRUD, grades, attendance, and promotions.
// Teachers are scoped to their assigned classes; all mutations are audit-logged.
const Student    = require('../models/Student');
const ClientUser = require('../models/ClientUser');
const Class      = require('../models/Class');
const crypto     = require('crypto');
const { toStudent, toStudentProfile } = require('../dtos/adminDto');
const { log }    = require('./auditService');
const { notify } = require('./emailService');

// Returns active students. Teachers are restricted to their assigned classes.
const getAllStudents = async (query = {}, requestingUser = null) => {
  const filter = { isActive: true };
  if (query.classId) {
    filter.class = query.classId;
  } else if (requestingUser?.role === 'teacher') {
    filter.class = { $in: requestingUser.assignedClasses };
  }
  const students = await Student.find(filter).populate('class', 'name grade section');
  return students.map(toStudent);
};

// Returns a full student profile including grades, attendance, class, and linked user.
const getStudentById = async (id) => {
  const student = await Student.findById(id)
    .populate('class', 'name grade section timetable')
    .populate('userId', 'firstName lastName email');
  if (!student) { const err = new Error('Student not found'); err.statusCode = 404; throw err; }
  return toStudentProfile(student);
};

// Creates and returns a new student record.
const createStudent = async (data) => {
  const student = await Student.create(data);
  return toStudent(student);
};

// Updates allowed student fields and returns the updated record.
const updateStudent = async (id, data) => {
  const student = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!student) { const err = new Error('Student not found'); err.statusCode = 404; throw err; }
  return toStudent(student);
};

// Links a student record to a client user account bidirectionally by email.
const linkUserAccount = async (studentId, userEmail) => {
  const student = await Student.findById(studentId);
  if (!student) { const err = new Error('Student not found'); err.statusCode = 404; throw err; }

  const user = await ClientUser.findOne({ email: userEmail.toLowerCase().trim() });
  if (!user) { const err = new Error('No registered account found with that email'); err.statusCode = 404; throw err; }

  student.userId = user._id;
  user.studentProfile = student._id;
  if (user.role === 'parent' && !(user.children || []).map(String).includes(String(student._id))) {
    user.children.push(student._id);
  }
  await Promise.all([student.save(), user.save()]);
  return toStudent(student);
};

// Returns active client users that have no linked student record.
const getUnlinkedUsers = async () => {
  const users = await ClientUser.find({ isActive: true, studentProfile: null })
    .select('firstName lastName email role').sort({ firstName: 1 });
  return users.map(u => ({ id: u._id, name: `${u.firstName} ${u.lastName}`, email: u.email, role: u.role }));
};

// Creates a time-limited invite token, saves it to the student, and emails the invite link.
const createRegistrationInvite = async (studentId, email, role, adminUser) => {
  const student = await Student.findById(studentId);
  if (!student) { const err = new Error('Student not found'); err.statusCode = 404; throw err; }
  if (student.userId) { const err = new Error('Student is already linked to a user account'); err.statusCode = 400; throw err; }

  const normalizedEmail = email.toLowerCase().trim();
  const ttlHours = Number(process.env.INVITE_TTL_HOURS) || 72;
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  student.invite = { tokenHash, email: normalizedEmail, role: role || 'parent', expiresAt, usedAt: null, createdBy: adminUser?._id, createdAt: new Date() };
  await student.save();

  const registerBase = process.env.CLIENT_REGISTER_URL || 'http://localhost:3000/register';
  const inviteUrl = `${registerBase}?inviteToken=${rawToken}`;

  await notify.registrationInvite(normalizedEmail, `${student.firstName} ${student.lastName}`, inviteUrl, expiresAt);
  await log({ actor: adminUser?._id, actorModel: 'AdminUser', actorName: adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : undefined, action: 'student.invite.create', target: `Student:${studentId}`, after: { email: normalizedEmail, role: role || 'parent', expiresAt } });

  return { studentId: student._id, email: normalizedEmail, role: role || 'parent', expiresAt, inviteUrl, inviteToken: process.env.NODE_ENV === 'production' ? undefined : rawToken };
};

// Updates or creates grade records; teachers are scoped to their class. Audit-logged and notifies parent/student.
const updateGrades = async (studentId, grades, adminUser) => {
  const student = await Student.findById(studentId).populate('userId', 'email firstName');
  if (!student) { const err = new Error('Student not found'); err.statusCode = 404; throw err; }

  if (adminUser.role === 'teacher') {
    const isAssigned = (adminUser.assignedClasses || []).map(String).includes(String(student.class));
    if (!isAssigned) { const err = new Error('You are not assigned to this student\'s class'); err.statusCode = 403; throw err; }
  }

  const before = JSON.parse(JSON.stringify(student.grades));
  for (const g of grades) {
    const existing = student.grades.find((gr) => gr.subject === g.subject && gr.term === g.term);
    if (existing) {
      existing.score = g.score; existing.grade = g.grade;
      existing.updatedBy = adminUser._id; existing.updatedAt = new Date();
    } else {
      student.grades.push({ ...g, updatedBy: adminUser._id, updatedAt: new Date() });
    }
  }
  await student.save();

  await log({ actor: adminUser._id, actorModel: 'AdminUser', actorName: `${adminUser.firstName} ${adminUser.lastName}`, action: 'grade.update', target: `Student:${studentId}`, before, after: student.grades });

  if (student.userId?.email) {
    for (const g of grades) notify.gradesUpdated(student.userId, g.subject, g.term).catch(() => {});
  }
  return student.grades;
};

// Updates or creates attendance records for a student; teachers scoped to their class.
const markAttendance = async (studentId, records, adminUser) => {
  const student = await Student.findById(studentId);
  if (!student) { const err = new Error('Student not found'); err.statusCode = 404; throw err; }

  if (adminUser.role === 'teacher') {
    const isAssigned = (adminUser.assignedClasses || []).map(String).includes(String(student.class));
    if (!isAssigned) { const err = new Error('You are not assigned to this student\'s class'); err.statusCode = 403; throw err; }
  }

  for (const r of records) {
    const date = new Date(r.date);
    const existing = student.attendance.find((a) => a.date.toDateString() === date.toDateString());
    if (existing) { existing.status = r.status; existing.markedBy = adminUser._id; }
    else { student.attendance.push({ date, status: r.status, markedBy: adminUser._id }); }
  }
  await student.save();

  await log({ actor: adminUser._id, actorModel: 'AdminUser', actorName: `${adminUser.firstName} ${adminUser.lastName}`, action: 'attendance.mark', target: `Student:${studentId}`, after: records });
  return student.attendance;
};

// Marks attendance for all students in a class at once using parallel updates.
const bulkMarkAttendance = async (classId, date, defaultStatus, overrides = [], adminUser) => {
  if (adminUser.role === 'teacher') {
    const isAssigned = (adminUser.assignedClasses || []).map(String).includes(String(classId));
    if (!isAssigned) { const err = new Error('You are not assigned to this class'); err.statusCode = 403; throw err; }
  }

  const students = await Student.find({ class: classId, isActive: true });
  if (!students.length) { const err = new Error('No students found in this class'); err.statusCode = 404; throw err; }

  const attendanceDate = new Date(date);
  const overrideMap = {};
  overrides.forEach(o => { overrideMap[String(o.studentId)] = o.status; });

  await Promise.all(students.map(async (student) => {
    const status = overrideMap[String(student._id)] || defaultStatus;
    const existing = student.attendance.find((a) => a.date.toDateString() === attendanceDate.toDateString());
    if (existing) { existing.status = status; existing.markedBy = adminUser._id; }
    else { student.attendance.push({ date: attendanceDate, status, markedBy: adminUser._id }); }
    return student.save();
  }));

  await log({ actor: adminUser._id, actorModel: 'AdminUser', actorName: `${adminUser.firstName} ${adminUser.lastName}`, action: 'attendance.bulk', target: `Class:${classId}`, after: { date, defaultStatus, studentCount: students.length } });
  return { marked: students.length, date, classId };
};

// Moves all active students from one class to another; used for end-of-year promotions.
const promoteStudents = async (fromClassId, toClassId, adminUser) => {
  const fromClass = await Class.findById(fromClassId);
  const toClass   = await Class.findById(toClassId);
  if (!fromClass || !toClass) { const err = new Error('One or both classes not found'); err.statusCode = 404; throw err; }

  const result = await Student.updateMany({ class: fromClassId, isActive: true }, { $set: { class: toClassId } });

  await log({ actor: adminUser._id, actorModel: 'AdminUser', actorName: `${adminUser.firstName} ${adminUser.lastName}`, action: 'student.promote', target: `Class:${fromClassId}→${toClassId}`, after: { promoted: result.modifiedCount } });
  return { promoted: result.modifiedCount, fromClass: fromClass.name, toClass: toClass.name };
};

module.exports = {
  getAllStudents, getStudentById, createStudent, updateStudent,
  createRegistrationInvite, linkUserAccount, getUnlinkedUsers,
  updateGrades, markAttendance, bulkMarkAttendance, promoteStudents,
};
