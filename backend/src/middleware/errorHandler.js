const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 20}MB.`,
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ success: false, message: 'Too many files uploaded.' });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists.`,
    });
  }

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
};

module.exports = errorHandler;
