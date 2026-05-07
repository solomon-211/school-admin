// Global error handler — logs the error and returns a JSON error response.
// In production, hides internal 500 error details from the client.
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  const statusCode = err.statusCode || 500;

  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
