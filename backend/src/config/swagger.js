// Swagger/OpenAPI spec — auto-generated from JSDoc annotations in route files.
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'School Management System — Admin API',
      version: '1.0.0',
      description: 'REST API for the school administration portal. Manages students, classes, teachers, fees, and device verification.',
      contact: { name: 'Elevanda Ventures', email: 'careers@elevandaventures.com' },
    },
    servers: [{ url: 'http://localhost:5002', description: 'Development server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from POST /api/auth/login',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'admin@school.rw' },
            password: { type: 'string', minLength: 8,    example: 'Admin@1234' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user:  { $ref: '#/components/schemas/AdminUser' },
                token: { type: 'string', description: 'JWT token' },
              },
            },
          },
        },
        AdminUser: {
          type: 'object',
          properties: {
            id:        { type: 'string' },
            firstName: { type: 'string' },
            lastName:  { type: 'string' },
            email:     { type: 'string' },
            role:      { type: 'string', enum: ['admin', 'teacher'] },
            isActive:  { type: 'boolean' },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id:          { type: 'string' },
            studentCode: { type: 'string' },
            firstName:   { type: 'string' },
            lastName:    { type: 'string' },
            gender:      { type: 'string', enum: ['male', 'female', 'other'] },
            class:       { type: 'string', description: 'Class ID' },
            feeBalance:  { type: 'number' },
          },
        },
        Class: {
          type: 'object',
          properties: {
            id:           { type: 'string' },
            name:         { type: 'string', example: 'Senior 1A' },
            academicYear: { type: 'string', example: '2024-2025' },
            teachers:     { type: 'array', items: { type: 'object' } },
            timetable:    { type: 'array', items: { type: 'object' } },
          },
        },
        FeeTransaction: {
          type: 'object',
          properties: {
            id:          { type: 'string' },
            type:        { type: 'string', enum: ['deposit', 'withdrawal'] },
            amount:      { type: 'number' },
            status:      { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            description: { type: 'string' },
            createdAt:   { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth',      description: 'Authentication and staff management' },
      { name: 'Devices',   description: 'Device verification and management' },
      { name: 'Students',  description: 'Student records, grades, and attendance' },
      { name: 'Classes',   description: 'Class management and timetables' },
      { name: 'Fees',      description: 'Fee transactions and approval' },
      { name: 'Dashboard', description: 'Statistics and reporting' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
