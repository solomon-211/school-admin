require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');

const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes          = require('./routes/authRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const deviceRoutes        = require('./routes/deviceRoutes');
const studentRoutes       = require('./routes/studentRoutes');
const classRoutes         = require('./routes/classRoutes');
const feeRoutes           = require('./routes/feeRoutes');
const feeScheduleRoutes   = require('./routes/feeScheduleRoutes');
const dashboardRoutes     = require('./routes/dashboardRoutes');
const linkingRoutes       = require('./routes/linkingRoutes');
const termRoutes          = require('./routes/termRoutes');

const errorHandler        = require('./middlewares/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// Allow requests only from the admin frontend origin
app.use(cors({
  origin: process.env.ADMIN_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));

// Rate limiting — prevents brute-force and abuse
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// HTTP request logging (disabled during tests)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'school-admin-api' }));

// Swagger API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'School Admin API Docs',
  customCss: '.swagger-ui .topbar { background-color: #0f172a; }',
}));

// Route registration
app.use('/api/auth',          authRoutes);
app.use('/api/auth',          passwordResetRoutes);
app.use('/api/devices',       deviceRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/classes',       classRoutes);
app.use('/api/fees',          feeRoutes);
app.use('/api/fee-schedules', feeScheduleRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/linking',       linkingRoutes);
app.use('/api/terms',         termRoutes);

// 404 fallback and global error handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5002;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Admin API running on port ${PORT}`));
};

if (require.main === module) {
  start();
}

module.exports = app;
