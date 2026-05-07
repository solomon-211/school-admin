const Class = require('../models/Class');
const AdminUser = require('../models/AdminUser');
const { toClass } = require('../dtos/adminDto');

const getAllClasses = async () => {
  const classes = await Class.find({ isActive: true })
    .populate('teachers.teacher', 'firstName lastName email')
    .populate('timetable.teacher', 'firstName lastName');
  return classes.map(toClass);
};

const getClassById = async (id) => {
  const cls = await Class.findById(id)
    .populate('teachers.teacher', 'firstName lastName email')
    .populate('timetable.teacher', 'firstName lastName');
  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }
  return toClass(cls);
};

const createClass = async (data) => {
  const cls = await Class.create(data);
  return toClass(cls);
};

const updateClass = async (id, data) => {
  const cls = await Class.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }
  return toClass(cls);
};

const assignTeacher = async (classId, teacherId, subject) => {
  const teacher = await AdminUser.findById(teacherId);
  if (!teacher || teacher.role !== 'teacher') {
    const err = new Error('Teacher not found');
    err.statusCode = 404;
    throw err;
  }

  const cls = await Class.findById(classId);
  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }

  const existingIdx = cls.teachers.findIndex(
    (t) => t.subject.toLowerCase() === subject.toLowerCase()
  );

  if (existingIdx >= 0) {
    cls.teachers[existingIdx].teacher = teacherId;
  } else {
    cls.teachers.push({ teacher: teacherId, subject });
  }

  await cls.save();

  if (!(teacher.assignedClasses || []).map(String).includes(String(classId))) {
    teacher.assignedClasses.push(classId);
    await teacher.save();
  }

  await cls.populate('teachers.teacher', 'firstName lastName email');
  return toClass(cls);
};

const removeTeacher = async (classId, subject) => {
  const cls = await Class.findById(classId);
  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }

  const removedTeacherIds = cls.teachers
    .filter((assignment) => assignment.subject.toLowerCase() === subject.toLowerCase())
    .map((assignment) => String(assignment.teacher));

  cls.teachers = cls.teachers.filter(
    (t) => t.subject.toLowerCase() !== subject.toLowerCase()
  );

  await cls.save();

  const uniqueRemovedTeacherIds = [...new Set(removedTeacherIds)];
  const teachers = await AdminUser.find({ _id: { $in: uniqueRemovedTeacherIds } });
  await Promise.all(teachers.map(async (teacher) => {
    const stillAssigned = cls.teachers.some((assignment) => String(assignment.teacher) === String(teacher._id));
    if (!stillAssigned) {
      teacher.assignedClasses = (teacher.assignedClasses || []).filter((assignedClassId) => String(assignedClassId) !== String(classId));
      await teacher.save();
    }
  }));

  await cls.populate('teachers.teacher', 'firstName lastName email');
  return toClass(cls);
};

const updateTimetable = async (classId, timetable) => {
  const cls = await Class.findByIdAndUpdate(
    classId,
    { timetable },
    { new: true, runValidators: true }
  );
  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }
  await cls.populate('teachers.teacher', 'firstName lastName email');
  await cls.populate('timetable.teacher', 'firstName lastName');
  return toClass(cls);
};

const getTeachers = async () => {
  const teachers = await AdminUser.find({ role: 'teacher', isActive: true })
    .select('firstName lastName email assignedClasses')
    .sort({ firstName: 1 });
  return teachers.map((t) => ({
    id:              t._id,
    firstName:       t.firstName,
    lastName:        t.lastName,
    email:           t.email,
    assignedClasses: t.assignedClasses,
  }));
};

module.exports = {
  getAllClasses, getClassById, createClass, updateClass,
  assignTeacher, removeTeacher, updateTimetable, getTeachers,
};
