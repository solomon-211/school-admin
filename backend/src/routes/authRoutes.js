const express = require('express');
const { body } = require('express-validator');
const { loginAdmin, createStaffMember, getMe } = require('../controllers/authController');
const { protect, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin/Teacher login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful — returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate, loginAdmin);

/**
 * @swagger
 * /api/auth/staff:
 *   post:
 *     summary: Create a new staff account (admin only)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, role]
 *             properties:
 *               firstName: { type: string }
 *               lastName:  { type: string }
 *               email:     { type: string, format: email }
 *               password:  { type: string, minLength: 8 }
 *               role:      { type: string, enum: [admin, teacher] }
 *     responses:
 *       201:
 *         description: Staff account created
 *       409:
 *         description: Email already registered
 */
router.post('/staff', protect, adminOnly,
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['admin', 'teacher']),
  ],
  validate, createStaffMember);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated admin/teacher profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, getMe);

module.exports = router;
