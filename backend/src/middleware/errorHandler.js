const errorHandler = (err, req, res, next) => {
  // Only log detailed errors in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  }

  // Multer Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds the maximum limit of ${process.env.MAX_FILE_SIZE_MB || 20}MB.`,
      },
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TOO_MANY_FILES',
        message: 'Too many files uploaded in a single request.',
      },
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: messages.join(', '),
      },
    });
  }

  // Mongoose Cast Error (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid format for parameter '${err.path}'.`,
      },
    });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `${field} already exists.`,
      },
    });
  }

  // Generic Status and Message
  const status = err.status || err.statusCode || 500;
  const isServerErr = status >= 500;

  return res.status(status).json({
    success: false,
    error: {
      code: err.code || (isServerErr ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
      message: isServerErr && process.env.NODE_ENV === 'production'
        ? 'An unexpected internal server error occurred.'
        : err.message || 'An error occurred processing the request.',
    },
  });
};

module.exports = errorHandler;
