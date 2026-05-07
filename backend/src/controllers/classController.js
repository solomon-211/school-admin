const classService = require('../services/classService');

const getAllClasses = async (req, res, next) => {
  try {
    res.json({ success: true, data: await classService.getAllClasses() });
  } catch (err) { next(err); }
};

const getClass = async (req, res, next) => {
  try {
    res.json({ success: true, data: await classService.getClassById(req.params.id) });
  } catch (err) { next(err); }
};

const createClass = async (req, res, next) => {
  try {
    res.status(201).json({ success: true, data: await classService.createClass(req.body) });
  } catch (err) { next(err); }
};

const updateClass = async (req, res, next) => {
  try {
    res.json({ success: true, data: await classService.updateClass(req.params.id, req.body) });
  } catch (err) { next(err); }
};

const assignTeacher = async (req, res, next) => {
  try {
    const { teacherId, subject } = req.body;
    const data = await classService.assignTeacher(req.params.id, teacherId, subject);
    res.json({ success: true, message: `Teacher assigned to ${subject}`, data });
  } catch (err) { next(err); }
};

const removeTeacher = async (req, res, next) => {
  try {
    const data = await classService.removeTeacher(req.params.id, req.body.subject);
    res.json({ success: true, message: 'Teacher removed', data });
  } catch (err) { next(err); }
};

const updateTimetable = async (req, res, next) => {
  try {
    res.json({ success: true, data: await classService.updateTimetable(req.params.id, req.body.timetable) });
  } catch (err) { next(err); }
};

const getTeachers = async (req, res, next) => {
  try {
    res.json({ success: true, data: await classService.getTeachers() });
  } catch (err) { next(err); }
};

module.exports = {
  getAllClasses, getClass, createClass, updateClass,
  assignTeacher, removeTeacher, updateTimetable, getTeachers,
};
