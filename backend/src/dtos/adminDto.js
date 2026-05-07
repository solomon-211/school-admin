const toAdminUser = (user) => ({
  id:              user._id,
  firstName:       user.firstName,
  lastName:        user.lastName,
  email:           user.email,
  role:            user.role,
  assignedClasses: user.assignedClasses,
  isActive:        user.isActive,
  createdAt:       user.createdAt,
});

const toClientUser = (user) => ({
  id:        user._id,
  firstName: user.firstName,
  lastName:  user.lastName,
  email:     user.email,
  phone:     user.phone,
  role:      user.role,
  devices:   (user.devices || []).map((d) => ({
    deviceId:     d.deviceId,
    deviceName:   d.deviceName,
    verified:     d.verified,
    registeredAt: d.registeredAt,
    verifiedAt:   d.verifiedAt,
  })),
  isActive:  user.isActive,
  createdAt: user.createdAt,
});

const toStudent = (student) => ({
  id:          student._id,
  studentCode: student.studentCode,
  firstName:   student.firstName,
  lastName:    student.lastName,
  dateOfBirth: student.dateOfBirth,
  gender:      student.gender,
  class:       student.class,
  feeBalance:  student.feeBalance,
  isActive:    student.isActive,
  createdAt:   student.createdAt,
  // Include grades so the teacher list view can show them inline
  grades:      (student.grades || []).map((g) => ({
    subject:   g.subject,
    score:     g.score,
    grade:     g.grade,
    term:      g.term,
    updatedAt: g.updatedAt,
  })),
});

const toStudentProfile = (student) => ({
  id:          student._id,
  studentCode: student.studentCode,
  firstName:   student.firstName,
  lastName:    student.lastName,
  dateOfBirth: student.dateOfBirth,
  gender:      student.gender,
  class:       student.class
    ? {
        id:      student.class._id || student.class,
        name:    student.class.name,
        grade:   student.class.grade,
        section: student.class.section,
      }
    : null,
  userId:      student.userId
    ? {
        id:        student.userId._id || student.userId,
        firstName: student.userId.firstName,
        lastName:  student.userId.lastName,
        email:     student.userId.email,
      }
    : null,
  grades:      (student.grades || []).map((grade) => ({
    subject:   grade.subject,
    score:     grade.score,
    grade:     grade.grade,
    term:      grade.term,
    updatedBy: grade.updatedBy,
    updatedAt: grade.updatedAt,
  })),
  attendance:  (student.attendance || []).map((record) => ({
    date:     record.date,
    status:   record.status,
    markedBy: record.markedBy,
  })),
  feeBalance:  student.feeBalance,
  isActive:    student.isActive,
  createdAt:   student.createdAt,
});

const toClass = (cls) => ({
  id:           cls._id,
  name:         cls.name,
  grade:        cls.grade,
  section:      cls.section,
  teachers:     (cls.teachers || []).map((t) => ({
    subject: t.subject,
    teacher: t.teacher
      ? {
          id:        t.teacher._id || t.teacher,
          firstName: t.teacher.firstName,
          lastName:  t.teacher.lastName,
          email:     t.teacher.email,
        }
      : null,
  })),
  timetable: (cls.timetable || []).map((slot) => ({
    day:       slot.day,
    subject:   slot.subject,
    startTime: slot.startTime,
    endTime:   slot.endTime,
    room:      slot.room || null,
    // teacher is populated when available, stored as ObjectId otherwise
    teacher: slot.teacher && typeof slot.teacher === 'object' && slot.teacher.firstName
      ? {
          id:        slot.teacher._id,
          firstName: slot.teacher.firstName,
          lastName:  slot.teacher.lastName,
        }
      : slot.teacher
        ? { id: slot.teacher }
        : null,
  })),
  academicYear: cls.academicYear,
  isActive:     cls.isActive,
});

const toTransaction = (tx) => ({
  id:            tx._id,
  student:       tx.student,
  type:          tx.type,
  amount:        tx.amount,
  description:   tx.description,
  proof:         tx.proof || null,
  status:        tx.status,
  balanceBefore: tx.balanceBefore,
  balanceAfter:  tx.balanceAfter,
  processedBy:   tx.processedBy,
  processedAt:   tx.processedAt,
  createdAt:     tx.createdAt,
});

const toAuditLog = (log) => ({
  id:         log._id,
  actor:      log.actor,
  actorModel: log.actorModel,
  actorName:  log.actorName,
  action:     log.action,
  target:     log.target,
  before:     log.before,
  after:      log.after,
  ip:         log.ip || null,
  createdAt:  log.createdAt,
});

module.exports = { toAdminUser, toClientUser, toStudent, toStudentProfile, toClass, toTransaction, toAuditLog };
